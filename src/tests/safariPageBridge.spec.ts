import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SAFARI_INJECT_PAGE_SCRIPT, SAFARI_PAGE_SCRIPT_READY } from '~/constants/safari'
import { setupSafariPageBridge } from '~/contentScripts/safariPageBridge'
import { sendMessage } from '~/utils/messaging'

vi.mock('webextension-polyfill', () => ({
  default: {
    runtime: {
      getURL: (path: string) => `safari-web-extension://bewly-neko/${path}`,
    },
  },
}))

vi.mock('~/utils/messaging', () => ({
  sendMessage: vi.fn().mockResolvedValue(undefined),
}))

function dispatchReady() {
  window.dispatchEvent(new MessageEvent('message', {
    data: { type: SAFARI_PAGE_SCRIPT_READY },
    source: window,
  }))
}

describe('safari page bridge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(sendMessage).mockClear()
    document.head.innerHTML = ''
  })

  afterEach(() => {
    dispatchReady()
    vi.useRealTimers()
  })

  it('injects the page script and cancels the fallback after the ready signal', () => {
    setupSafariPageBridge(true)

    const script = document.head.querySelector('script')
    expect(script?.src).toBe('safari-web-extension://bewly-neko/dist/contentScripts/inject.global.js')

    dispatchReady()
    vi.advanceTimersByTime(500)

    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('requests a background fallback when the page script does not become ready', async () => {
    setupSafariPageBridge(true)
    await vi.advanceTimersByTimeAsync(500)

    expect(sendMessage).toHaveBeenCalledOnce()
    expect(sendMessage).toHaveBeenCalledWith(SAFARI_INJECT_PAGE_SCRIPT)
  })

  it('requests the fallback only once when loading fails before the timeout', async () => {
    setupSafariPageBridge(true)

    document.head.querySelector('script')?.dispatchEvent(new Event('error'))
    await vi.advanceTimersByTimeAsync(500)

    expect(sendMessage).toHaveBeenCalledOnce()
  })

  it('does nothing for non-Safari builds', () => {
    setupSafariPageBridge(false)

    expect(document.head.querySelector('script')).toBeNull()
    expect(sendMessage).not.toHaveBeenCalled()
  })
})
