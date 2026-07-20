import https from "https";
import path from "path";
import fs from "fs";

import app from "./app";

const PORT = 3000;

const options = {
    key: fs.readFileSync(path.join(__dirname, "certs", "server-key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "certs", "server-cert.pem")),
    requestCert: true,
    rejectUnauthorized: false,
    ca: [fs.readFileSync(path.join(__dirname, "certs", "client-ca.pem"))],
};

https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS server running at https://localhost:${PORT}`);
});
