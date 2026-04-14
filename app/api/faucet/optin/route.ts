import { NextRequest, NextResponse } from 'next/server'

const IUSDC_ASSET_ID = Number(process.env.NEXT_PUBLIC_USDC_ASSET_ID ?? 0)

// This endpoint just returns the asset ID and opt-in instructions.
// The actual opt-in is a wallet-signed transaction on the client side.
export async function GET() {
  return NextResponse.json({
    asset_id: IUSDC_ASSET_ID,
    asset_name: 'iUSDC',
    decimals: 6,
    instructions: 'Sign a 0-amount asset transfer from your address to yourself to opt-in.',
  })
}
