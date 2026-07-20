import { Router, Request, Response } from "express";
import { readLoans, readApprovers, writeLoan } from "../data/approverStore";
import { notifyApp } from "../events";

const router = Router();

router.get("/:id", (req: Request, res: Response) => {
    const loans = readLoans();
    const loan = loans.find((l) => l.id === req.params.id);
    if (!loan) {
        res.status(404).send("Loan not found");
        return;
    }
    const approvers = readApprovers();
    res.render("loan", { title: "Loan Detail", loan, approvers });
});

router.post("/:id", (req: Request, res: Response) => {
    const loans = readLoans();
    const loan = loans.find((l) => l.id === req.params.id);
    if (!loan) {
        res.status(404).send("Loan not found");
        return;
    }

    const { action, approver } = req.body;

    if (action === "assign-approver" && approver) {
        loan.approver = String(approver).trim();
        if (loan.status === "New") loan.status = "Pending";
        writeLoan(loan);
        notifyApp(`${process.env.LOAN_WEBAPP_URL ?? "https://localhost:3000"}/notify`);
    } else if (action === "approve") {
        loan.status = "Approved";
        writeLoan(loan);
        notifyApp(`${process.env.LOAN_WEBAPP_URL ?? "https://localhost:3000"}/notify`);
    } else if (action === "reject") {
        loan.status = "Rejected";
        writeLoan(loan);
        notifyApp(`${process.env.LOAN_WEBAPP_URL ?? "https://localhost:3000"}/notify`);
    }

    res.redirect(`/loan/${loan.id}`);
});

export default router;
