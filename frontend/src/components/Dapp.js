import React, { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

// Artefatos gerados por `npx hardhat run scripts/deploy.js --network localhost`
// (pasta src/contracts, ignorada pelo git).
import TuringArtifact from "../contracts/Turing.json";
import contractAddress from "../contracts/contract-address.json";

import { HARDHAT_CHAIN_ID_HEX, HARDHAT_NETWORK_ID, REFRESH_MS, rotulo } from "../config";
import { friendlyError, isUserRejection } from "../lib/errors";
import { loadSnapshot } from "../lib/turing";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { Header } from "./Header";
import { Ranking } from "./Ranking";
import { VoteForm } from "./VoteForm";
import { AdminPanel } from "./AdminPanel";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";

// Este componente:
//   1. conecta a carteira e garante a rede local do Hardhat;
//   2. instancia o contrato Turing (ethers v5);
//   3. mantem um "snapshot" do estado on-chain atualizado (evento Transfer + polling);
//   4. envia as transacoes (vote, issueToken, votingOn, votingOff);
//   5. escolhe a interface: usuario comum (votar) ou superusuario (votar + admin).
export function Dapp() {
  const [account, setAccount] = useState();
  const [networkError, setNetworkError] = useState();
  const [contractError, setContractError] = useState();
  const [tokenData, setTokenData] = useState();
  const [snapshot, setSnapshot] = useState();
  const [txBeingSent, setTxBeingSent] = useState();
  const [txError, setTxError] = useState();
  const [notice, setNotice] = useState();

  const contractRef = useRef();
  const refreshRef = useRef(async () => {});

  // ---- Conexao da carteira e rede ---------------------------------------------

  const ensureNetwork = useCallback(async () => {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (parseInt(chainId, 16) === Number(HARDHAT_NETWORK_ID)) return true;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID_HEX }],
      });
      return true;
    } catch (error) {
      setNetworkError(
        "Conecte a carteira à rede Hardhat Local (localhost:8545, chainId 31337) e tente novamente."
      );
      return false;
    }
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      const [selected] = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (selected && (await ensureNetwork())) setAccount(selected);
    } catch (error) {
      if (!isUserRejection(error)) setNetworkError(friendlyError(error));
    }
  }, [ensureNetwork]);

  // Reconecta sozinho se o site ja foi autorizado (nao abre pop-up), e reage a
  // troca de conta / troca de rede na carteira.
  useEffect(() => {
    if (!window.ethereum) return undefined;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then(async ([selected]) => {
        if (selected && (await ensureNetwork())) setAccount(selected);
      })
      .catch(() => {});

    const onAccountsChanged = ([newAccount]) => {
      // undefined: o usuario revogou o acesso do site na carteira
      setSnapshot(undefined);
      setNotice(undefined);
      setTxError(undefined);
      setAccount(newAccount);
    };
    const onChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, [ensureNetwork]);

  // ---- Contrato + leitura do estado -------------------------------------------

  useEffect(() => {
    if (!account) return undefined;

    let cancelled = false;
    let seq = 0;
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(
      contractAddress.Turing,
      TuringArtifact.abi,
      provider.getSigner(account)
    );
    contractRef.current = contract;
    setContractError(undefined);

    // Ignora respostas antigas se varias leituras estiverem em voo.
    const refresh = async () => {
      const mine = ++seq;
      try {
        const next = await loadSnapshot(contract, account);
        if (!cancelled && mine === seq) {
          setSnapshot(next);
          setContractError(undefined);
        }
      } catch (error) {
        if (!cancelled && mine === seq) setContractError(friendlyError(error));
      }
    };
    refreshRef.current = refresh;

    (async () => {
      try {
        // Se o no do Hardhat foi reiniciado, o contrato deixa de existir.
        if ((await provider.getCode(contractAddress.Turing)) === "0x") {
          throw new Error(
            "Contrato não encontrado neste endereço. Rode o deploy novamente: npx hardhat run scripts/deploy.js --network localhost"
          );
        }
        const [name, symbol] = await Promise.all([contract.name(), contract.symbol()]);
        if (!cancelled) setTokenData({ name, symbol });
        await refresh();
      } catch (error) {
        if (!cancelled) setContractError(friendlyError(error));
      }
    })();

    // Todo mint (vote, bonus, issueToken) emite Transfer: relemos o estado na hora.
    contract.on("Transfer", refresh);
    // votingOn/votingOff nao emitem evento, e outras contas podem agir: polling leve.
    const interval = setInterval(refresh, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      contract.off("Transfer", refresh);
    };
  }, [account]);

  // ---- Transacoes ---------------------------------------------------------------

  // Envia uma transacao, espera ser minerada e atualiza o estado. Retorna true/false.
  const sendTransaction = useCallback(async (action, successMessage) => {
    setTxError(undefined);
    setNotice(undefined);
    try {
      const tx = await action(contractRef.current);
      setTxBeingSent(tx.hash);
      const receipt = await tx.wait();
      if (receipt.status === 0) throw new Error("A transação falhou.");
      await refreshRef.current();
      setNotice(successMessage);
      return true;
    } catch (error) {
      if (isUserRejection(error)) return false;
      console.error(error);
      setTxError(friendlyError(error));
      return false;
    } finally {
      setTxBeingSent(undefined);
    }
  }, []);

  const vote = (nome, qtde) =>
    sendTransaction(
      (c) => c.vote(nome, qtde),
      `Voto registrado: ${qtde} Turing${qtde > 1 ? "s" : ""} para ${rotulo(nome)}.`
    );
  const issueToken = (nome, qtde) =>
    sendTransaction(
      (c) => c.issueToken(nome, qtde),
      `${qtde} Turing${qtde > 1 ? "s" : ""} emitido${qtde > 1 ? "s" : ""} para ${rotulo(nome)}.`
    );
  const votingOn = () => sendTransaction((c) => c.votingOn(), "Votação aberta.");
  const votingOff = () => sendTransaction((c) => c.votingOff(), "Votação encerrada.");

  // ---- Render -------------------------------------------------------------------

  if (window.ethereum === undefined) return <NoWalletDetected />;

  if (!account) {
    return (
      <ConnectWallet
        connectWallet={connectWallet}
        networkError={networkError}
        dismiss={() => setNetworkError(undefined)}
      />
    );
  }

  if (contractError && !snapshot) {
    return (
      <div className="container connect-screen">
        <div className="connect-card">
          <h1 className="app-title">Turing dApp</h1>
          <div className="alert alert-danger" role="alert" data-testid="contract-error">
            {contractError}
          </div>
          <button className="btn btn-outline-secondary" onClick={() => refreshRef.current()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!snapshot || !tokenData) return <Loading />;

  const busy = txBeingSent !== undefined;

  return (
    <div className="container app-container">
      <Header tokenData={tokenData} snapshot={snapshot} />

      {txBeingSent && <WaitingForTransactionMessage txHash={txBeingSent} />}
      {txError && (
        <TransactionErrorMessage message={txError} dismiss={() => setTxError(undefined)} />
      )}
      {notice && !txError && (
        <div className="alert alert-success alert-dismissible" role="status" data-testid="notice">
          {notice}
          <button
            type="button"
            className="close"
            aria-label="Fechar"
            onClick={() => setNotice(undefined)}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      )}
      {contractError && (
        <div className="alert alert-warning py-2">Falha ao atualizar o estado: {contractError}</div>
      )}

      <div className="row">
        <div className="col-lg-5 mb-4">
          {/* Interface de superusuario: painel admin (alem da funcao de votar) */}
          {snapshot.isAdmin && (
            <AdminPanel
              snapshot={snapshot}
              busy={busy}
              onIssue={issueToken}
              onVotingOn={votingOn}
              onVotingOff={votingOff}
            />
          )}

          {/* Votar: qualquer usuario cadastrado (inclusive superusuarios cadastrados) */}
          {snapshot.podeVotar ? (
            <VoteForm snapshot={snapshot} busy={busy} onVote={vote} />
          ) : (
            <div className="alert alert-secondary" data-testid="cannot-vote">
              {snapshot.isAdmin
                ? "Sua conta é superusuária, mas não está cadastrada como votante: a opção de votar fica indisponível."
                : "Sua conta não está cadastrada. Somente usuários pré-autorizados podem votar; você ainda pode acompanhar o ranking."}
            </div>
          )}
        </div>

        <div className="col-lg-7 mb-4">
          <Ranking
            ranking={snapshot.ranking}
            codinome={snapshot.codinome}
            tokenSymbol={tokenData.symbol}
          />
        </div>
      </div>
    </div>
  );
}