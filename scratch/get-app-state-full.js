

async function run() {
  const res = await fetch('https://testnet-api.algonode.cloud/v2/applications/758917027');
  const data = await res.json();
  console.log('App params:', JSON.stringify(data.params, null, 2));
}

run().catch(console.error);
