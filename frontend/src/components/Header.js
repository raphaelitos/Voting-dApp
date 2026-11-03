import React from "react";
import { rotulo } from "../config";
import { shortAddress } from "../lib/turing";

// Topo da pagina: token, quem esta conectado, papel (superusuario/votante) e
// se a votacao esta aberta.
export function Header({ tokenData, snapshot, onSwitchAccount }) {
  const { account, codinome, podeVotar, isAdmin, votingActive, meuSaldo } = snapshot;

  return (
    <header className="app-header">
      <div className="d-flex flex-wrap justify-content-between align-items-center">
        <div>
          <h1 className="app-title">Turing dApp</h1>
          <div className="app-subtitle">
            {tokenData.name} ({tokenData.symbol})
          </div>
        </div>
        <span className={`status-pill ${votingActive ? "status-on" : "status-off"}`}>
          <span className="status-dot" />
          {votingActive ? "Votação aberta" : "Votação encerrada"}
        </span>
      </div>

      <div className="user-bar">
        <div>
          <div className="user-label">Conta conectada</div>
          <div className="user-value" title={account}>
            {podeVotar ? <b>{rotulo(codinome)}</b> : <b>Sem codinome</b>}{" "}
            <span className="text-muted">({shortAddress(account)})</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light mt-1"
            onClick={onSwitchAccount}
          >
            Trocar conta
          </button>
        </div>
        <div>
          {isAdmin && <span className="badge badge-warning mr-1">Superusuário</span>}
          {podeVotar ? (
            <span className="badge badge-primary mr-1">Votante</span>
          ) : (
            <span className="badge badge-secondary mr-1">Não autorizado a votar</span>
          )}
        </div>
        <div className="text-right">
          <div className="user-label">Seu saldo</div>
          <div className="user-value">
            <b>{meuSaldo}</b> {tokenData.symbol}
          </div>
        </div>
      </div>
    </header>
  );
}