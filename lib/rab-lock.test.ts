import { describe, expect, it } from 'vitest'

import { getRabMakerLockState } from '@/lib/rab-lock'

describe('getRabMakerLockState', () => {
  it('keeps draft and review RAB editable', () => {
    expect(getRabMakerLockState('draft')).toMatchObject({ locked: false, reason: null })
    expect(getRabMakerLockState('review')).toMatchObject({ locked: false, reason: null })
    expect(getRabMakerLockState(null)).toMatchObject({ locked: false, reason: null })
  })

  it('locks approved RABs before finalization', () => {
    expect(getRabMakerLockState('validated')).toMatchObject({
      locked: true,
      reason: 'approved',
    })
  })

  it('locks final RABs', () => {
    expect(getRabMakerLockState('final')).toMatchObject({
      locked: true,
      reason: 'final',
    })
  })
})
