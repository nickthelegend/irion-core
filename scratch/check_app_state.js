const algosdk = require('algosdk');
const client = new algosdk.Algodv2('a'.repeat(64), 'http://localhost', 4001);
(async () => {
    try {
        const app = await client.getApplicationByID(1127).do();
        console.log(JSON.stringify(app, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value, 2));
    } catch (e) {
        console.error(e);
    }
})();
