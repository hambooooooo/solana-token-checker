import { PublicKey } from '@solana/web3.js';

// Define the structure for a single check
type CheckResult = {
  status: 'pass' | 'fail' | 'warn';
  message: string;
};

// Define the structure for the final, full report
export type SafetyReport = {
  mintAuthority: CheckResult;
  freezeAuthority: CheckResult;
  holderDistribution: CheckResult;
  liquidity: CheckResult; 
  metadata: CheckResult;
  tokenInfo: {
    name: string;
    symbol: string;
  };
};

// Define the Helius API URL
const HELIUS_API_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;

/**
 * Fetches and processes all token safety checks from Helius
 * @param mintAddress The token mint address to check
 */
export async function getSafetyReport(mintAddress: string): Promise<SafetyReport> {
  const [assetData, largestHoldersData] = await Promise.all([
    fetchHeliusAsset(mintAddress),
    fetchHeliusTokenLargestHolders(mintAddress),
  ]);

  // --- Run All Checks ---
  const mintAuthority = checkMintAuthority(assetData);
  const freezeAuthority = checkFreezeAuthority(assetData);
  
  // --- FIX 1: Safely get the total supply, default to 0 if null ---
  const totalSupply = assetData.supply?.supply || 0;
  const holderDistribution = checkHolderDistribution(largestHoldersData, totalSupply);
  // -----------------------------------------------------------------

  const metadata = checkMetadata(assetData);
  const liquidity = checkLiquidity(); // This is still a stubbed check

  // --- Compile Final Report ---
  return {
    mintAuthority,
    freezeAuthority,
    holderDistribution,
    liquidity,
    metadata,
    tokenInfo: {
      name: assetData.content.metadata.name || 'Unknown',
      symbol: assetData.content.metadata.symbol || 'Unknown',
    },
  };
}

// --- Individual Check Functions ---

function checkMintAuthority(assetData: any): CheckResult {
  if (assetData.ownership.mint_authority) {
    return {
      status: 'fail',
      message: '❌ Mint Authority Active: The creator can print infinite new tokens, devaluing your position.',
    };
  }
  return {
    status: 'pass',
    message: '✅ Mint Authority Renounced: The creator cannot mint new tokens.',
  };
}

function checkFreezeAuthority(assetData: any): CheckResult {
  if (assetData.ownership.freeze_authority) {
    return {
      status: 'fail',
      message: '❌ Freeze Authority Active: The creator can freeze this token in your wallet, making it untradeable.',
    };
  }
  return {
    status: 'pass',
    message: '✅ Freeze Authority Renounced: The creator cannot freeze your tokens.',
  };
}

function checkMetadata(assetData: any): CheckResult {
  if (assetData.mutable) {
    return {
      status: 'warn',
      message: "⚠️ Metadata is Mutable: The creator can change the token's name and image (e.g., to impersonate another token).",
    };
  }
  return {
    status: 'pass',
    message: "✅ Metadata is Immutable: The token's name and image are permanent.",
  };
}

function checkHolderDistribution(holders: any[], totalSupply: number): CheckResult {
  if (!holders || holders.length === 0) {
    return { status: 'fail', message: '❌ Could not retrieve holder data.' };
  }
  
  // --- FIX 2: Handle 0 supply tokens gracefully ---
  if (totalSupply === 0) {
    return {
      status: 'pass',
      message: '✅ Token has 0 supply. Holder distribution is not applicable.',
    };
  }
  // -----------------------------------------------

  const top10 = holders.slice(0, 10);
  const top10Balance = top10.reduce((sum, holder) => sum + parseFloat(holder.amount), 0);
  const top10Percentage = (top10Balance / totalSupply) * 100; // This is now safe

  if (top10Percentage > 20) {
    return {
      status: 'warn',
      message: `⚠️ High Concentration: The top 10 wallets hold ${top10Percentage.toFixed(1)}% of the supply. A sell-off could crash the price.`,
    };
  }
  return {
    status: 'pass',
    message: `✅ Healthy Distribution: The top 10 wallets hold ${top10Percentage.toFixed(1)}% of the supply.`,
  };
}

function checkLiquidity(): CheckResult {
  // NOTE: This remains a stubbed check as per the brief.
  return {
    status: 'warn',
    message: '⚠️ LP Check Not Implemented: This tool does not check for locked liquidity. Always DYOR.',
  };
}

// --- Helius API Fetcher Functions ---

async function fetchHeliusAsset(mintAddress: string): Promise<any> {
  const response = await fetch(HELIUS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'solana-token-checker',
      method: 'getAsset',
      params: {
        id: mintAddress,
      },
    }),
  });
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Helius getAsset error: ${data.error.message}`);
  }
  if (!data.result) {
    throw new Error('Failed to fetch asset data (no result)');
  }
  return data.result;
}

async function fetchHeliusTokenLargestHolders(mintAddress: string): Promise<any[]> {
  const response = await fetch(HELIUS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'solana-token-checker',
      method: 'getTokenLargestAccounts',
      params: [mintAddress],
    }),
  });
  const data = await response.json();

  if (data.error) {
    throw new Error(`Helius getTokenLargestAccounts error: ${data.error.message}`);
  }
  if (!data.result) {
    throw new Error('Failed to fetch holder data (no result)');
  }
  return data.result.value;
}