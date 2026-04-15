import algosdk from 'algosdk';

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

async function test() {
    try {
        const appInfo = await algodClient.getApplicationByID(758823264).do();
        const stateArray = appInfo.params['global-state'] || [];
        
        const decoded: Record<string, any> = {};
        for (const item of stateArray) {
            const key = Buffer.from(item.key, 'base64').toString();
            if (item.value.type === 2) {
                decoded[key] = item.value.uint.toString() + 'n';
            } else {
                decoded[key] = item.value.bytes;
            }
        }
        
        console.log("Decoded State:");
        console.log(decoded);
    } catch (e) {
        console.error("Error reading app:", e);
    }
}
test();
