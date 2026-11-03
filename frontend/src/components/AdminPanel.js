import React from "react";
import { IssueTokenForm } from "./IssueTokenForm";

// Painel exclusivo de superusuarios: issueToken, votingOn e votingOff.
export function AdminPanel({ snapshot, busy, onIssue, onVotingOn, onVotingOff }) {
  const { votingActive } = snapshot;

  return (
    <section className="card app-card app-card-admin" data-testid="admin-panel">
      <div className="card-body">
        <h2 className="card-title h5">
          Painel do superusuário <span className="badge badge-warning">admin</span>
        </h2>

        <h3 className="h6 mt-3">Votação</h3>
        <div className="btn-group btn-block mb-4" role="group">
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={onVotingOn}
            disabled={busy || votingActive}
          >
            Abrir votação
          </button>
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={onVotingOff}
            disabled={busy || !votingActive}
          >
            Encerrar votação
          </button>
        </div>
        <small className="form-text text-muted mt-n3 mb-4">
          {votingActive
            ? "A votação está aberta: só \"Encerrar votação\" está disponível."
            : "A votação está encerrada: só \"Abrir votação\" está disponível."}
        </small>

        <h3 className="h6">Emitir Turings</h3>
        <IssueTokenForm busy={busy} onIssue={onIssue} />
      </div>
    </section>
  );
}