import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";

vi.mock("fs");

import {
    readApprovers,
    writeApprover,
    deleteApprover,
    generateApproverId,
    readLoans,
    writeLoan,
    Approver,
    Loan,
} from "../src/data/approverStore";

const approver = (overrides: Partial<Approver> = {}): Approver => ({
    id: "APPR-20260101-AAAA",
    name: "John Doe",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
});

const loan = (overrides: Partial<Loan> = {}): Loan => ({
    id: "LOAN-1",
    applicantName: "Jane Smith",
    amount: 25000,
    status: "New",
    approver: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
});

describe("approverStore", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("readApprovers", () => {
        it("returns an empty array when the file does not exist", () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            expect(readApprovers()).toEqual([]);
        });

        it("parses approvers from the file", () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([approver()]));
            expect(readApprovers()).toEqual([approver()]);
        });
    });

    describe("writeApprover", () => {
        it("appends the new approver and persists the full list", () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify([approver({ id: "APPR-EXISTING" })]),
            );

            writeApprover(approver({ id: "APPR-NEW" }));

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining("loan-approvers.json"),
                JSON.stringify(
                    [approver({ id: "APPR-EXISTING" }), approver({ id: "APPR-NEW" })],
                    null,
                    2,
                ),
            );
        });
    });

    describe("deleteApprover", () => {
        it("removes only the matching approver", () => {
            const keep = approver({ id: "APPR-KEEP" });
            const remove = approver({ id: "APPR-REMOVE" });
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([keep, remove]));

            deleteApprover("APPR-REMOVE");

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining("loan-approvers.json"),
                JSON.stringify([keep], null, 2),
            );
        });
    });

    describe("generateApproverId", () => {
        it("produces an APPR-YYYYMMDD-XXXX id", () => {
            expect(generateApproverId()).toMatch(/^APPR-\d{8}-[A-Z0-9]{4}$/);
        });
    });

    describe("readLoans", () => {
        it("defaults a missing status to New and a missing approver to an empty string", () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify([
                    {
                        id: "LOAN-1",
                        applicantName: "A",
                        amount: 100,
                        createdAt: "2026-01-01T00:00:00.000Z",
                    },
                ]),
            );

            expect(readLoans()).toEqual([loan({ applicantName: "A", amount: 100 })]);
        });
    });

    describe("writeLoan", () => {
        it("replaces the matching loan in place", () => {
            const original = loan({ status: "New" });
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([original]));

            const updated = loan({ status: "Pending", approver: "John Doe" });
            writeLoan(updated);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining("loans.json"),
                JSON.stringify([updated], null, 2),
            );
        });

        it("is a no-op when the loan id is not found", () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([loan({ id: "LOAN-1" })]));

            writeLoan(loan({ id: "LOAN-DOES-NOT-EXIST" }));

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });
    });
});
