"use client";

import { useCallback } from "react";
import { useAccount, useChainId } from "wagmi";
import type { Address, Hash } from "viem";
import {
  generateReferralTag,
  submitDivviReferral,
  appendReferralTag,
  isDivviEnabled,
  type DivviConfig,
} from "@/lib/divvi";
import { DIVVI_CONSUMER_ADDRESS } from "@/config/contract.config";

/**
 * Hook for managing Divvi referral integration
 */
export function useDivviReferral() {
  const { address } = useAccount();
  const chainId = useChainId();

  const config: DivviConfig = {
    consumerAddress: DIVVI_CONSUMER_ADDRESS,
    enabled: true, // Set to false to disable Divvi globally
  };

  const enabled = isDivviEnabled(config);

  /**
   * Generate a referral tag for the current user
   */
  const getReferralTag = useCallback((): string => {
    if (!enabled || !address || !config.consumerAddress) {
      return '';
    }

    return generateReferralTag(address, config.consumerAddress);
  }, [enabled, address, config.consumerAddress]);

  /**
   * Append referral tag to transaction data
   */
  const addReferralToTxData = useCallback(
    (txData: `0x${string}` | undefined): `0x${string}` => {
      if (!enabled) {
        return txData || '0x';
      }

      const referralTag = getReferralTag();
      return appendReferralTag(txData, referralTag);
    },
    [enabled, getReferralTag]
  );

  /**
   * Submit a referral after a transaction is confirmed
   */
  const submitReferral = useCallback(
    async (txHash: Hash): Promise<void> => {
      if (!enabled) {
        return;
      }

      await submitDivviReferral(txHash, chainId);
    },
    [enabled, chainId]
  );

  return {
    enabled,
    getReferralTag,
    addReferralToTxData,
    submitReferral,
  };
}
