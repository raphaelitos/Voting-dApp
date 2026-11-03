import React, { useState } from "react";
import { ALUNOS, VOTE_MAX, VOTE_MIN, VOTES_PER_BONUS, rotulo } from "../config";

// Funcao `vote(codinome, qtde)`. Campo para escolher o aluno (sem a professora, e
// sem o proprio usuario) e campo para a quantidade de Turings (1 a 2).
export function VoteForm({ snapshot, busy, onVote }) {
  const { codinome, jaVotou, votingActive, votos, votosParaBonus } = snapshot;
  const [candidato, setCandidato] = useState("");
  const [quantidade, setQuantidade] = useState(String(VOTE_MIN));

  const candidatos = ALUNOS.filter((nome) => nome !== codinome);
  const qtde = Number(quantidade);
  const quantidadeValida =
    Number.isInteger(qtde) && qtde >= VOTE_MIN && qtde <= VOTE_MAX;
  const candidatoValido = candidato !== "" && !jaVotou[candidato];
  const podeEnviar = votingActive && !busy && quantidadeValida && candidatoValido;

  async function submit(e) {
    e.preventDefault();
    if (!podeEnviar) return;
    const ok = await onVote(candidato, qtde);
    if (ok) setCandidato("");
  }

  return (
    <section className="card app-card">
      <div className="card-body">
        <h2 className="card-title h5">Votar</h2>
        {!votingActive && (
          <div className="alert alert-secondary py-2">
            A votação está encerrada. Aguarde um superusuário reabri-la.
          </div>
        )}
        <form onSubmit={submit} data-testid="vote-form">
          <div className="form-group">
            <label htmlFor="vote-candidato">Codinome</label>
            <select
              id="vote-candidato"
              className="custom-select"
              value={candidato}
              onChange={(e) => setCandidato(e.target.value)}
              disabled={!votingActive || busy}
            >
              <option value="">Selecione um aluno…</option>
              {candidatos.map((nome) => (
                <option key={nome} value={nome} disabled={jaVotou[nome]}>
                  {rotulo(nome)}
                  {jaVotou[nome] ? " — você já votou" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="vote-qtde">
              Quantidade de Turings ({VOTE_MIN} a {VOTE_MAX})
            </label>
            <input
              id="vote-qtde"
              className={`form-control ${quantidadeValida ? "" : "is-invalid"}`}
              type="number"
              min={VOTE_MIN}
              max={VOTE_MAX}
              step="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              disabled={!votingActive || busy}
            />
            <div className="invalid-feedback">
              Informe um inteiro entre {VOTE_MIN} e {VOTE_MAX}.
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={!podeEnviar}>
            Votar
          </button>
          {votingActive && candidato === "" && (
            <small className="form-text text-muted">Escolha um aluno para habilitar o botão.</small>
          )}
        </form>
        <small className="form-text text-muted mt-3">
          Seus votos: <b>{votos}</b>. Faltam <b>{votosParaBonus}</b> para ganhar 1 Turing de
          bônus (a cada {VOTES_PER_BONUS} votos).
        </small>
      </div>
    </section>
  );
}