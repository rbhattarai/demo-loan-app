import https from "https";
import { Response } from "express";

const clients = new Set<Response>();

export function addClient(res: Response): void {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    clients.add(res);
    res.on("close", () => clients.delete(res));
}

export function broadcast(event: string): void {
    const payload = `event: ${event}\ndata: {}\n\n`;
    clients.forEach((res) => res.write(payload));
}

export function notifyApp(targetUrl: string): void {
    try {
        const url = new URL(targetUrl);
        const req = https.request({
            hostname: url.hostname,
            port: Number(url.port),
            path: url.pathname,
            method: "POST",
            rejectUnauthorized: false,
        });
        req.on("error", () => {});
        req.end();
    } catch {
        // fire-and-forget
    }
}
