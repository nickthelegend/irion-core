import algosdk from 'algosdk';

const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const ALGOD_TOKEN = '';

const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

async function check() {
  const appIds = [758823264, 758796287];
  for (const appId of appIds) {
    console.log('\n--- Checking App ID:', appId, '---');
    try {
      const app = await client.getApplicationByID(appId).do();
    const globalState = app.params['global-state'];
    console.log('State exists:', !!globalState);
    if (globalState) {
      globalState.forEach((item: any) => {
        const key = Buffer.from(item.key, 'base64').toString();
        console.log(`Key: ${key}, Value: ${item.value.uint}`);
      });
    }
  } catch (e: any) {
    console.error('Error:', e.message);
    }
  }
}

check();
