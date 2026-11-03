import React from "react";

import { NetworkErrorMessage } from "./NetworkErrorMessage";
import { WalletPromptMessage } from "./WalletPromptMessage";

export function ConnectWallet({ connectWallet, networkError, dismiss, waiting }) {
  return (
    <div className="container connect-screen">
      <div className="connect-card">
        <h1 className="app-title">Turing dApp</h1>
        <p className="text-muted">
          Conecte sua carteira (rede Hardhat Local, localhost:8545) para votar e ver o ranking.
        </p>
        {networkError && <NetworkErrorMessage message={networkError} dismiss={dismiss} />}
        <button
          className="btn btn-warning btn-lg"
          type="button"
          onClick={connectWallet}
          disabled={waiting}
        >
          Conectar carteira
        </button>
        {waiting && <WalletPromptMessage />}
      </div>
    </div>
  );
}