import { algodClient, deployments } from '../lib/algorand/client';

async function verify() {
  console.log('--- Verification ---');
  console.log('Algod Server:', (algodClient as any).c.baseServer);
  console.log('USDC Asset ID:', deployments.usdc_asset_id);
  console.log('Lending Pool App ID:', deployments.lending_pool_app_id);
  
  try {
    const status = await algodClient.status().do();
    console.log('Connection to node: SUCCESS');
    console.log('Last Round:', status.lastRound);
  } catch (err: any) {
    console.error('Connection to node: FAILED');
    console.error(err.message);
  }
}

verify();
