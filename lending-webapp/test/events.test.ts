import { describe, it, expect, vi, beforeEach } from "vitest";
import https from "https";
import { Response } from "express";

vi.mock("https");

import { addClient, broadcast, notifyApp } from "../src/events";

function fakeResponse() {
    return {
        setHeader: vi.fn(),
        flushHeaders: vi.fn(),
        write: vi.fn(),
        on: vi.fn(),
    } as unknown as Response;
}

describe("addClient / broadcast", () => {
    it("sends SSE headers and registers the client for broadcast", () => {
        const client = fakeResponse();

        addClient(client);
        broadcast("loan-updated");

        expect(client.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
        expect(client.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
        expect(client.setHeader).toHaveBeenCalledWith("Connection", "keep-alive");
        expect(client.flushHeaders).toHaveBeenCalled();
        expect(client.write).toHaveBeenCalledWith("event: loan-updated\ndata: {}\n\n");
    });

    it("removes the client from the broadcast set once its connection closes", () => {
        const client = fakeResponse();
        addClient(client);

        const closeHandler = vi
            .mocked(client.on)
            .mock.calls.find(([event]) => event === "close")?.[1];
        expect(closeHandler).toBeDefined();
        closeHandler?.();

        broadcast("loan-updated");

        expect(client.write).not.toHaveBeenCalled();
    });
});

describe("notifyApp", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("POSTs to the target URL with TLS verification disabled", () => {
        const req = { on: vi.fn(), end: vi.fn() };
        vi.mocked(https.request).mockReturnValue(req as never);

        notifyApp("https://localhost:3000/notify");

        expect(https.request).toHaveBeenCalledWith(
            expect.objectContaining({
                hostname: "localhost",
                port: 3000,
                path: "/notify",
                method: "POST",
                rejectUnauthorized: false,
            }),
        );
        expect(req.end).toHaveBeenCalled();
    });

    it("swallows request errors instead of throwing", () => {
        const req = { on: vi.fn(), end: vi.fn() };
        vi.mocked(https.request).mockReturnValue(req as never);

        notifyApp("https://localhost:3000/notify");
        const errorHandler = vi.mocked(req.on).mock.calls.find(([event]) => event === "error")?.[1];

        expect(() => errorHandler?.(new Error("boom"))).not.toThrow();
    });

    it("does not throw when given an invalid URL", () => {
        expect(() => notifyApp("not-a-url")).not.toThrow();
        expect(https.request).not.toHaveBeenCalled();
    });
});
