const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Turing Smart Contract", function () {
  // Fixture para resetar o estado do contrato mais rapidamente entre os testes
  async function deployTuringFixture() {
    // Pegando as contas locais de teste do Hardhat
    // As contas 1..5 do Hardhat ja sao os enderecos hardcoded de nome1..nome5 no construtor.
    // Apenas a professora (roberta) nao e uma conta do Hardhat, entao ela e remapeada.
    const [owner, nome1, nome2, nome3, nome4, nome5, roberta] = await ethers.getSigners();

    // Fazendo o deploy do contrato
    const Turing = await ethers.getContractFactory("Turing");
    const turing = await Turing.deploy();

    // O 'owner' (deployer) é um admin e pode rodar updateUser.
    await turing.updateUser("roberta", roberta.address);

    return { turing, owner, roberta, nome1, nome2, nome3, nome4, nome5 };
  }

  describe("Deployment e Setup", function () {
    it("Deve definir o nome e símbolo corretos do token", async function () {
      const { turing } = await loadFixture(deployTuringFixture);
      expect(await turing.name()).to.equal("RaphaTuring");
      expect(await turing.symbol()).to.equal("RT");
    });

    it("Deve mapear corretamente os usuários após o setup do teste", async function () {
      const { turing, nome1 } = await loadFixture(deployTuringFixture);
      expect(await turing.users("nome1")).to.equal(nome1.address);
      expect(await turing.addresses(nome1.address)).to.equal("nome1");
    });
  });

  describe("Controle de Acesso (Administração)", function () {
    it("Dono do contrato deve conseguir emitir tokens (issueToken)", async function () {
      const { turing, owner, nome1 } = await loadFixture(deployTuringFixture);
      
      await turing.connect(owner).issueToken("nome1", 100);
      expect(await turing.balanceOf(nome1.address)).to.equal(100);
    });

    it("Roberta deve conseguir pausar e retomar a votação (onlyAdmin)", async function () {
      const { turing, roberta } = await loadFixture(deployTuringFixture);
      
      expect(await turing.isVotingActive()).to.equal(true); // inicia ativa
      await turing.connect(roberta).votingOff();
      expect(await turing.isVotingActive()).to.equal(false);
      await turing.connect(roberta).votingOn();
      expect(await turing.isVotingActive()).to.equal(true);
    });

    it("Usuário comum NAO deve conseguir emitir tokens", async function () {
      const { turing, nome1 } = await loadFixture(deployTuringFixture);
      
      await expect(
        turing.connect(nome1).issueToken("nome2", 50)
      ).to.be.revertedWith("Apenas o dono do contrato ou a Roberta podem executar essa acao!");
    });
  });

  describe("Lógica de Votação", function () {
    it("Deve permitir o voto e emitir os tokens para o candidato", async function () {
      const { turing, nome1, nome2 } = await loadFixture(deployTuringFixture);
      
      // nome1 vota em nome2 (2 Turings)
      // Nao ha evento customizado: o mint do ERC-20 ja emite Transfer(0x0 -> candidato)
      await expect(turing.connect(nome1).vote("nome2", 2))
        .to.emit(turing, "Transfer")
        .withArgs(ethers.constants.AddressZero, nome2.address, 2);

      // nome2 deve ter recebido 2 Turings
      expect(await turing.balanceOf(nome2.address)).to.equal(2);
    });

    it("NAO deve permitir votar em si mesmo", async function () {
      const { turing, nome1 } = await loadFixture(deployTuringFixture);
      
      await expect(
        turing.connect(nome1).vote("nome1", 1)
      ).to.be.revertedWith("Voce nao pode votar em si mesmo!");
    });

    it("NAO deve permitir votar duas vezes no mesmo candidato", async function () {
      const { turing, nome1, nome2 } = await loadFixture(deployTuringFixture);
      
      await turing.connect(nome1).vote("nome2", 1);
      
      await expect(
        turing.connect(nome1).vote("nome2", 1)
      ).to.be.revertedWith("Voce ja votou neste codinome!");
    });

    it("NAO deve permitir votar com quantidade fora do intervalo (0, 2]", async function () {
      const { turing, nome1, nome2 } = await loadFixture(deployTuringFixture);
      
      await expect(
        turing.connect(nome1).vote("nome2", 0)
      ).to.be.revertedWith("A quantidade de turings deve ser maior que 0 e menor ou igual a 2");

      await expect(
        turing.connect(nome1).vote("nome2", 3)
      ).to.be.revertedWith("A quantidade de turings deve ser maior que 0 e menor ou igual a 2");
    });

    it("NAO deve permitir votar se a votação estiver desativada", async function () {
      const { turing, owner, nome1, nome2 } = await loadFixture(deployTuringFixture);
      
      await turing.connect(owner).votingOff();
      
      await expect(
        turing.connect(nome1).vote("nome2", 1)
      ).to.be.revertedWith("Erro: a votacao deve estar ativa!");
    });
  });

  describe("Recompensa de Votos", function () {
    it("Deve recompensar o eleitor com 1 Turing após 10 votos", async function () {
      const { turing, owner, nome1 } = await loadFixture(deployTuringFixture);
      
      // O saldo inicial do eleitor deve ser 0
      expect(await turing.balanceOf(nome1.address)).to.equal(0);

      // Vamos criar 10 candidatos dummy para o nome1 conseguir votar 10 vezes
      for (let i = 0; i < 10; i++) {
        let dummyCandidate = "candidato" + i;
        // Gera um endereço aleatório e registra o usuário (requer permissão de admin)
        await turing.connect(owner).updateUser(dummyCandidate, ethers.Wallet.createRandom().address);
        
        // nome1 vota no candidato gerado
        await turing.connect(nome1).vote(dummyCandidate, 1);
      }

      // Após 10 votos em candidatos distintos, a lógica % 10 deve mintar 1 token para o nome1
      expect(await turing.balanceOf(nome1.address)).to.equal(1);
    });
  });

  describe("Requisitos adicionais da especificação", function () {
    it("Nao deve haver minting no construtor (supply inicial = 0)", async function () {
      const { turing } = await loadFixture(deployTuringFixture);
      expect(await turing.totalSupply()).to.equal(0);
    });

    it("Constructor deve inicializar os usuarios da tabela", async function () {
      const { turing, nome1, nome2, nome3, nome4, nome5 } = await loadFixture(deployTuringFixture);
      expect(await turing.users("nome1")).to.equal(nome1.address);
      expect(await turing.users("nome2")).to.equal(nome2.address);
      expect(await turing.users("nome3")).to.equal(nome3.address);
      expect(await turing.users("nome4")).to.equal(nome4.address);
      expect(await turing.users("nome5")).to.equal(nome5.address);
    });

    it("updateUser: admin atualiza o endereco e o antigo perde acesso", async function () {
      const { turing, owner, nome1, nome2 } = await loadFixture(deployTuringFixture);
      const novo = ethers.Wallet.createRandom().connect(ethers.provider);
      await turing.connect(owner).updateUser("nome1", novo.address);
      expect(await turing.users("nome1")).to.equal(novo.address);
      expect(await turing.addresses(nome1.address)).to.equal("");
      await expect(turing.connect(nome1).vote("nome2", 1))
        .to.be.revertedWith("Voce nao possui permissao para votar!");
    });

    it("updateUser: usuario comum nao pode executar", async function () {
      const { turing, nome1 } = await loadFixture(deployTuringFixture);
      await expect(turing.connect(nome1).updateUser("nome1", nome1.address))
        .to.be.revertedWith("Apenas o dono do contrato ou a Roberta podem executar essa acao!");
    });

    it("updateUser: codinome vazio deve reverter", async function () {
      const { turing, owner, nome1 } = await loadFixture(deployTuringFixture);
      await expect(turing.connect(owner).updateUser("", nome1.address))
        .to.be.revertedWith("Erro: codinome nao pode ser vazio");
    });

    it("updateUser: nao permite o mesmo endereco em dois codinomes", async function () {
      const { turing, owner, nome1 } = await loadFixture(deployTuringFixture);
      await expect(turing.connect(owner).updateUser("nome2", nome1.address))
        .to.be.revertedWith("Erro: endereco ja pertence a outro codinome");
    });

    it("votingOn/votingOff: apenas admin; votingOn reabre a votacao", async function () {
      const { turing, owner, nome1 } = await loadFixture(deployTuringFixture);
      await expect(turing.connect(nome1).votingOff())
        .to.be.revertedWith("Apenas o dono do contrato ou a Roberta podem executar essa acao!");
      await expect(turing.connect(nome1).votingOn())
        .to.be.revertedWith("Apenas o dono do contrato ou a Roberta podem executar essa acao!");
      await turing.connect(owner).votingOff();
      await turing.connect(owner).votingOn();
      await expect(turing.connect(nome1).vote("nome2", 1)).to.not.be.reverted;
    });

    it("issueToken: codinome inexistente deve reverter", async function () {
      const { turing, owner } = await loadFixture(deployTuringFixture);
      await expect(turing.connect(owner).issueToken("ninguem", 1))
        .to.be.revertedWith("Usuario nao existe");
    });

    it("vote: endereco nao autorizado nao pode votar", async function () {
      const { turing } = await loadFixture(deployTuringFixture);
      const [, , , , , , , estranho] = await ethers.getSigners();
      await expect(turing.connect(estranho).vote("nome2", 1))
        .to.be.revertedWith("Voce nao possui permissao para votar!");
    });

    it("vote: o 9o voto nao rende bonus, o 10o sim (e so ele)", async function () {
      const { turing, owner, nome1 } = await loadFixture(deployTuringFixture);
      for (let i = 0; i < 9; i++) {
        await turing.connect(owner).updateUser("c" + i, ethers.Wallet.createRandom().address);
        await turing.connect(nome1).vote("c" + i, 1);
      }
      expect(await turing.balanceOf(nome1.address)).to.equal(0);
      await turing.connect(owner).updateUser("c9", ethers.Wallet.createRandom().address);
      await turing.connect(nome1).vote("c9", 1);
      expect(await turing.balanceOf(nome1.address)).to.equal(1);
    });
  });

  describe("Getters e casos de borda", function () {
    it("isAdmin: true para owner e Roberta, false para os demais", async function () {
      const { turing, owner, roberta, nome1 } = await loadFixture(deployTuringFixture);
      expect(await turing.isAdmin(owner.address)).to.equal(true);
      expect(await turing.isAdmin(roberta.address)).to.equal(true);
      expect(await turing.isAdmin(nome1.address)).to.equal(false);
    });

    it("isAdmin acompanha a troca de endereco da Roberta", async function () {
      const { turing, owner, roberta } = await loadFixture(deployTuringFixture);
      const novo = ethers.Wallet.createRandom().connect(ethers.provider);
      await turing.connect(owner).updateUser("roberta", novo.address);
      expect(await turing.isAdmin(roberta.address)).to.equal(false);
      expect(await turing.isAdmin(novo.address)).to.equal(true);
    });

    it("Roberta (admin) tambem consegue emitir tokens", async function () {
      const { turing, roberta, nome1 } = await loadFixture(deployTuringFixture);
      await turing.connect(roberta).issueToken("nome1", 5);
      expect(await turing.balanceOf(nome1.address)).to.equal(5);
    });

    it("E permitido votar na Roberta", async function () {
      const { turing, nome1, roberta } = await loadFixture(deployTuringFixture);
      await turing.connect(nome1).vote("roberta", 2);
      expect(await turing.balanceOf(roberta.address)).to.equal(2);
    });

    it("vote: codinome vazio ou inexistente deve reverter", async function () {
      const { turing, nome1 } = await loadFixture(deployTuringFixture);
      await expect(turing.connect(nome1).vote("", 1))
        .to.be.revertedWith("Erro: codinome de destino nao pode ser vazio");
      await expect(turing.connect(nome1).vote("ninguem", 1))
        .to.be.revertedWith("Erro: o candidato nao existe");
    });

    it("vote: aceita os limites 1 e 2 (voto individual por candidato)", async function () {
      const { turing, nome1, nome2, nome3 } = await loadFixture(deployTuringFixture);
      await turing.connect(nome1).vote("nome2", 1);
      await turing.connect(nome1).vote("nome3", 2);
      expect(await turing.balanceOf(nome2.address)).to.equal(1);
      expect(await turing.balanceOf(nome3.address)).to.equal(2);
    });

    it("hasVote e voteCount refletem os votos por codinome", async function () {
      const { turing, nome1 } = await loadFixture(deployTuringFixture);
      await turing.connect(nome1).vote("nome2", 1);
      expect(await turing.hasVote("nome1", "nome2")).to.equal(true);
      expect(await turing.hasVote("nome1", "nome3")).to.equal(false);
      expect(await turing.hasVote("nome2", "nome1")).to.equal(false); // direcional
      expect(await turing.voteCount("nome1")).to.equal(1);
    });

    it("Contagem e por codinome: trocar o endereco preserva historico e progresso do bonus", async function () {
      const { turing, owner, nome1 } = await loadFixture(deployTuringFixture);
      for (let i = 0; i < 5; i++) {
        await turing.connect(owner).updateUser("c" + i, ethers.Wallet.createRandom().address);
        await turing.connect(nome1).vote("c" + i, 1);
      }
      // nome1 troca de carteira no meio do caminho
      const nova = ethers.Wallet.createRandom().connect(ethers.provider);
      await ethers.provider.send("hardhat_setBalance", [nova.address, "0x56BC75E2D63100000"]);
      await turing.connect(owner).updateUser("nome1", nova.address);
      await expect(turing.connect(nova).vote("c0", 1)).to.be.revertedWith("Voce ja votou neste codinome!");
      for (let i = 5; i < 10; i++) {
        await turing.connect(owner).updateUser("c" + i, ethers.Wallet.createRandom().address);
        await turing.connect(nova).vote("c" + i, 1);
      }
      expect(await turing.voteCount("nome1")).to.equal(10);
      expect(await turing.balanceOf(nova.address)).to.equal(1); // bonus cai na carteira atual
    });

    it("Emissao total = soma dos votos + bonus (sem minting escondido)", async function () {
      const { turing, nome1, nome2 } = await loadFixture(deployTuringFixture);
      await turing.connect(nome1).vote("nome2", 2);
      await turing.connect(nome2).vote("nome1", 1);
      expect(await turing.totalSupply()).to.equal(3);
    });
  });

  describe("Eventos (Transfer do ERC-20)", function () {
    it("issueToken emite Transfer(0x0 -> destinatario)", async function () {
      const { turing, owner, nome1 } = await loadFixture(deployTuringFixture);
      await expect(turing.connect(owner).issueToken("nome1", 7))
        .to.emit(turing, "Transfer")
        .withArgs(ethers.constants.AddressZero, nome1.address, 7);
    });

    it("O 10o voto emite dois Transfer: candidato (qtde) e eleitor (bonus 1)", async function () {
      const { turing, owner, nome1 } = await loadFixture(deployTuringFixture);
      for (let i = 0; i < 9; i++) {
        await turing.connect(owner).updateUser("c" + i, ethers.Wallet.createRandom().address);
        await turing.connect(nome1).vote("c" + i, 1);
      }
      const alvo = ethers.Wallet.createRandom().address;
      await turing.connect(owner).updateUser("c9", alvo);
      await expect(turing.connect(nome1).vote("c9", 2))
        .to.emit(turing, "Transfer").withArgs(ethers.constants.AddressZero, alvo, 2)
        .and.to.emit(turing, "Transfer").withArgs(ethers.constants.AddressZero, nome1.address, 1);
    });

    it("Voto rejeitado nao emite Transfer", async function () {
      const { turing, nome1 } = await loadFixture(deployTuringFixture);
      await expect(turing.connect(nome1).vote("nome1", 1)).to.be.reverted;
      expect(await turing.totalSupply()).to.equal(0);
    });
  });
});