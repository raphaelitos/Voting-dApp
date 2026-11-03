import React from "react";
import { rotulo } from "../config";

// Medalha so para quem tem saldo (com todos em 0, ninguem "ganhou" nada).
const MEDALHAS = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Ranking por saldo de Turings. Recalculado a cada leitura de estado (evento
// Transfer ou polling), entao se atualiza sozinho.
export function Ranking({ ranking, codinome, tokenSymbol }) {
  const maximo = Math.max(1, ...ranking.map((r) => r.balance));

  return (
    <section className="card app-card">
      <div className="card-body">
        <h2 className="card-title h5">Ranking</h2>
        <ol className="ranking" data-testid="ranking">
          {ranking.map((item) => (
            <li
              key={item.nome}
              className={`ranking-item ${item.nome === codinome ? "ranking-me" : ""}`}
              data-testid={`rank-${item.nome}`}
            >
              <span className="ranking-pos">
                {item.balance > 0 && MEDALHAS[item.posicao] ? MEDALHAS[item.posicao] : `${item.posicao}º`}
              </span>
              <span className="ranking-name">
                {rotulo(item.nome)}
                {item.nome === codinome && <small className="text-muted"> (você)</small>}
              </span>
              <span className="ranking-bar">
                <span
                  className="ranking-bar-fill"
                  style={{ width: `${(item.balance / maximo) * 100}%` }}
                />
              </span>
              <span className="ranking-balance">
                {item.balance} {tokenSymbol}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}