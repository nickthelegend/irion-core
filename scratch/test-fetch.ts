import { fetchPoolStats } from './lib/algorand/readChain'

async function test() {
  const stats = await fetchPoolStats()
  console.log('Final Result:', stats)
}

test().catch(console.error)
