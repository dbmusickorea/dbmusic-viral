import { NextRequest, NextResponse } from 'next/server'

const EFORMSIGN_API_KEY = process.env.EFORMSIGN_API_KEY!
const EFORMSIGN_SECRET = process.env.EFORMSIGN_SECRET!
const EFORMSIGN_MEMBER_ID = process.env.EFORMSIGN_MEMBER_ID!
const EFORMSIGN_TEMPLATE_ID = process.env.EFORMSIGN_TEMPLATE_ID!
const EFORMSIGN_API_URL = 'https://kr-api.eformsign.com'

async function getAccessToken() {
  const execution_time = Date.now()
  const encoded = Buffer.from(EFORMSIGN_API_KEY).toString('base64')

  const res = await fetch('https://service.eformsign.com/v2.0/api_auth/access_token', {
    method: 'POST',
    headers: {
      'eformsign_signature': `Bearer ${EFORMSIGN_SECRET}`,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${encoded}`
    },
    body: JSON.stringify({ execution_time, member_id: EFORMSIGN_MEMBER_ID })
  })

  const data = await res.json()
  return {
    accessToken: data.oauth_token?.access_token,
    apiUrl: data.api_key?.company?.api_url
  }
}

export async function POST(request: NextRequest) {
  const action = request.nextUrl.searchParams.get('action')

  try {
    if (action === 'send') {
      // 계약서 서명 요청
      const body = await request.json()
      const { clientName, clientEmail, clientMobile, projectCode, productContent, songTitle, totalCost, startDate, endDate, artistName, optionName } = body
      const { accessToken, apiUrl } = await getAccessToken()

      console.log('eformsign request URL:', `${apiUrl}/v2.0/api/documents?template_id=${EFORMSIGN_TEMPLATE_ID}`)
      const res = await fetch(`${apiUrl}/v2.0/api/documents?template_id=${EFORMSIGN_TEMPLATE_ID}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document: {
            document_name: `${clientName} - ${productContent} 계약서`,
            recipients: [{
              step_type: '05',
              use_mail: true,
              use_sms: false,
              member: {
                name: clientName,
                id: clientEmail,
                sms: {
                  country_code: '+82',
                  phone_number: clientMobile
                }
              }
            }],
            fields: {
              artist_name: `${clientName} / ${artistName || ''}`,
              song_title: songTitle,
              product_name: optionName ? `${productContent} + ${optionName}` : productContent,
              contract_amount: `${totalCost.toLocaleString()}원`,
              contract_period: `${startDate} ~ ${endDate}`,
              DB_signature: ''
            }
          }
        })
      })

      const responseText = await res.text()
      console.log('eformsign status:', res.status)
      console.log('eformsign raw response:', responseText)
      const data = responseText ? JSON.parse(responseText) : {}
      console.log('eformsign response:', JSON.stringify(data))
      console.log('fields sent:', JSON.stringify({
        artist_name: `${clientName} / ${artistName || ''}`,
        song_title: songTitle,
        product_name: optionName ? `${productContent} + ${optionName}` : productContent,
        contract_amount: `${totalCost?.toLocaleString()}원`,
        contract_period: `${startDate} ~ ${endDate}`
      }))
      return NextResponse.json({ success: true, document_id: data.document_id })
    }

    if (action === 'download') {
      // PDF 다운로드
      const documentId = request.nextUrl.searchParams.get('document_id')
      const { accessToken, apiUrl } = await getAccessToken()

      const res = await fetch(`${apiUrl}/v2.0/api/documents/${documentId}/download_files`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      const data = await res.json()
      return NextResponse.json({ success: true, download_url: data.files?.[0]?.url })
    }

    if (action === 'status') {
      // 문서 상태 확인
      const documentId = request.nextUrl.searchParams.get('document_id')
      const { accessToken, apiUrl } = await getAccessToken()

      const res = await fetch(`${apiUrl}/v2.0/api/documents/${documentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      const data = await res.json()
      return NextResponse.json({ success: true, status: data.current_status?.status_type })
    }

  } catch (error) {
    console.error('eformsign error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }

  return NextResponse.json({ error: 'invalid action' }, { status: 400 })
}