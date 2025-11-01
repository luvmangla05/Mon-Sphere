// ✅ src/hooks/useContracts.ts
import { useMemo } from "react";
import { ethers } from "ethers";
import ADDRESSES from "../config/addresses";
import { useEthers } from "./useEthers";

import UserRegistryABI from "../abis/UserRegistry.json";
import FriendSystemABI from "../abis/FriendSystem.json";
import ChatsABI from "../abis/Chats.json";
import ForumsABI from "../abis/Forums.json";

export function getContracts(signerOrProvider: any) {
  const userRegistry = new ethers.Contract(
    ADDRESSES.UserRegistry,
    UserRegistryABI.abi,
    signerOrProvider
  );

  const friendSystem = new ethers.Contract(
    ADDRESSES.FriendSystem,
    FriendSystemABI.abi,
    signerOrProvider
  );

  const chats = new ethers.Contract(
    ADDRESSES.Chats,
    ChatsABI.abi,
    signerOrProvider
  );

  const forums = new ethers.Contract(
    ADDRESSES.Forums,
    ForumsABI.abi,
    signerOrProvider
  );

  return {
    userRegistry,
    friendSystem,
    chats,
    forums,
  };
}

export function useContracts() {
  const { signer, provider } = useEthers();

  const contracts = useMemo(() => {
    if (!signer && !provider) return null;
    return getContracts(signer || provider);
  }, [signer, provider]);

  return contracts;
}
