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
import {
    readApprovers,
    writeApprover,
    deleteApprover,
    generateApproverId,
} from "../src/data/approverStore";

describe("GET /lendor", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("renders the lendor management page", async () => {
        vi.mocked(readApprovers).mockReturnValue([]);

        const res = await request(app).get("/lendor");

        expect(res.status).toBe(200);
        expect(res.text).toContain("Lendor Management");
    });
});

describe("POST /lendor", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.mocked(generateApproverId).mockReturnValue("APPR-20260101-AAAA");
    });

    it("creates an approver with the trimmed name and redirects", async () => {
        const res = await request(app)
            .post("/lendor")
            .type("form")
            .send({ approverName: "  John Doe  " });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/lendor");
        expect(writeApprover).toHaveBeenCalledWith(
            expect.objectContaining({ id: "APPR-20260101-AAAA", name: "John Doe" }),
        );
    });
});

describe("POST /lendor/:id/delete", () => {
    it("deletes the approver and redirects", async () => {
        const res = await request(app).post("/lendor/APPR-1/delete");

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/lendor");
        expect(deleteApprover).toHaveBeenCalledWith("APPR-1");
    });
});
