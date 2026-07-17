import { Router, Request, Response } from "express";
import { readApprovers, writeApprover, deleteApprover, generateApproverId } from "../data/approverStore";

const router = Router();

router.get("/", (req: Request, res: Response) => {
    const approvers = readApprovers();
    res.render("lendor", { title: "Lendor Management", approvers });
});

router.post("/", (req: Request, res: Response) => {
    const { approverName } = req.body;
    const approver = {
        id: generateApproverId(),
        name: String(approverName).trim(),
        createdAt: new Date().toISOString(),
    };
    writeApprover(approver);
    res.redirect("/lendor");
});

router.post("/:id/delete", (req: Request, res: Response) => {
    deleteApprover(String(req.params.id));
    res.redirect("/lendor");
});

export default router;
