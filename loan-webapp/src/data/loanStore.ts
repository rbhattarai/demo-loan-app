import fs from "fs";
import path from "path";

const DATA_FILE = path.join(__dirname, "../../../data/loans.json");

export type LoanStatus = "New" | "Pending" | "Approved";

export interface Loan {
    id: string;
    applicantName: string;
    amount: number;
    status: LoanStatus;
    approver: string;
    createdAt: string;
}

export function readLoans(): Loan[] {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, "utf-8").trim();
    const loans: Loan[] = raw ? JSON.parse(raw) : [];
    return loans.map(loan => ({
        ...loan,
        status: loan.status ?? "New",
        approver: loan.approver ?? "",
    }));
}

export function writeLoan(loan: Loan): void {
    const loans = readLoans();
    loans.push(loan);
    fs.writeFileSync(DATA_FILE, JSON.stringify(loans, null, 2));
}

export function deleteLoan(id: string): void {
    const loans = readLoans();
    fs.writeFileSync(DATA_FILE, JSON.stringify(loans.filter(l => l.id !== id), null, 2));
}

export function generateLoanId(): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LOAN-${datePart}-${randPart}`;
}
