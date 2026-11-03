import React from "react";

import { NetworkErrorMessage } from "./NetworkErrorMessage";

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <div className="container connect-screen">
      <div className="connect-card">
        <h1 className="app-title">Turing dApp</h1>
        <p className="text-muted">
          Conecte sua carteira (rede Hardhat Local, localhost:8545) para votar e ver o ranking.
        </p>
        {networkError && <NetworkErrorMessage message={networkError} dismiss={dismiss} />}
        <button className="btn btn-warning btn-lg" type="button" onClick={connectWallet}>
          Conectar carteira
        </button>
      </div>
    </div>
  );
}