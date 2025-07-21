import { NextResponse } from 'next/server'
import { connect } from 'imap'

export async function POST(request) {
  try {
    const { host, port, username, password } = await request.json()

    // Validate required fields
    if (!host || !port || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Test IMAP connection
    const imap = new connect({
      host,
      port,
      user: username,
      password,
      tls: port === 993, // Use TLS for port 993 (standard IMAP SSL port)
      tlsOptions: { rejectUnauthorized: false } // For testing - in production, validate certificates
    })

    // Wrap IMAP connection in a promise
    await new Promise((resolve, reject) => {
      imap.once('ready', () => {
        imap.end()
        resolve()
      })

      imap.once('error', (err) => {
        reject(new Error(`IMAP connection failed: ${err.message}`))
      })

      imap.connect()
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('IMAP test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect to IMAP server' },
      { status: 500 }
    )
  }
} 