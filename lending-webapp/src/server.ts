import https from "https";
import path from "path";
import fs from "fs";

import app from "./app";

const PORT = 3001;

// Reuse loan-webapp certs (both apps live in the same repo)
const certsDir = path.join(__dirname, "..", "..", "loan-webapp", "src", "certs");

const options = {
    key: fs.readFileSync(path.join(certsDir, "server-key.pem")),
    cert: fs.readFileSync(path.join(certsDir, "server-cert.pem")),
    requestCert: true,
    rejectUnauthorized: false,
    ca: [fs.readFileSync(path.join(certsDir, "client-ca.pem"))],
};

https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS server running at https://localhost:${PORT}`);
});
