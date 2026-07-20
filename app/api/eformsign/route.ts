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
      const { clientName, clientEmail, clientMobile, projectCode, productContent, songTitle, totalCost, startDate, endDate, artistName, optionName, refreshInterval, monitoringExtension, coverVideoCount, requiredPosts } = body
      const { accessToken, apiUrl } = await getAccessToken()

      const refreshMap: any = { '12': '기본 트래픽', '6': '실버 트래픽', '3': '골드 트래픽', '1': '다이아 VIP' }
      const options = [
        refreshInterval ? refreshMap[String(refreshInterval)] : '',
        Number(monitoringExtension) > 0 ? `모니터링 ${monitoringExtension}일 연장` : '',
        Number(coverVideoCount) > 0 ? `커버영상 ${coverVideoCount}개` : '',
        Number(requiredPosts) > 1 ? `게시물 ${requiredPosts}개` : '',
        optionName || ''
      ].filter(Boolean).join(' / ')
      const productNameValue = options ? `${productContent} + ${options}` : productContent

      // 회사 도장 가져오기
      const stampRes = await fetch(`${apiUrl}/v2.0/api/company_stamp/07f75916d49a42a59ddcd42e08f79820`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const stampData = await stampRes.json()
      const stampBase64 = stampData?.stamp?.path ?? ''

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
              use_sms: true,
              use_kakao: true,
              member: {
                name: clientName,
                id: clientEmail,
                sms: {
                  country_code: '+82',
                  phone_number: clientMobile?.replace(/-/g, '').replace(/^0/, '')
                }
              }
            }],
            fields: [
              { id: 'artist_name', value: `${clientName} / ${artistName || ''}` },
              { id: 'song_title', value: songTitle },
              { id: 'product_name', value: productNameValue },
              { id: 'contract_amount', value: `${totalCost.toLocaleString()}원` },
              { id: 'contract_period', value: `${startDate} ~ ${endDate}` },
              { id: 'DB_signature', value: stampBase64 }
            ]
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
      console.log('document_id:', data.document?.id)
      return NextResponse.json({ success: true, document_id: data.document?.id })
    }

    if (action === 'download') {
      const documentId = request.nextUrl.searchParams.get('document_id')
      const { accessToken, apiUrl } = await getAccessToken()
      console.log('download document_id:', documentId)

      const res = await fetch(`${apiUrl}/v2.0/api/documents/${documentId}/download_files?file_type=document`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${accessToken}`
        }
      })
      console.log('download status:', res.status)
      
      if (!res.ok) {
        const errText = await res.text()
        console.log('download error:', errText)
        return NextResponse.json({ error: '다운로드 실패' }, { status: 400 })
      }

      const pdfBuffer = await res.arrayBuffer()
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename=contract.pdf'
        }
      })
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