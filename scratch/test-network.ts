import { getLendingPoolClient } from './lib/algorand/client';

async function test() {
    console.log('Fetching directly...');
    const client = getLendingPoolClient();
    
    console.log("Client app ID:", client.appId);
    console.log("Client instance:", client.appClient.getAppReference());
    
    try {
        const composer = client.appClient.client.algod;
        const genesis = await composer.genesis().do();
        console.log("Connected to network:", genesis.network);
        console.log("Genesis ID:", genesis.id);
        
        console.log("Calling getPoolStats...");
        const result = await client.send.getPoolStats({ args: [] });
        console.log("Success! Return:", result.return);
    } catch(e) {
        console.log('Error caught!', e);
    }
}
test();
