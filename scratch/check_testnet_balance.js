const algosdk = require('algosdk');
const client = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
(async () => {
    try {
        const addr = 'NICKXD44FJQJZ2O5QLHS4FQSRX6WHHTSZG6HBQK4TJIOMHNVUSML33XITQ';
        const info = await client.accountInformation(addr).do();
        console.log(`Address: ${addr}`);
        const balance = typeof info.amount === 'bigint' ? Number(info.amount) : info.amount;
        console.log(`Balance: ${balance / 1_000_000} ALGOs`);
    } catch (e) {
        console.error(e);
    }
})();
