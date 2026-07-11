import { NextRequest, NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.ENCRYPT_KEY!

export async function POST(request: NextRequest) {
  const { text } = await request.json()
  if (!text) return NextResponse.json({ result: '' })
  try {
    const bytes = CryptoJS.AES.decrypt(text, SECRET_KEY)
    const result = bytes.toString(CryptoJS.enc.Utf8)
    return NextResponse.json({ result })
  } catch {
    return NextResponse.json({ result: text })
  }
}