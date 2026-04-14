const algosdk = require('algosdk');

const MNEMONIC = 'caught juice job pulp harsh alarm boat region example asthma energy language swim acquire secret luxury artefact hawk upgrade noise edit party pen absent own';
const ALGOD_SERVER = 'http://localhost';
const ALGOD_PORT = 4001;
const ALGOD_TOKEN = 'a'.repeat(64);

const USDC_ID = 1123;
const POOL_APP_ID = 1127;
const LP_TOKEN_ID = 1131;
const POOL_ADDRESS = 'YID6PMB6G2DY3VPLSVRK73K3WL7RANNN3GPINFY5GK7DSYMRMZFELJCKUM';

(async () => {
    try {
        const client = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
        const dispenser = algosdk.mnemonicToSecretKey(MNEMONIC);
        const dispenserAddr = dispenser.addr.toString();
        const sp = await client.getTransactionParams().do();
        
        console.log('Dispenser address:', dispenserAddr);
        
        // Opt-in dispenser to LP Token
        try {
            const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
                from: dispenserAddr,
                to: dispenserAddr,
                assetIndex: LP_TOKEN_ID,
                amount: 0,
                suggestedParams: sp,
            });
            await client.sendRawTransaction(optInTxn.signTxn(dispenser.sk)).do();
            await algosdk.waitForConfirmation(client, optInTxn.txID(), 4);
            console.log('Opt-in successful.');
        } catch (e) {
            console.log('Dispenser already opted in or error:', e.message);
        }

        const depositAmount = 1_000_000 * 1_000_000;
        
        // Build Axfer
        const axfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: dispenserAddr,
            to: POOL_ADDRESS,
            assetIndex: USDC_ID,
            amount: depositAmount,
            suggestedParams: sp,
        });

        const composer = new algosdk.AtomicTransactionComposer();
        const method = new algosdk.ABIMethod({
            name: 'deposit',
            args: [{ type: 'axfer' }],
            returns: { type: 'void' }
        });

        composer.addMethodCall({
            sender: dispenserAddr,
            signer: async (group) => group.map((txn) => txn.signTxn(dispenser.sk)),
            appID: POOL_APP_ID,
            method: method,
            methodArgs: [
                {
                    txn: axfer,
                    signer: async (group) => group.map((txn) => txn.signTxn(dispenser.sk))
                }
            ],
            suggestedParams: sp,
        });

        console.log('Executing deposit...');
        const result = await composer.execute(client, 4);
        console.log('Deposit successful! TX:', result.txID);
        
    } catch (e) {
        console.error('Error during deposit:', e.message);
        if (e.message.includes('logic eval error')) {
            console.error('Full logic error details probably in simulation or logs.');
        }
    }
})();
