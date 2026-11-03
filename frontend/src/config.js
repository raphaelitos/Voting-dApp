// Configuracoes estaticas do dApp. O ambiente da atividade e fixo (rede local do
// Hardhat + usuarios da tabela), entao a lista de codinomes mora aqui.

// Rede local do Hardhat (chainId 31337 = 0x7A69)
export const HARDHAT_NETWORK_ID = "31337";
export const HARDHAT_CHAIN_ID_HEX = "0x7A69";

// Codigo EIP-1193 de "usuario rejeitou a requisicao na carteira"
export const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

// Codinomes da tabela. A professora recebe/da Turings, mas nao aparece nos
// campos de selecao (especificacao: "excluir a professora!").
export const PROFESSORA = "roberta";
export const ALUNOS = ["nome1", "nome2", "nome3", "nome4", "nome5"];

// DECISAO DE PROJETO (ver resposta): a Roberta pode receber votos, entao ela pode
// ter saldo. Se true, ela tambem aparece no ranking.
export const RANKING_INCLUI_PROFESSORA = false;

// Regras do contrato, usadas so para validar/limitar os campos na tela.
// A fonte da verdade continua sendo o contrato (ele reverte se algo estiver errado).
export const VOTE_MIN = 1;
export const VOTE_MAX = 2;
export const VOTES_PER_BONUS = 10;

// Releitura periodica do estado (votingOn/votingOff nao emitem evento).
export const REFRESH_MS = 3000;

export const rotulo = (codinome) =>
  codinome === PROFESSORA ? "roberta (professora)" : codinome;