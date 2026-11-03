import React from "react";

export function Loading() {
  return (
    <div className="loading-overlay" data-testid="loading">
      <div className="spinner-border" role="status">
        <span className="sr-only">Carregando…</span>
      </div>
    </div>
  );
}