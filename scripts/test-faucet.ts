// @ts-nocheck
import axios from 'axios';

async function testFaucet() {
  const testAddress = "WMR3XYNUP32H67D4O7QG2GZ7T4J6Z5K6O7QG2GZ7T4J6Z5K6O7QG2GZ7U"; // Just a dummy test address format
  console.log(`[TEST] Testing Faucet for address: ${testAddress}`);
  
  try {
    const response = await axios.post('http://localhost:3000/api/faucet', {
      address: testAddress
    });
    
    console.log('[TEST] Success!', response.data);
    if (response.data.tx_id) {
        console.log(`[TEST] Transaction ID: ${response.data.tx_id}`);
    }
  } catch (error: any) {
    console.error('[TEST] Failed!', error.response?.data || error.message);
    if (error.response?.data?.error === "Address not opted into USDC asset") {
        console.log("[TEST] Note: Address needs to opt-in to Asset 1024 on localnet first.");
    }
  }
}

testFaucet();
