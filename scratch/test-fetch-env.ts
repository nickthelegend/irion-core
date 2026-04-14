import * as dotenv from 'dotenv'
import * as path from 'path'

// Load .env.local explicitly
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { fetchPoolStats } from './lib/algorand/readChain'

async function test() {
  console.log('ENV NEXT_PUBLIC_LENDING_POOL_APP_ID:', process.env.NEXT_PUBLIC_LENDING_POOL_APP_ID)
  const stats = await fetchPoolStats()
  console.log('Final Result:', stats)
}

test().catch(console.error)
