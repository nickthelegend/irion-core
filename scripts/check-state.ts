import { algodClient, deployments } from '../lib/algorand/client';

async function checkState() {
  const appId = deployments.lending_pool_app_id;
  console.log('Checking App ID:', appId);
  try {
    const appInfo = await algodClient.getApplicationByID(appId).do();
    console.log('Global State:', JSON.stringify(appInfo.params['global-state'], null, 2));
    
    // Decode total_deposits (key 'td')
    const state = appInfo.params['global-state'];
    if (state) {
        state.forEach((item: any) => {
            const key = Buffer.from(item.key, 'base64').toString();
            console.log(`Key: ${key}, Value: ${item.value.uint}`);
        });
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

checkState();
