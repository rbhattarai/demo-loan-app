import { Router, Request, Response } from "express";
import { readLoans } from "../data/approverStore";

const router = Router();

router.get("/", (req: Request, res: Response) => {
    const loans = readLoans();
    const totalLoans = loans.length;
    const totalAmount = loans.reduce((sum, l) => sum + l.amount, 0);
    const latestLoans = loans.slice(-5).reverse();
    res.render("index", { title: "Lending Dashboard", totalLoans, totalAmount, latestLoans });
});

export default router;
