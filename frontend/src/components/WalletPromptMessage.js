import React from "react";

// Aparece enquanto o app espera o usuario responder na carteira (conectar, trocar de
// conta, assinar uma transacao). A pagina NAO consegue abrir/focar a janela do MetaMask:
// o navegador nao permite. Entao avisamos na tela e orientamos o que fazer.
export function WalletPromptMessage() {
  return (
    <div className="alert alert-warning d-flex align-items-center" role="status" data-testid="wallet-prompt">
      <div className="spinner-border spinner-border-sm mr-3" role="presentation" />
      <div>
        <strong>Aguardando a sua confirmação na carteira.</strong> Se a janela do MetaMask não
        abrir sozinha, clique no ícone da extensão na barra do navegador.
      </div>
    </div>
  );
}