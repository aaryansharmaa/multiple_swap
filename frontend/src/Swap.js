import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import SwapMultipleTokens from "./artifacts/contracts/SwapMultipleTokens.sol/SwapMultipleTokens.json";

const swapContractAddress = "0x1689ce8849b2B1d6d59975fbd3652e9869Ec684d"; // Use the new deployed contract address

const WETH_ADDRESS = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"; // WETH address on Polygon

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) public returns (bool)",
];

function Swap() {
  const [maticAmount, setMaticAmount] = useState("2");
  const [wethAmount, setWethAmount] = useState("0.0005");
  const [amountOutMin, setAmountOutMin] = useState("1");
  const [recipient, setRecipient] = useState("Your Address");
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      const signer = provider.getSigner();
      setSigner(signer);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleSwap = async () => {
    if (!signer) return alert("Please connect your wallet first");

    const swapContract = new ethers.Contract(
      swapContractAddress,
      SwapMultipleTokens.abi,
      signer
    );
    const wethContract = new ethers.Contract(WETH_ADDRESS, ERC20_ABI, signer);

    try {
      const maticValue = ethers.utils.parseEther(maticAmount); // MATIC is the native currency
      const wethValue = ethers.utils.parseUnits(wethAmount, 18);
      const minOut = ethers.utils.parseUnits(amountOutMin, 6); // USDC typically has 6 decimals
      const deadline = Math.floor(Date.now() / 1000) + 900; // 15 minutes from now

      // Log Balances
      const maticBalance = await provider.getBalance(account);
      console.log("MATIC Balance:", ethers.utils.formatEther(maticBalance));

      const wethBalance = await wethContract.balanceOf(account);
      console.log("ETH Balance:", ethers.utils.formatUnits(wethBalance, 18));

      // Ensure sufficient balance
      if (ethers.utils.parseUnits(wethAmount, 18).gt(wethBalance)) {
        alert("Insufficient WETH balance");
        return;
      }

      // Log Approval Status
      const allowance = await wethContract.allowance(
        account,
        swapContractAddress
      );
      console.log("ETH Allowance:", ethers.utils.formatUnits(allowance, 18));

      // Approve WETH transfer if needed
      if (allowance.lt(wethValue)) {
        console.log("Approving WETH transfer...");
        const approveTx = await wethContract.approve(
          swapContractAddress,
          wethValue
        );
        await approveTx.wait();
        console.log("WETH Approved");
      } else {
        console.log("WETH transfer already approved");
      }

      // Display transaction details to the user
      setTransactionDetails({
        maticValue: ethers.utils.formatEther(maticValue),
        wethValue: ethers.utils.formatUnits(wethValue, 18),
        minOut: ethers.utils.formatUnits(minOut, 6),
        recipient,
      });

      // Execute the swap
      console.log("Executing swap...");
      const tx = await swapContract.swapMaticAndWethForUsdc(
        maticValue,
        wethValue,
        minOut,
        recipient,
        deadline,
        {
          value: maticValue,
          gasLimit: ethers.utils.hexlify(500000), // Increase gas limit here
        }
      );
      await tx.wait();
      alert("Swap successful");
    } catch (error) {
      console.error("Swap failed:", error);
      if (error.data && error.data.message) {
        alert(`Swap failed: ${error.data.message}`);
      } else {
        alert(`Swap failed: ${error.message}`);
      }
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Swap MATIC and ETH to USDC</h1>
        <button onClick={connectWallet} className="button">
          {account ? `Connected: ${account}` : "Connect Wallet"}
        </button>
        <div className="inputGroup">
          <label>MATIC Amount:</label>
          <input
            type="text"
            value={maticAmount}
            onChange={(e) => setMaticAmount(e.target.value)}
            className="input"
          />
        </div>
        <div className="inputGroup">
          <label>ETH Amount:</label>
          <input
            type="text"
            value={wethAmount}
            onChange={(e) => setWethAmount(e.target.value)}
            className="input"
          />
        </div>
        <div className="inputGroup">
          <label>Minimum USDC Amount Out:</label>
          <input
            type="text"
            value={amountOutMin}
            onChange={(e) => setAmountOutMin(e.target.value)}
            className="input"
          />
        </div>
        <div className="inputGroup">
          <label>Recipient Address:</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="input"
          />
        </div>
        <button onClick={handleSwap} className="button">
          Swap
        </button>
        {transactionDetails && (
          <div className="transactionDetails">
            <h3>Transaction Details</h3>
            <p>MATIC Amount: {transactionDetails.maticValue}</p>
            <p>WETH Amount: {transactionDetails.wethValue}</p>
            <p>Minimum USDC Amount Out: {transactionDetails.minOut}</p>
            <p>Recipient: {transactionDetails.recipient}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Swap;
