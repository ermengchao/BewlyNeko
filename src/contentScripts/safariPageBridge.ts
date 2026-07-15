import browser from 'webextension-polyfill'

import { SAFARI_INJECT_PAGE_SCRIPT, SAFARI_PAGE_SCRIPT_READY } from '~/constants/safari'
import { sendMessage } from '~/utils/messaging'

const PAGE_SCRIPT_PATH = 'dist/contentScripts/inject.global.js'
const PAGE_SCRIPT_READY_TIMEOUT = 500

// eslint-disable-next-line node/prefer-global/process
export function setupSafariPageBridge(isSafariBuild: boolean = Boolean(process.env.SAFARI)): void {
  if (!isSafariBuild)
    return

  let fallbackRequested = false

  const requestFallback = () => {
    if (fallbackRequested)
      return

    fallbackRequested = true
    void sendMessage(SAFARI_INJECT_PAGE_SCRIPT).catch((error) => {
      console.error('[BewlyNeko] Safari page-script fallback failed:', error)
    })
  }

  const readyTimeout = window.setTimeout(requestFallback, PAGE_SCRIPT_READY_TIMEOUT)
  const handleReady = (event: MessageEvent) => {
    if (event.source !== window || event.data?.type !== SAFARI_PAGE_SCRIPT_READY)
      return

    window.clearTimeout(readyTimeout)
    window.removeEventListener('message', handleReady)
  }

  window.addEventListener('message', handleReady)

  const script = document.createElement('script')
  script.src = browser.runtime.getURL(PAGE_SCRIPT_PATH)
  script.async = false
  script.addEventListener('load', () => script.remove(), { once: true })
  script.addEventListener('error', () => {
    script.remove()
    requestFallback()
  }, { once: true })

  const injectionRoot = document.head ?? document.documentElement
  if (!injectionRoot) {
    requestFallback()
    return
  }

  injectionRoot.appendChild(script)
}
