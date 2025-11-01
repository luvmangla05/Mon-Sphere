const ADDRESSES = {
    network: "monad-testnet",

    UserRegistry: "0x68be3c99080f2613cc5C2555104788Ec3bf6f714",
    FriendSystem: "0x00838888043AEe4EE1aC6C50e616eB904faC3AD0",
    Chats: "0x7030948Eb01d864Fa409884ff3441B13e16681d2",
    Forums: "0x7D4827051c2c7f264A5C7feA2D04c53a1C328D8d",

    // Enforce Monad Testnet in MetaMask (used by useEthers)
    requiredChainIdHex: "0x279F", // 10143
    addChainParams: {
      chainId: "0x279F",
      chainName: "Monad Testnet",
      rpcUrls: ["https://testnet-rpc.monad.xyz/"],
      nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
      blockExplorerUrls: ["https://testnet.monadexplorer.com/"]
    }
  };

  export default ADDRESSES;