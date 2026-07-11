import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.ENCRYPT_KEY!

export async function POST(request: NextRequest) {
  const { text } = await request.json()
  if (!text) return NextResponse.json({ result: '' })
  const encrypted = CryptoJS.AES.encrypt(text, SECRET_KEY).toString()
  return NextResponse.json({ result: encrypted })
}