import express, { Request, Response } from "express";
import path from "path";
import https from "https";
import fs from "fs";

import dashboardRoute from "./routes/index";
import loanRoute from "./routes/loan";
import { addClient, broadcast } from "./events";

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/index", dashboardRoute);
app.use("/loan", loanRoute);

app.get("/events", (req: Request, res: Response) => addClient(res));

app.post("/notify", (req: Request, res: Response) => {
    broadcast("loan-updated");
    res.sendStatus(204);
});

app.get("/", (req: Request, res: Response) => {
    res.redirect("/index");
});

const options = {
  key: fs.readFileSync(path.join(__dirname, "certs", "server-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "certs", "server-cert.pem")),
  requestCert: true,
  rejectUnauthorized: false,
  ca: [
    fs.readFileSync(path.join(__dirname, "certs", "client-ca.pem"))
  ]
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});
