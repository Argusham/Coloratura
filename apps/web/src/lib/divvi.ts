import { getReferralTag, submitReferral } from '@divvi/referral-sdk';
import type { Address, Hash, WalletClient } from 'viem';

export interface DivviConfig {
  consumerAddress: Address;
  enabled?: boolean;
}

export interface DivviReferralResult {
  referralTag: string;
  submitReferral: (txHash: Hash, chainId: number) => Promise<void>;
}

/**
 * Generate a referral tag for a transaction
 * @param user - The user address making the transaction
 * @param consumerAddress - Your Divvi Identifier (consumer address)
 * @returns The referral tag to append to transaction data
 */
export function generateReferralTag(
  user: Address,
  consumerAddress: Address
): string {
  try {
    const referralTag = getReferralTag({
      user,
      consumer: consumerAddress,
    });
    console.log('[DIVVI] Generated referral tag:', referralTag);
    return referralTag;
  } catch (error) {
    console.error('[DIVVI] Error generating referral tag:', error);
    return '';
  }
}

/**
 * Submit a referral to Divvi after a transaction
 * @param txHash - The transaction hash
 * @param chainId - The chain ID where the transaction was sent
 */
export async function submitDivviReferral(
  txHash: Hash,
  chainId: number
): Promise<void> {
  try {
    console.log('[DIVVI] Submitting referral:', { txHash, chainId });
    await submitReferral({
      txHash,
      chainId,
    });
    console.log('[DIVVI] Referral submitted successfully');
  } catch (error) {
    console.error('[DIVVI] Error submitting referral:', error);
    // Don't throw - referral submission failures shouldn't block the main flow
  }
}

/**
 * Append referral tag to transaction data
 * @param data - Original transaction data
 * @param referralTag - The referral tag to append
 * @returns Combined data with referral tag
 */
export function appendReferralTag(
  data: `0x${string}` | undefined,
  referralTag: string
): `0x${string}` {
  if (!referralTag) {
    return data || '0x';
  }

  const baseData = data || '0x';
  // Remove '0x' prefix from referral tag if present
  const cleanTag = referralTag.startsWith('0x') ? referralTag.slice(2) : referralTag;

  return `${baseData}${cleanTag}` as `0x${string}`;
}

/**
 * Check if Divvi integration is available
 * @param config - Divvi configuration
 * @returns true if Divvi should be used
 */
export function isDivviEnabled(config?: DivviConfig): boolean {
  return config?.enabled !== false && !!config?.consumerAddress;
}
