"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ethers } from "ethers";

export default function CreditPurchaseForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const [amount, setAmount] = useState<number>(10);
  const [paymentMethod, setPaymentMethod] = useState<string>("paypal");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [receiverAddress, setReceiverAddress] = useState<string>(process.env.NEXT_PUBLIC_USDT_RECEIVER_ADDRESS || "");

  // Predefined amounts
  const predefinedAmounts = [10, 25, 50, 100, 200, 500];

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
        
        // Check if we're on Optimism network
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        if (chainId !== "0xa") { // Optimism mainnet chainId is 10 (0xa in hex)
          try {
            // Try to switch to Optimism
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0xa" }],
            });
          } catch (switchError: any) {
            // If the network is not added, add it
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0xa",
                    chainName: "Optimism",
                    nativeCurrency: {
                      name: "Ethereum",
                      symbol: "ETH",
                      decimals: 18,
                    },
                    rpcUrls: ["https://mainnet.optimism.io"],
                    blockExplorerUrls: ["https://optimistic.etherscan.io"],
                  },
                ],
              });
            } else {
              throw switchError;
            }
          }
        }
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet. Please try again.");
      }
    } else {
      setError("MetaMask is not installed. Please install MetaMask to continue.");
    }
  };

  // Handle PayPal payment
  const handlePayPalPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Initialize PayPal
      const paypal = await import("@paypal/checkout-server-sdk");
      
      // Create PayPal order
      const response = await fetch("/api/payments/paypal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          currency: "USD",
          intent: "CAPTURE",
          description: `Purchase ${amount} credits`,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to create PayPal order");
      }
      
      // Redirect to PayPal checkout
      window.location.href = data.data.approvalUrl;
    } catch (error) {
      console.error("PayPal payment error:", error);
      setError("Failed to process PayPal payment. Please try again.");
      setLoading(false);
    }
  };

  // Handle USDT payment
  const handleUSDTPayment = async () => {
    if (!walletConnected) {
      await connectWallet();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // USDT contract ABI (simplified for token transfers)
      const USDT_ABI = [
        "function transfer(address to, uint value) returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function approve(address spender, uint256 amount) returns (bool)"
      ];
      
      // Optimism USDT contract address
      const USDT_CONTRACT_ADDRESS = "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58"; // USDT on Optimism
      
      // Get provider and signer
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Create contract instance
      const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, signer);
      
      // Get USDT decimals
      const decimals = await usdtContract.decimals();
      
      // Convert amount to USDT with proper decimals
      const usdtAmount = ethers.utils.parseUnits(amount.toString(), decimals);
      
      // Check USDT balance
      const balance = await usdtContract.balanceOf(walletAddress);
      
      if (balance.lt(usdtAmount)) {
        setError(`Insufficient USDT balance. You have ${ethers.utils.formatUnits(balance, decimals)} USDT.`);
        setLoading(false);
        return;
      }
      
      // Send USDT transaction
      const tx = await usdtContract.transfer(receiverAddress, usdtAmount);
      
      // Wait for transaction to be mined
      setTransactionHash(tx.hash);
      await tx.wait();
      
      // Verify transaction on backend
      const verifyResponse = await fetch("/api/credits/purchase/usdt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          transactionHash: tx.hash,
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyData.success) {
        throw new Error(verifyData.error || "Failed to verify USDT transaction");
      }
      
      setSuccess(true);
      router.push("/dashboard/credits?success=true");
    } catch (error) {
      console.error("USDT payment error:", error);
      setError("Failed to process USDT payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle NOWPayments payment
  const handleNOWPaymentsPayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a unique order ID
      const orderId = `NOW-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Create NOWPayments order
      const response = await fetch("/api/payments/nowpayments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          orderId: orderId,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to create NOWPayments order");
      }
      
      // Redirect to NOWPayments checkout
      window.location.href = data.data.paymentUrl;
    } catch (error) {
      console.error("NOWPayments error:", error);
      setError("Failed to process NOWPayments payment. Please try again.");
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount < 10) {
      setError("Minimum amount is 10 USD");
      return;
    }
    
    if (paymentMethod === "paypal") {
      await handlePayPalPayment();
    } else if (paymentMethod === "usdt") {
      await handleUSDTPayment();
    } else if (paymentMethod === "nowpayments") {
      await handleNOWPaymentsPayment();
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Purchase Credits</h2>
      
      {success ? (
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-md mb-4">
          <p className="text-green-800 dark:text-green-200">
            Credits purchased successfully! Your account has been credited.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 dark:bg-red-900 p-4 rounded-md mb-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Amount (USD)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {predefinedAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`py-2 px-4 rounded-md ${
                    amount === amt
                      ? "bg-primary text-white"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                  onClick={() => setAmount(amt)}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <label className="block text-sm font-medium mb-1">
                Custom Amount (min. $10)
              </label>
              <input
                type="number"
                min="10"
                step="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={paymentMethod === "paypal"}
                  onChange={() => setPaymentMethod("paypal")}
                  className="h-4 w-4 text-primary"
                />
                <span>PayPal</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="usdt"
                  checked={paymentMethod === "usdt"}
                  onChange={() => setPaymentMethod("usdt")}
                  className="h-4 w-4 text-primary"
                />
                <span>USDT (Optimism Network)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="nowpayments"
                  checked={paymentMethod === "nowpayments"}
                  onChange={() => setPaymentMethod("nowpayments")}
                  className="h-4 w-4 text-primary"
                />
                <span>NOWPayments (Crypto)</span>
              </label>
            </div>
          </div>
          
          {paymentMethod === "usdt" && (
            <div className="mb-6 p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">USDT Payment Details</h3>
              {!walletConnected ? (
                <button
                  type="button"
                  onClick={connectWallet}
                  className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Connect Wallet
                </button>
              ) : (
                <div>
                  <p className="text-sm mb-2">
                    Connected: {walletAddress.substring(0, 6)}...
                    {walletAddress.substring(walletAddress.length - 4)}
                  </p>
                  <p className="text-sm mb-2">
                    Send {amount} USDT to:
                  </p>
                  <div className="bg-background p-2 rounded-md text-xs break-all mb-2">
                    {receiverAddress}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Make sure you're on the Optimism network
                  </p>
                </div>
              )}
            </div>
          )}
          
          {paymentMethod === "nowpayments" && (
            <div className="mb-6 p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">NOWPayments Details</h3>
              <p className="text-sm mb-2">
                Pay with various cryptocurrencies including BTC, ETH, USDT, and more.
              </p>
              <p className="text-xs text-muted-foreground">
                You will be redirected to NOWPayments to complete your purchase.
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : `Purchase ${amount} Credits for $${amount}`}
          </button>
          
          {transactionHash && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium mb-1">Transaction Hash:</p>
              <a
                href={`https://optimistic.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs break-all text-primary hover:underline"
              >
                {transactionHash}
              </a>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
