const algosdk = require('algosdk');
const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
(async () => {
    try {
        const addr = 'HV4V3JKLUBMBIZHBAE3JVVYVRIW7W7Q3HE6DQSOJE5TOLG57TLAERWZHL4';
        const info = await client.accountInformation(addr).do();
        console.log(`Address: ${addr}`);
        const balance = typeof info.amount === 'bigint' ? Number(info.amount) : info.amount;
        console.log(`Balance: ${balance / 1_000_000} ALGOs`);
    } catch (e) {
        console.error(e);
    }
})();
