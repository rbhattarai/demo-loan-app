import fs from "fs";
import path from "path";

const DATA_DIR = path.join(__dirname, "../../../data");
const APPROVERS_FILE = path.join(DATA_DIR, "loan-approvers.json");
const LOANS_FILE = path.join(DATA_DIR, "loans.json");

export interface Approver {
    id: string;
    name: string;
    createdAt: string;
}

export interface Loan {
    id: string;
    applicantName: string;
    amount: number;
    status: string;
    approver: string;
    createdAt: string;
}

export function readApprovers(): Approver[] {
    if (!fs.existsSync(APPROVERS_FILE)) return [];
    const raw = fs.readFileSync(APPROVERS_FILE, "utf-8").trim();
    return raw ? JSON.parse(raw) : [];
}

export function writeApprover(approver: Approver): void {
    const approvers = readApprovers();
    approvers.push(approver);
    fs.writeFileSync(APPROVERS_FILE, JSON.stringify(approvers, null, 2));
}

export function readLoans(): Loan[] {
    if (!fs.existsSync(LOANS_FILE)) return [];
    const raw = fs.readFileSync(LOANS_FILE, "utf-8").trim();
    const loans: Loan[] = raw ? JSON.parse(raw) : [];
    return loans.map((loan) => ({
        ...loan,
        status: loan.status ?? "New",
        approver: loan.approver ?? "",
    }));
}

export function writeLoan(updated: Loan): void {
    const loans = readLoans();
    const idx = loans.findIndex((l) => l.id === updated.id);
    if (idx === -1) return;
    loans[idx] = updated;
    fs.writeFileSync(LOANS_FILE, JSON.stringify(loans, null, 2));
}

export function deleteApprover(id: string): void {
    const approvers = readApprovers();
    fs.writeFileSync(
        APPROVERS_FILE,
        JSON.stringify(
            approvers.filter((a) => a.id !== id),
            null,
            2,
        ),
    );
}

export function generateApproverId(): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `APPR-${datePart}-${randPart}`;
}
