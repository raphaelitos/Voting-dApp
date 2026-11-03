import { ERROR_CODE_TX_REJECTED_BY_USER } from "../config";

// O usuario clicou em "Rejeitar" na carteira: nao e um erro a exibir.
export function isUserRejection(error) {
  return (
    error?.code === ERROR_CODE_TX_REJECTED_BY_USER ||
    error?.code === "ACTION_REJECTED" ||
    error?.error?.code === ERROR_CODE_TX_REJECTED_BY_USER
  );
}

// Erros do ethers/Hardhat/MetaMask chegam aninhados e com formatos diferentes.
// Percorremos o objeto coletando textos e procuramos o motivo do revert do contrato
// (as mensagens dos `require` ja estao em portugues).
function collectMessages(err, out = [], depth = 0) {
  if (!err || depth > 6) return out;
  if (typeof err === "string") {
    out.push(err);
    return out;
  }
  for (const key of ["reason", "message", "body"]) {
    if (typeof err[key] === "string") out.push(err[key]);
  }
  if (err.data && typeof err.data === "object") collectMessages(err.data, out, depth + 1);
  if (err.error) collectMessages(err.error, out, depth + 1);
  return out;
}

const REVERT_PATTERNS = [
  /reverted with reason string '([^']+)'/,
  /execution reverted: ([^"\\]+)/,
];

export function friendlyError(error) {
  const messages = collectMessages(error);

  for (const text of messages) {
    for (const re of REVERT_PATTERNS) {
      const m = text.match(re);
      if (m) return m[1].trim();
    }
  }

  const all = messages.join(" | ");
  if (/insufficient funds/i.test(all)) {
    return "Saldo de ETH insuficiente para pagar o gás. Rode: npx hardhat faucet <seu endereço> --network localhost";
  }
  if (/nonce/i.test(all)) {
    return "Nonce inválido. No MetaMask: Configurações > Avançado > Limpar dados da aba de atividade.";
  }
  if (/call revert exception|CALL_EXCEPTION/i.test(all)) {
    return "Não foi possível ler o contrato. Confira se o deploy foi feito nesta rede (npx hardhat run scripts/deploy.js --network localhost).";
  }
  const first = error?.reason || error?.message || "Erro desconhecido";
  return String(first).slice(0, 200);
}