// Task auxiliar para desenvolvimento local: envia ETH (fake) para uma carteira,
// para que ela consiga pagar o gas das transacoes (vote, issueToken, ...).
//
// Turings NAO sao distribuidos aqui: nao existe supply inicial. Eles so surgem
// via `issueToken` (admin) ou `vote` (usuarios autorizados).
//
// Uso: npx hardhat faucet <endereco> --network localhost

task("faucet", "Envia 1 ETH (fake) para um endereco")
  .addPositionalParam("receiver", "O endereco que recebera o ETH")
  .setAction(async ({ receiver }, { ethers, network }) => {
    if (network.name === "hardhat") {
      console.warn(
        "Voce esta rodando a faucet na rede 'hardhat', que e criada e destruida " +
          "a cada execucao. Use: --network localhost"
      );
    }

    if (!ethers.utils.isAddress(receiver)) {
      console.error(`Endereco invalido: ${receiver}`);
      return;
    }

    const [sender] = await ethers.getSigners();
    const tx = await sender.sendTransaction({
      to: receiver,
      value: ethers.constants.WeiPerEther,
    });
    await tx.wait();

    console.log(`Enviado 1 ETH para ${receiver}`);
  });