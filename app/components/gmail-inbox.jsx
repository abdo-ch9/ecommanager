'use client'

import { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'

export function GmailInbox() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchInbox() {
      try {
        setLoading(true)
        setError(null)
        // You should implement your own API route for fetching inbox emails
        const response = await fetch('/api/gmail/inbox')
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `Failed to fetch Gmail inbox (${response.status})`)
        }
        const data = await response.json()
        setEmails(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchInbox()
  }, [])

  if (loading) {
    return <div>Loading Gmail inbox...</div>
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>
  }

  return (
    <div>
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
        <Mail className="w-5 h-5 text-red-600" /> Gmail Inbox
      </h3>
      {emails.length === 0 ? (
        <div>No emails found.</div>
      ) : (
        <ul>
          {emails.map((email) => (
            <li key={email.id}>
              <strong>{email.subject}</strong> - {email.from}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
} 