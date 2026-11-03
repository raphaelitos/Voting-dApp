import React from "react";

export function WaitingForTransactionMessage({ txHash }) {
  return (
    <div className="alert alert-info" role="status" data-testid="tx-waiting">
      Aguardando a confirmação da transação <code>{txHash.slice(0, 12)}…</code>
    </div>
  );
}