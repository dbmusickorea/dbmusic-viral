export const encryptText = async (text: string): Promise<string> => {
  if (!text) return ''
  const res = await fetch('/api/encrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  const data = await res.json()
  return data.result
}

export const decryptText = async (text: string): Promise<string> => {
  if (!text) return ''
  const res = await fetch('/api/decrypt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  const data = await res.json()
  return data.result
}

export const maskAccount = (account: string): string => {
  if (!account) return ''
  if (account.length <= 4) return account
  return account.slice(0, 4) + '*'.repeat(account.length - 4)
}

export const maskResident = (resident: string): string => {
  if (!resident) return ''
  return resident.slice(0, 6) + '-*******'
}