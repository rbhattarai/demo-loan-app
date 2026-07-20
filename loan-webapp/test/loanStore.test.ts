import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";

vi.mock("fs");

import { readLoans, writeLoan, deleteLoan, generateLoanId, Loan } from "../src/data/loanStore";

const loan = (overrides: Partial<Loan> = {}): Loan => ({
    id: "LOAN-20260101-AAAA",
    applicantName: "Jane Smith",
    amount: 25000,
    status: "New",
    approver: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
});

describe("loanStore", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("readLoans", () => {
        it("returns an empty array when the data file does not exist", () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            expect(readLoans()).toEqual([]);
            expect(fs.readFileSync).not.toHaveBeenCalled();
        });

        it("returns an empty array when the data file is blank", () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue("   ");

            expect(readLoans()).toEqual([]);
        });

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

            expect(readLoans()).toEqual([
                {
                    id: "LOAN-1",
                    applicantName: "A",
                    amount: 100,
                    status: "New",
                    approver: "",
                    createdAt: "2026-01-01T00:00:00.000Z",
                },
            ]);
        });

        it("preserves an explicit status and approver", () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify([loan({ status: "Approved", approver: "John" })]),
            );

            expect(readLoans()).toEqual([loan({ status: "Approved", approver: "John" })]);
        });
    });

    describe("writeLoan", () => {
        it("appends the new loan to the existing list and persists it", () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(
                JSON.stringify([loan({ id: "LOAN-EXISTING" })]),
            );

            const newLoan = loan({ id: "LOAN-NEW" });
            writeLoan(newLoan);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining("loans.json"),
                JSON.stringify([loan({ id: "LOAN-EXISTING" }), newLoan], null, 2),
            );
        });
    });

    describe("deleteLoan", () => {
        it("removes only the loan matching the given id", () => {
            const keep = loan({ id: "LOAN-KEEP" });
            const remove = loan({ id: "LOAN-REMOVE" });
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([keep, remove]));

            deleteLoan("LOAN-REMOVE");

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining("loans.json"),
                JSON.stringify([keep], null, 2),
            );
        });

        it("is a no-op (writes the unchanged list) when the id is not found", () => {
            const existing = [loan({ id: "LOAN-1" })];
            vi.mocked(fs.existsSync).mockReturnValue(true);
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(existing));

            deleteLoan("LOAN-DOES-NOT-EXIST");

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining("loans.json"),
                JSON.stringify(existing, null, 2),
            );
        });
    });

    describe("generateLoanId", () => {
        it("produces a LOAN-YYYYMMDD-XXXX id", () => {
            expect(generateLoanId()).toMatch(/^LOAN-\d{8}-[A-Z0-9]{4}$/);
        });

        it("produces a unique id on each call", () => {
            const ids = new Set(Array.from({ length: 20 }, () => generateLoanId()));
            expect(ids.size).toBeGreaterThan(1);
        });
    });
});
