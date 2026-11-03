import React from "react";

export function NoWalletDetected() {
  return (
    <div className="container connect-screen">
      <div className="connect-card">
        <h1 className="app-title">Turing dApp</h1>
        <p>
          Nenhuma carteira Ethereum foi detectada. Instale o{" "}
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
            MetaMask
          </a>{" "}
          ou a{" "}
          <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">
            Coinbase Wallet
          </a>{" "}
          e recarregue a página.
        </p>
      </div>
    </div>
  );
}