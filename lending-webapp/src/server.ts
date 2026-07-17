import express, { Request, Response } from "express";
import path from "path";
import https from "https";
import fs from "fs";

import dashboardRoute from "./routes/index";
import lendorRoute from "./routes/lendor";
import loanRoute from "./routes/loan";
import { addClient, broadcast } from "./events";

const app = express();
const PORT = 3001;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/index", dashboardRoute);
app.use("/lendor", lendorRoute);
app.use("/loan", loanRoute);

app.get("/events", (req: Request, res: Response) => addClient(res));

app.post("/notify", (req: Request, res: Response) => {
    broadcast("loan-updated");
    res.sendStatus(204);
});

app.get("/", (req: Request, res: Response) => {
    res.redirect("/index");
});

// Reuse loan-webapp certs (both apps live in the same repo)
const certsDir = path.join(__dirname, "..", "..", "loan-webapp", "src", "certs");

const options = {
    key: fs.readFileSync(path.join(certsDir, "server-key.pem")),
    cert: fs.readFileSync(path.join(certsDir, "server-cert.pem")),
    requestCert: true,
    rejectUnauthorized: false,
    ca: [
        fs.readFileSync(path.join(certsDir, "client-ca.pem"))
    ]
};

https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS server running at https://localhost:${PORT}`);
});
