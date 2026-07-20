import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/data/approverStore", () => ({
    readApprovers: vi.fn(),
    writeApprover: vi.fn(),
    deleteApprover: vi.fn(),
    generateApproverId: vi.fn(),
    readLoans: vi.fn(),
    writeLoan: vi.fn(),
}));
vi.mock("../src/events", () => ({
    addClient: vi.fn(),
    broadcast: vi.fn(),
    notifyApp: vi.fn(),
}));

import app from "../src/app";
import { readLoans, readApprovers, writeLoan } from "../src/data/approverStore";
import { notifyApp } from "../src/events";

const loan = (overrides: Record<string, unknown> = {}) => ({
    id: "LOAN-1",
    applicantName: "Jane Smith",
    amount: 25000,
    status: "New",
    approver: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
});

describe("GET /loan/:id", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("renders the loan detail page when the loan exists", async () => {
        vi.mocked(readLoans).mockReturnValue([loan()]);
        vi.mocked(readApprovers).mockReturnValue([]);

        const res = await request(app).get("/loan/LOAN-1");

        expect(res.status).toBe(200);
        expect(res.text).toContain("Loan Detail");
    });

    it("returns 404 when the loan does not exist", async () => {
        vi.mocked(readLoans).mockReturnValue([]);

        const res = await request(app).get("/loan/LOAN-MISSING");

        expect(res.status).toBe(404);
    });
});

describe("POST /loan/:id — assign-approver", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("assigns the approver, moves status from New to Pending, and notifies loan-webapp", async () => {
        vi.mocked(readLoans).mockReturnValue([loan({ status: "New" })]);

        const res = await request(app)
            .post("/loan/LOAN-1")
            .type("form")
            .send({ action: "assign-approver", approver: "  John Doe  " });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/loan/LOAN-1");
        expect(writeLoan).toHaveBeenCalledWith(
            expect.objectContaining({ id: "LOAN-1", approver: "John Doe", status: "Pending" }),
        );
        expect(notifyApp).toHaveBeenCalledWith(expect.stringContaining("/notify"));
    });

    it("does not move status back from Approved when re-assigning", async () => {
        vi.mocked(readLoans).mockReturnValue([loan({ status: "Approved", approver: "Existing" })]);

        await request(app)
            .post("/loan/LOAN-1")
            .type("form")
            .send({ action: "assign-approver", approver: "New Name" });

        expect(writeLoan).toHaveBeenCalledWith(expect.objectContaining({ status: "Approved" }));
    });
});

describe("POST /loan/:id — approve / reject", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("approves a pending loan", async () => {
        vi.mocked(readLoans).mockReturnValue([loan({ status: "Pending", approver: "John Doe" })]);

        const res = await request(app)
            .post("/loan/LOAN-1")
            .type("form")
            .send({ action: "approve" });

        expect(res.status).toBe(302);
        expect(writeLoan).toHaveBeenCalledWith(expect.objectContaining({ status: "Approved" }));
        expect(notifyApp).toHaveBeenCalled();
    });

    it("rejects a pending loan", async () => {
        vi.mocked(readLoans).mockReturnValue([loan({ status: "Pending", approver: "John Doe" })]);

        const res = await request(app).post("/loan/LOAN-1").type("form").send({ action: "reject" });

        expect(res.status).toBe(302);
        expect(writeLoan).toHaveBeenCalledWith(expect.objectContaining({ status: "Rejected" }));
        expect(notifyApp).toHaveBeenCalled();
    });

    it("returns 404 for an unknown loan id", async () => {
        vi.mocked(readLoans).mockReturnValue([]);

        const res = await request(app)
            .post("/loan/LOAN-MISSING")
            .type("form")
            .send({ action: "approve" });

        expect(res.status).toBe(404);
    });
});
