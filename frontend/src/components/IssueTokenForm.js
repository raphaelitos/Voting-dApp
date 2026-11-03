import React, { useState } from "react";
import { ALUNOS, rotulo } from "../config";

// Funcao `issueToken(codinome, qtde)` (somente superusuarios).
export function IssueTokenForm({ busy, onIssue }) {
  const [alvo, setAlvo] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  const qtde = Number(quantidade);
  const quantidadeValida = Number.isInteger(qtde) && qtde > 0;
  const podeEnviar = !busy && alvo !== "" && quantidadeValida;

  async function submit(e) {
    e.preventDefault();
    if (!podeEnviar) return;
    const ok = await onIssue(alvo, qtde);
    if (ok) setAlvo("");
  }

  return (
    <form onSubmit={submit} data-testid="issue-form">
      <div className="form-group">
        <label htmlFor="issue-alvo">Codinome</label>
        <select
          id="issue-alvo"
          className="custom-select"
          value={alvo}
          onChange={(e) => setAlvo(e.target.value)}
          disabled={busy}
        >
          <option value="">Selecione um aluno…</option>
          {ALUNOS.map((nome) => (
            <option key={nome} value={nome}>
              {rotulo(nome)}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="issue-qtde">Quantidade de Turings</label>
        <input
          id="issue-qtde"
          className={`form-control ${quantidadeValida ? "" : "is-invalid"}`}
          type="number"
          min="1"
          step="1"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          disabled={busy}
        />
        <div className="invalid-feedback">Informe um inteiro maior que 0.</div>
      </div>
      <button className="btn btn-warning btn-block" type="submit" disabled={!podeEnviar}>
        Emitir Turings
      </button>
    </form>
  );
}