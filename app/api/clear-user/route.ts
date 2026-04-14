import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import { User } from '@/lib/db/models/user.model'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { address } = body

    if (!address) {
      return NextResponse.json({ error: 'Address required' }, { status: 400 })
    }

    await connectDB()

    // Delete user from database to force refresh
    const result = await User.deleteOne({ wallet_address: address })
    
    console.log('[API /clear-user] Deleted user:', address, 'Result:', result)

    return NextResponse.json({ 
      success: true, 
      message: 'User cleared from database',
      deleted: result.deletedCount > 0
    })
  } catch (err: any) {
    console.error('[API /clear-user] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}