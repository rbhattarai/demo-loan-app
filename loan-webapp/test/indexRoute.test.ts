import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

vi.mock("../src/data/loanStore", () => ({
    readLoans: vi.fn(),
}));
vi.mock("../src/events", () => ({
    addClient: vi.fn(),
    broadcast: vi.fn(),
    notifyApp: vi.fn(),
}));

import app from "../src/app";
import { readLoans } from "../src/data/loanStore";

describe("GET /index", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("renders the dashboard with totals computed from all loans", async () => {
        vi.mocked(readLoans).mockReturnValue([
            {
                id: "LOAN-1",
                applicantName: "A",
                amount: 100,
                status: "New",
                approver: "",
                createdAt: "2026-01-01T00:00:00.000Z",
            },
            {
                id: "LOAN-2",
                applicantName: "B",
                amount: 250,
                status: "Approved",
                approver: "John",
                createdAt: "2026-01-02T00:00:00.000Z",
            },
        ]);

        const res = await request(app).get("/index");

        expect(res.status).toBe(200);
        expect(res.text).toContain("App Dashboard");
        expect(res.text).toMatch(/350/); // total amount
    });

    it("renders an empty state when there are no loans", async () => {
        vi.mocked(readLoans).mockReturnValue([]);

        const res = await request(app).get("/index");

        expect(res.status).toBe(200);
        expect(res.text).toContain("No loans yet");
    });
});

describe("GET /", () => {
    it("redirects to /index", async () => {
        const res = await request(app).get("/");

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/index");
    });
});
