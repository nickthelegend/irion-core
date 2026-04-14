import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { Merchant } from '@/lib/db/models/merchant.model'

export async function GET(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    await connectDB()
    let merchant = await Merchant.findOne({ wallet_address: address })
    if (!merchant) {
      merchant = await Merchant.create({ wallet_address: address })
    }
    return NextResponse.json(merchant)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params
    await connectDB()
    const body = await req.json()
    const merchant = await Merchant.findOneAndUpdate(
      { wallet_address: address },
      body,
      { upsert: true, new: true }
    )
    return NextResponse.json(merchant)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
