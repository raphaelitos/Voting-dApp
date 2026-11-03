import React from "react";
import ReactDOM from "react-dom/client";
import { Dapp } from "./components/Dapp";

import "bootstrap/dist/css/bootstrap.css";
import "./App.css";

// Ponto de entrada: so renderiza o componente Dapp, que contem toda a logica.

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <Dapp />
  </React.StrictMode>
);