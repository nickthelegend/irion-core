import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';

const MNEMONIC = 'caught juice job pulp harsh alarm boat region example asthma energy language swim acquire secret luxury artefact hawk upgrade noise edit party pen absent own';
const USDC_ID = 1123;
const POOL_APP_ID = 1127;
const LP_TOKEN_ID = 1131;

(async () => {
    try {
        const algorand = AlgorandClient.fromEnvironment();
        const dispenser = await algorand.account.fromMnemonic(MNEMONIC);
        
        console.log('Dispenser address:', dispenser.addr);
        
        // 1. Opt-in dispenser to LP Token
        console.log('Opting dispenser into LP Token...');
        await algorand.send.assetOptIn({
            sender: dispenser.addr,
            assetId: BigInt(LP_TOKEN_ID),
        });
        console.log('Opt-in successful.');

        // 2. Deposit USDC
        console.log('Depositing 1,000,000 USDC...');
        const amount = 1_000_000n * 1_000_000n;
        
        const txn = await algorand.createTransaction.assetTransfer({
            sender: dispenser.addr,
            receiver: algosdk.getApplicationAddress(POOL_APP_ID),
            assetId: BigInt(USDC_ID),
            amount: amount,
        });

        // deposit(axfer)
        const result = await algorand.send.appCallMethodCall({
            sender: dispenser.addr,
            appId: BigInt(POOL_APP_ID),
            method: new algosdk.ABIMethod({
                name: 'deposit',
                args: [{ type: 'axfer' }],
                returns: { type: 'void' }
            }),
            args: [{ txn: txn, signer: dispenser.signer }],
        });

        console.log('Deposit successful! TX:', result.transaction.txID());
        
    } catch (e) {
        console.error('Error during deposit:', e);
    }
})();
