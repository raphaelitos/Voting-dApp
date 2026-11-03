import React from "react";

export function TransactionErrorMessage({ message, dismiss }) {
  return (
    <div className="alert alert-danger alert-dismissible" role="alert" data-testid="tx-error">
      <strong>Não foi possível concluir:</strong> {message}
      <button type="button" className="close" aria-label="Fechar" onClick={dismiss}>
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}