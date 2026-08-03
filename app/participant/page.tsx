'use client'
import { ParticipantProvider } from '../../contexts/ParticipantContext'
import ParticipantContent from './ParticipantContent'

export default function Page2() {
  return (
    <ParticipantProvider>
      <ParticipantContent />
    </ParticipantProvider>
  )
}
