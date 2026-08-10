import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { impUid } = await req.json()
  if (!impUid) return NextResponse.json({ error: 'impUid 없음' }, { status: 400 })

  // 포트원 액세스 토큰 발급
  const tokenRes = await fetch('https://api.iamport.kr/users/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imp_key: process.env.PORTONE_API_KEY,
      imp_secret: process.env.PORTONE_API_SECRET
    })
  })
  const tokenData = await tokenRes.json()
  const accessToken = tokenData.response?.access_token
  if (!accessToken) return NextResponse.json({ error: '토큰 발급 실패' }, { status: 500 })

  // 본인인증 정보 조회
  const certRes = await fetch(`https://api.iamport.kr/certifications/${impUid}`, {
    headers: { Authorization: accessToken }
  })
  const certData = await certRes.json()
  const cert = certData.response

  if (!cert) return NextResponse.json({ error: '인증 정보 없음' }, { status: 404 })

  return NextResponse.json({
    name: cert.name,
    birth: cert.birth,
    gender: cert.gender,
    phone: cert.phone,
    unique_key: cert.unique_key,
    certified: cert.certified,
  })
}
