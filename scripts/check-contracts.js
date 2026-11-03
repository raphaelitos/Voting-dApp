// Roda antes de `npm start` / `npm run build` (ver "prestart"/"prebuild" no package.json).
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "src", "contracts");
const required = ["Turing.json", "contract-address.json"];
const missing = required.filter((f) => !fs.existsSync(path.join(dir, f)));

if (missing.length > 0) {
  console.error(`
ERRO: faltam os arquivos do contrato em frontend/src/contracts: ${missing.join(", ")}

Eles sao gerados pelo deploy. Na RAIZ do repositorio, com o no ligado, rode:

  1) npx hardhat node                                       (terminal 1, deixe aberto)
  2) npx hardhat run scripts/deploy.js --network localhost  (terminal 2)

Depois rode "npm start" novamente neste diretorio.
`);
  process.exit(1);
}