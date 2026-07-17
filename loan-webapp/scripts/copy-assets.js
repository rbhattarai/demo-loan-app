const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const copyTargets = ["certs", "views"];

for (const target of copyTargets) {
  const source = path.join(projectRoot, "src", target);
  const destination = path.join(projectRoot, "dist", target);

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}