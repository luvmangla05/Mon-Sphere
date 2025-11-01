// ✅ src/hooks/useEthers.ts
import { BrowserProvider } from "ethers";
import ADDRESSES from "../config/addresses";
import { useState, useEffect } from "react";

// TS error fix
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useEthers() {
  const [provider, setProvider] = useState<any>(null);
  const [signer, setSigner] = useState<any>(null);
  const [address, setAddress] = useState<string>("");

  const connect = async () => {
    if (!window.ethereum) {
      alert("MetaMask not installed! Please install MetaMask to continue.");
      window.open("https://metamask.io/", "_blank");
      return;
    }

    try {
      // Optional chain enforcement
      const requiredChainIdHex: string | undefined = (ADDRESSES as any)?.requiredChainIdHex;
      if (requiredChainIdHex) {
        const current = await window.ethereum.request({ method: 'eth_chainId' });
        if (current?.toLowerCase() !== requiredChainIdHex.toLowerCase()) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: requiredChainIdHex }],
            });
          } catch (switchError: any) {
            if (switchError?.code === 4902) {
              const addParams = (ADDRESSES as any)?.addChainParams;
              if (addParams) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [addParams],
                });
              } else {
                alert('Required network not found in MetaMask. Please add it or provide addChainParams in config.');
                return;
              }
            } else {
              alert('Please switch to the required network in MetaMask.');
              return;
            }
          }
        }
      }

      const prov = new BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const signer = await prov.getSigner();
      const addr = await signer.getAddress();

      setProvider(prov);
      setSigner(signer);
      setAddress(addr);
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      if (error.code === 4001) {
        alert("Please connect your wallet to continue.");
      } else {
        alert("Failed to connect wallet. Please try again.");
      }
    }
  };

  const disconnect = () => {
    setAddress("");
    setSigner(null);
    setProvider(null);
  };

  useEffect(() => {
    if (window.ethereum) {
      // Check if already connected
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const requiredChainIdHex: string | undefined = (ADDRESSES as any)?.requiredChainIdHex;
          const current = await window.ethereum.request({ method: 'eth_chainId' });
          const onRequiredChain = !requiredChainIdHex || (current?.toLowerCase() === requiredChainIdHex.toLowerCase());
          if (accounts.length > 0 && onRequiredChain) {
            await connect();
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      };
      
      checkConnection();

      // Listen for account changes
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress("");
          setSigner(null);
          setProvider(null);
        } else {
          await connect();
        }
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      return () => {
        window.ethereum?.removeAllListeners?.('accountsChanged');
        window.ethereum?.removeAllListeners?.('chainChanged');
      };
    }
  }, []);

  return { provider, signer, address, connect, disconnect };
}
