import { NextRequest, NextResponse } from 'next/server'
import apn from 'node-apn'
import path from 'path'
import fs from 'fs'

export async function POST(request: NextRequest) {
  const { title, body, tokens } = await request.json()

  if (!title || !body || !tokens || tokens.length === 0) {
    return NextResponse.json({ error: 'title, body, tokens required' }, { status: 400 })
  }

  const keyData = process.env.APN_KEY
  if (!keyData) {
    return NextResponse.json({ error: 'APN_KEY not configured' }, { status: 500 })
  }

  const provider = new apn.Provider({
    token: {
      key: Buffer.from(keyData, 'base64'),
      keyId: process.env.APN_KEY_ID!,
      teamId: process.env.APN_TEAM_ID!,
    },
    production: true
  })

  const notification = new apn.Notification()
  notification.alert = { title, body }
  notification.sound = 'default'
  notification.topic = 'com.dbmusic.viral'

  const results = []
  for (const token of tokens) {
    const result = await provider.send(notification, token)
    results.push(result)
  }

  provider.shutdown()

  return NextResponse.json({ success: true, results })
}