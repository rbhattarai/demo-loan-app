import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/data/loanStore", () => ({
    readLoans: vi.fn(),
    writeLoan: vi.fn(),
    deleteLoan: vi.fn(),
    generateLoanId: vi.fn(),
}));
vi.mock("../src/events", () => ({
    addClient: vi.fn(),
    broadcast: vi.fn(),
    notifyApp: vi.fn(),
}));

import app from "../src/app";
import { readLoans, writeLoan, deleteLoan, generateLoanId } from "../src/data/loanStore";
import { notifyApp } from "../src/events";

describe("GET /loan", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("renders the loan management page", async () => {
        vi.mocked(readLoans).mockReturnValue([]);

        const res = await request(app).get("/loan");

        expect(res.status).toBe(200);
        expect(res.text).toContain("Loan Management");
    });
});

describe("POST /loan", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(generateLoanId).mockReturnValue("LOAN-20260101-AAAA");
    });

    it("creates a loan with status New, trims the applicant name, and notifies lending-webapp", async () => {
        const res = await request(app)
            .post("/loan")
            .type("form")
            .send({ applicantName: "  Jane Smith  ", amount: "25000" });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/loan");
        expect(writeLoan).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "LOAN-20260101-AAAA",
                applicantName: "Jane Smith",
                amount: 25000,
                status: "New",
                approver: "",
            }),
        );
        expect(notifyApp).toHaveBeenCalledWith(expect.stringContaining("/notify"));
    });
});

describe("POST /loan/:id/delete", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("deletes the loan, notifies lending-webapp, and redirects", async () => {
        const res = await request(app).post("/loan/LOAN-1/delete");

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/loan");
        expect(deleteLoan).toHaveBeenCalledWith("LOAN-1");
        expect(notifyApp).toHaveBeenCalledWith(expect.stringContaining("/notify"));
    });
});

describe("GET /loan/api/loans", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("returns all loans as JSON", async () => {
        const loans = [
            {
                id: "LOAN-1",
                applicantName: "A",
                amount: 1,
                status: "New",
                approver: "",
                createdAt: "2026-01-01T00:00:00.000Z",
            },
        ];
        vi.mocked(readLoans).mockReturnValue(loans);

        const res = await request(app).get("/loan/api/loans");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ loans });
    });
});
