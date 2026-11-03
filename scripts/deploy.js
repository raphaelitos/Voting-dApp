// Deploy do contrato Turing. Uso: npx hardhat run scripts/deploy.js --network localhost

const path = require("path");

async function main() {
  // This is just a convenience check
  if (network.name === "hardhat") {
    console.warn(
      "You are trying to deploy a contract to the Hardhat Network, which" +
        "gets automatically created and destroyed every time. Use the Hardhat" +
        " option '--network localhost'"
    );
  }

  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Turing = await ethers.getContractFactory("Turing");
  const turing = await Turing.deploy();
  await turing.deployed();

  console.log("Turing address:", turing.address);

  // Salva ABI e endereco do contrato no frontend (src/contracts/, ignorado pelo git).
  saveFrontendFiles(turing);
}

function saveFrontendFiles(turing) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, "contract-address.json"),
    JSON.stringify({ Turing: turing.address }, undefined, 2)
  );

  const TuringArtifact = artifacts.readArtifactSync("Turing");

  fs.writeFileSync(
    path.join(contractsDir, "Turing.json"),
    JSON.stringify(TuringArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });