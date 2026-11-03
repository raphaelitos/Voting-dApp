# Frontend do Turing dApp

React (Create React App) + ethers v5 + Bootstrap 4. Conversa com o contrato `Turing`
pela carteira do navegador (MetaMask/Coinbase Wallet) na rede local do Hardhat.

## Como rodar

```sh
# na raiz do repositorio
npx hardhat node                                       # terminal 1: blockchain local
npx hardhat run scripts/deploy.js --network localhost  # terminal 2: deploy (gera src/contracts/)
npx hardhat faucet <endereco> --network localhost      # opcional: ETH para pagar gas

# neste diretorio
npm install
npm start                                              # http://localhost:3000
```

A carteira precisa estar na rede **localhost:8545 (chainId 31337)**. Se o `hardhat node`
for reiniciado, rode o deploy de novo e, no MetaMask, limpe os dados da aba de atividade.

## O que cada usuario ve

| Conta | Interface |
| --- | --- |
| Cadastrada (nome1..nome5) | Votar + ranking |
| Superusuaria cadastrada (roberta) | Painel admin (issueToken, votingOn, votingOff) + votar + ranking |
| Superusuario nao cadastrado (deployer/owner) | Painel admin + aviso de que nao pode votar + ranking |
| Qualquer outra | Aviso de conta nao autorizada + ranking (somente leitura) |

O papel vem do proprio contrato: `isAdmin(conta)` (superusuario) e `addresses(conta)`
(codinome; vazio = nao autorizado a votar).

## Estrutura (`src/`)

| Arquivo | Papel |
| --- | --- |
| `config.js` | Constantes: rede, codinomes (alunos/professora), limites de voto, flag do ranking |
| `lib/turing.js` | Le todo o estado do contrato num "snapshot" e ordena o ranking |
| `lib/errors.js` | Traduz erros do ethers/MetaMask (extrai o motivo do `require` do contrato) |
| `components/Dapp.js` | Conecta a carteira, garante a rede, mantem o snapshot e envia as transacoes |
| `components/Header.js` | Conta, papel, saldo e status da votacao |
| `components/Ranking.js` | Ranking por saldo de Turings |
| `components/VoteForm.js` | `vote(codinome, qtde)` |
| `components/AdminPanel.js`, `IssueTokenForm.js` | `votingOn`, `votingOff`, `issueToken` |
| demais componentes | Telas de conexao, carteira ausente, carregando e mensagens de erro/espera |

## Como o estado se mantem atualizado

Todo mint (voto, bonus de 10 votos, `issueToken`) emite o `Transfer` do ERC-20, que
dispara uma releitura imediata. Como `votingOn`/`votingOff` nao emitem evento, ha
tambem uma releitura a cada 3 s. O ranking usa `balanceOf` (nao a soma dos eventos),
pois o ERC-20 permite `transfer` livre entre carteiras.