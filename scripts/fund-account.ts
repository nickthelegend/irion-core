import algosdk from 'algosdk';

const TARGET_ADDRESS = 'LEGENDMQQJJWSQVHRFK36EP7GTM3MTI3VD3GN25YMKJ6MEBR35J4SBNVD4';
const ALGOD_SERVER = 'http://localhost';
const ALGOD_PORT = 4001;
const ALGOD_TOKEN = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

// Default LocalNet dispenser mnemonic
const DISPENSER_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon invest';

async function fundAccount() {
  try {
    const dispenserAccount = algosdk.mnemonicToSecretKey(DISPENSER_MNEMONIC);
    console.log('Dispenser address:', dispenserAccount.addr);
    
    const sp = await algodClient.getTransactionParams().do();
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: dispenserAccount.addr,
      to: TARGET_ADDRESS,
      amount: 10_000_000, // 10 ALGO
      suggestedParams: sp
    });
    
    const signedTxn = txn.signTxn(dispenserAccount.sk);
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    console.log('Funding transaction sent:', txId);
    
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    const accountInfo = await algodClient.accountInformation(TARGET_ADDRESS).do();
    console.log('Account funded! New balance:', accountInfo.amount / 1_000_000, 'ALGO');
  } catch (error: any) {
    console.error('Error funding account:', error.message);
    console.error(error);
  }
}

fundAccount();
