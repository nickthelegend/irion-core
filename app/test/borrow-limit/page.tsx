'use client'

import { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

export default function TestBorrowLimitPage() {
  const { activeAddress } = useWallet()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testBorrowLimit = async () => {
    if (!activeAddress) return
    setLoading(true)
    try {
      const res = await fetch(`/api/test/borrow-limit?address=${activeAddress}`)
      const data = await res.json()
      setResult(data)
      console.log('Test result:', data)
    } catch (e) {
      setResult({ error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Test Borrow Limit</h1>
      
      <div className="mb-4">
        <p className="text-sm text-gray-400">Connected Address:</p>
        <p className="font-mono text-sm">{activeAddress || 'Not connected'}</p>
      </div>

      <button
        onClick={testBorrowLimit}
        disabled={!activeAddress || loading}
        className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Borrow Limit'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-900 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}