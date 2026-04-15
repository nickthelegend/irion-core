import { fetchPoolStats } from '../lib/algorand/readChain';
import { connectDB } from '../lib/db/mongoose';
import { Pool } from '../lib/db/models/pool.model';
import { deployments } from '../lib/algorand/client';

async function test() {
    console.log('Testing pool stats fetch...');
    console.log('Using App ID:', deployments.lending_pool_app_id);
    
    await connectDB();
    const stats = await fetchPoolStats();
    console.log('Raw stats from chain:', stats);
    
    const rawDeposits = stats?.total_deposits ?? BigInt(0);
    const totalDeposits = Number(rawDeposits) / 1_000_000;
    
    console.log('Calculated total_deposits_usdc:', totalDeposits);
    
    // Check if it's 1M
    if (totalDeposits === 1000000) {
        console.error('ERROR: Still getting 1M liquidity!');
    } else {
        console.log('SUCCESS: Got reasonable liquidity value:', totalDeposits);
    }
    
    process.exit(0);
}

test();
