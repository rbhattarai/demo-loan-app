import { Router, Request, Response } from "express";
import { readLoans, writeLoan, deleteLoan, generateLoanId } from "../data/loanStore";
import { notifyApp } from "../events";

const router = Router();

router.get("/", (req: Request, res: Response) => {
    const loans = readLoans();
    res.render("loan", { title: "Loan Management", loans });
});

router.post("/", (req: Request, res: Response) => {
    const { applicantName, amount } = req.body;
    const loan = {
        id: generateLoanId(),
        applicantName: String(applicantName).trim(),
        amount: Number(amount),
        status: "New" as const,
        approver: "",
        createdAt: new Date().toISOString(),
    };
    writeLoan(loan);
    notifyApp(`${process.env.LENDING_WEBAPP_URL ?? "https://localhost:3001"}/notify`);
    res.redirect("/loan");
});

router.post("/:id/delete", (req: Request, res: Response) => {
    deleteLoan(String(req.params.id));
    notifyApp(`${process.env.LENDING_WEBAPP_URL ?? "https://localhost:3001"}/notify`);
    res.redirect("/loan");
});

router.get("/api/loans", (req: Request, res: Response) => {
    res.json({ loans: readLoans() });
});

export default router;
