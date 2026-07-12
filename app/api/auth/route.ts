import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { action, password, hash } = await request.json()
  
  if (action === 'hash') {
    const hashed = await bcrypt.hash(password, 10)
    return NextResponse.json({ result: hashed })
  }
  
  if (action === 'verify') {
    const match = await bcrypt.compare(password, hash)
    return NextResponse.json({ match })
  }
  
  return NextResponse.json({ error: 'invalid action' }, { status: 400 })
}