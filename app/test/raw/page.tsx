'use client'

import { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'

export default function TestRawPage() {
  const { activeAddress } = useWallet()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testRaw = async () => {
    if (!activeAddress) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/test/raw?address=${activeAddress}`)
      const data = await res.json()
      setResult(data)
      if (data.error) {
        setError(data.error)
      }
      console.log('Raw test result:', data)
    } catch (e: any) {
      setError(e.message)
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 text-white max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Test Raw Contract Call</h1>
      
      <div className="mb-4 p-4 bg-gray-800 rounded">
        <p className="text-sm text-gray-400">Connected Address:</p>
        <p className="font-mono text-sm break-all">{activeAddress || 'Not connected'}</p>
      </div>

      <button
        onClick={testRaw}
        disabled={!activeAddress || loading}
        className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50 mb-4"
      >
        {loading ? 'Testing...' : 'Test Raw Contract Call'}
      </button>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded">
          <h2 className="font-bold text-red-400 mb-2">Error:</h2>
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {result && !error && (
        <div className="mt-4 p-4 bg-gray-900 rounded overflow-auto max-h-96">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-yellow-900/30 border border-yellow-600 rounded">
        <h3 className="font-bold text-yellow-400 mb-2">What to check:</h3>
        <ul className="list-disc list-inside text-sm text-yellow-200 space-y-1">
          <li>Look at the browser console for detailed logs</li>
          <li>Check the server terminal for [TEST-RAW] logs</li>
          <li>Look for the simulateResult.returnValue</li>
          <li>If returnValue is 0, the contract is returning 0</li>
          <li>If there's an error, check the error message</li>
        </ul>
      </div>
    </div>
  )
}