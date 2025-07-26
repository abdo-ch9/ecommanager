'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, Users, Tag } from 'lucide-react'
import { supabase } from '@/utils/supabase'

export function GmailStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let intervalId;

    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)
        // Get the current session and access token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Not authenticated')
        }
        const response = await fetch('/api/gmail/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `Failed to fetch Gmail stats (${response.status})`)
        }
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    intervalId = setInterval(fetchStats, 30000) // Poll every 30 seconds

    return () => clearInterval(intervalId)
  }, [])

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <Mail className="w-5 h-5 text-red-600" /> Gmail Statistics
        </h3>
        <div className="flex justify-center items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <Mail className="w-5 h-5 text-red-600" /> Gmail Statistics
        </h3>
        <p className="text-sm text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
        <Mail className="w-5 h-5 text-red-600" /> Gmail Statistics
      </h3>
      {stats && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Emails</p>
              <p className="text-lg font-semibold text-gray-900">{stats.emails?.toLocaleString() || 0}</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Tag className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">important Emails</p>
              <p className="text-lg font-semibold text-gray-900">{stats.importantEmails?.toLocaleString() || 0}</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">sent Emails</p>
              <p className="text-lg font-semibold text-gray-900">{stats.sentEmails?.toLocaleString() || 0}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center space-x-4">
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Go to Gmail Inbox
            </a>
            <Link
              href="/gmail-inbox"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Go to Gmail Inbox Page
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
