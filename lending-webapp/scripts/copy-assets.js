const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const source = path.join(projectRoot, "src", "views");
const destination = path.join(projectRoot, "dist", "views");

fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true, force: true });
