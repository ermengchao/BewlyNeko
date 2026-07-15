import browser from 'webextension-polyfill'

import { SAFARI_INJECT_PAGE_SCRIPT } from '~/constants/safari'
import { onMessage } from '~/utils/messaging'

const PAGE_SCRIPT_PATH = 'dist/contentScripts/inject.global.js'

export function setupSafariPageScriptListener(): void {
  // eslint-disable-next-line node/prefer-global/process
  if (!process.env.SAFARI)
    return

  onMessage(SAFARI_INJECT_PAGE_SCRIPT, async (_data, sender) => {
    const tabId = sender?.tab?.id
    const frameId = sender?.frameId
    if (tabId === undefined || frameId === undefined)
      throw new Error('Safari page-script injection requires a tab and frame')

    await browser.scripting.executeScript({
      files: [PAGE_SCRIPT_PATH],
      target: { tabId, frameIds: [frameId] },
      world: 'MAIN',
    })
  })
}
