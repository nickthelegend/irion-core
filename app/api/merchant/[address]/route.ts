import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Merchant } from '@/lib/db/models/merchant.model'

export async function GET(req: NextRequest, { params }: { params: { address: string } }) {
  try {
    await connectDB()
    let merchant = await Merchant.findOne({ wallet_address: params.address })
    if (!merchant) {
      merchant = await Merchant.create({ wallet_address: params.address })
    }
    return NextResponse.json(merchant)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { address: string } }) {
  try {
    await connectDB()
    const body = await req.json()
    const merchant = await Merchant.findOneAndUpdate(
      { wallet_address: params.address },
      body,
      { upsert: true, new: true }
    )
    return NextResponse.json(merchant)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
