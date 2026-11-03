import { ethers } from "ethers";
import {
  ALUNOS,
  PROFESSORA,
  RANKING_INCLUI_PROFESSORA,
  VOTES_PER_BONUS,
} from "../config";

export const RANKING_NOMES = RANKING_INCLUI_PROFESSORA
  ? [...ALUNOS, PROFESSORA]
  : ALUNOS;

// Le TODO o estado que a interface precisa em um unico "snapshot".
// So usa funcoes de leitura (view): nao gasta gas e nao pede assinatura.
export async function loadSnapshot(contract, account) {
  const [codinome, isAdmin, votingActive, meuSaldo] = await Promise.all([
    contract.addresses(account), // "" => endereco nao autorizado a votar
    contract.isAdmin(account),
    contract.isVotingActive(),
    contract.balanceOf(account),
  ]);

  // Ranking: saldo (balanceOf) de cada codinome. Usamos balanceOf e nao a soma dos
  // eventos Transfer porque o ERC-20 permite transfer() livre entre carteiras.
  const ranking = await Promise.all(
    RANKING_NOMES.map(async (nome) => {
      const address = await contract.users(nome);
      const balance =
        address === ethers.constants.AddressZero
          ? 0
          : (await contract.balanceOf(address)).toNumber();
      return { nome, address, balance };
    })
  );

  // Em quem este usuario ja votou (o contrato so permite 1 voto por candidato).
  const jaVotou = {};
  let votos = 0;
  if (codinome) {
    await Promise.all(
      ALUNOS.map(async (nome) => {
        jaVotou[nome] = await contract.hasVote(codinome, nome);
      })
    );
    votos = (await contract.voteCount(codinome)).toNumber();
  }

  return {
    account,
    codinome,
    podeVotar: codinome !== "",
    isAdmin,
    votingActive,
    meuSaldo: meuSaldo.toNumber(),
    votos,
    votosParaBonus: VOTES_PER_BONUS - (votos % VOTES_PER_BONUS),
    jaVotou,
    ranking: ordenarRanking(ranking),
  };
}

// Ordena por saldo (desc) e desempata por nome. Empates dividem a mesma posicao
// (1, 2, 2, 4...).
export function ordenarRanking(lista) {
  const ordenada = [...lista].sort(
    (a, b) => b.balance - a.balance || a.nome.localeCompare(b.nome)
  );
  let posicao = 0;
  return ordenada.map((item, i) => {
    if (i === 0 || item.balance !== ordenada[i - 1].balance) posicao = i + 1;
    return { ...item, posicao };
  });
}

export const shortAddress = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");