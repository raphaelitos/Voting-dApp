# Turing dApp

Token ERC-20 (`Turing`) emitido sob demanda por votação entre usuários pré-autorizados.
Projeto em [Hardhat v2](https://v2.hardhat.org/) (ethers v5). A especificação completa está em [`SPECS.md`](./SPECS.md).

## Como funciona

- **Sem supply inicial** ("Uncapped Lazy Supply"): Turings só nascem via `issueToken` (admin) ou `vote`.
- **Identidade = codinome.** O contrato mantém `users[codinome] → endereço` e o reverso `addresses[endereço] → codinome`.
  Votos (`hasVote`) e contagem (`voteCount`) são indexados por codinome, então trocar o endereço de alguém (`updateUser`) preserva seu histórico.
- **Admins:** o deployer (`owner`) e a professora (`users["roberta"]`). Consulta via `isAdmin(address)`.
- **Votação:** `isVotingActive()`; `votingOn()` / `votingOff()` (admin).
- **`vote(codinome, qtde)`:** votação ativa, eleitor autorizado, sem auto-voto, `0 < qtde <= 2`, um voto por par (eleitor → candidato).
  Minta `qtde` Turings ao candidato e, a cada 10 votos do eleitor, 1 Turing ao próprio eleitor. Emite `Voted`.
- `decimals()` = 0 (Turing é indivisível).

## Uso

```sh
npm install
npx hardhat test                                          # testes
npx hardhat node                                          # blockchain local (terminal 1)
npx hardhat run scripts/deploy.js --network localhost     # deploy (terminal 2)
npx hardhat faucet <endereco> --network localhost         # envia 1 ETH fake para uma carteira
```

O deploy grava ABI e endereço em `frontend/src/contracts/` para o frontend.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `contracts/Turing.sol` | Contrato (OpenZeppelin 4.9 `ERC20`) |
| `test/Turing.js` | Testes (Mocha/Chai + hardhat-chai-matchers) |
| `scripts/deploy.js` | Deploy + exporta artefatos para o frontend |
| `tasks/faucet.js` | Task auxiliar: envia ETH fake |
| `frontend/` | dApp React (em desenvolvimento) |

## Observações

- OpenZeppelin está na **4.9.x** de propósito: a 5.x gera opcodes Cancun (`mcopy`) que o Hardhat 2.12 não executa.
- `Invalid nonce` no MetaMask ao reiniciar `npx hardhat node`: `Configurações > Avançado > Limpar dados da aba de atividade`.

Baseado no [hardhat-boilerplate](https://github.com/NomicFoundation/hardhat-boilerplate) (MIT).