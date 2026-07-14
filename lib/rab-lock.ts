export type RabMakerStatus = 'draft' | 'review' | 'validated' | 'final'
export type RabMakerLockReason = 'approved' | 'final' | null

export type RabMakerLockState = {
  locked: boolean
  reason: RabMakerLockReason
  message: string | null
}

export function getRabMakerLockState(status: RabMakerStatus | null | undefined): RabMakerLockState {
  if (status === 'final') {
    return {
      locked: true,
      reason: 'final',
      message: 'RAB sudah final dan tidak bisa diubah.',
    }
  }

  if (status === 'validated') {
    return {
      locked: true,
      reason: 'approved',
      message: 'RAB sudah disetujui. Finalkan atau buka ulang lewat proses approval.',
    }
  }

  return {
    locked: false,
    reason: null,
    message: null,
  }
}
