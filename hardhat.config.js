require("@nomicfoundation/hardhat-toolbox");

// Task auxiliar (envio de ETH fake para carteiras locais).
require("./tasks/faucet");

// Solidity 0.8.17 + OpenZeppelin 4.9.x: compativel com o Hardhat v2.12.
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
};