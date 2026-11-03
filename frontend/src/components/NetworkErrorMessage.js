import React from "react";

export function NetworkErrorMessage({ message, dismiss }) {
  return (
    <div className="alert alert-danger alert-dismissible" role="alert">
      {message}
      <button type="button" className="close" aria-label="Fechar" onClick={dismiss}>
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}