'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase'
import { Mail, Users, Tag } from 'lucide-react'

export function GmailStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(false)

  // Fix hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)

        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('GmailStats: session', session);
        console.log('GmailStats: sending tokens', {
          access_token: session?.access_token,
          refresh_token: session?.refresh_token,
        });

        if (sessionError) throw sessionError
        if (!session) {
          setError('Please sign in to view Gmail statistics')
          return
        }

        // Check if Gmail is connected
        const { data: integration, error: integrationError } = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('platform', 'gmail')
          .single()

        if (integrationError) {
          setError('Gmail integration not found')
          return
        }
        if (!integration) {
          setError('Gmail integration not found')
          return
        }

        // Always send the access token in the Authorization header
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
        console.error('Error fetching Gmail stats:', err.message)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [mounted])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <Mail className="w-5 h-5 text-red-600" /> Gmail Statistics
        </h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
          <Mail className="w-5 h-5 text-red-600" /> Gmail Statistics
        </h3>
        <p className="text-sm text-gray-500">Loading...</p>
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
            <p className="text-sm text-gray-600">Labels</p>
            <p className="text-lg font-semibold text-gray-900">{stats.labels?.toLocaleString() || 0}</p>
          </div>
          
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Contacts</p>
            <p className="text-lg font-semibold text-gray-900">{stats.contacts?.toLocaleString() || 0}</p>
          </div>
        </div>
      )}
    </div>
  )
}
