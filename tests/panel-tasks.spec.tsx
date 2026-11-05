// @vitest-environment jsdom
// The Tasks/Session view: read-only supervision of the workspace sessions the orchestrator runs.
import { expect, it } from 'vitest'
import type { SessionId } from '@deepseek-ai/dsh-session'
import { en, zh } from '../src/client/locales.ts'
import { all, click, find, mount, remount, text, tab, usePanel } from './fixtures/panel.tsx'
import { server, sessionOf } from './fixtures/panel-server.ts'

usePanel()
it('lists the workspace Sessions on the Tasks tab with running / waiting / ended status and a working directory', async () => {
  server.sessions = [
    sessionOf({ sessionId: 'ws-run-1' as SessionId, cwd: '/w/run-1', running: true, agentAvailable: true, blank: false, updatedAt: 1 }),
    sessionOf({ sessionId: 'ws-wait-1' as SessionId, cwd: '/w/wait-1', running: false, agentAvailable: true, blank: false, updatedAt: 1 }),
    sessionOf({ sessionId: 'ws-end-1' as SessionId, cwd: '/w/end-1', running: false, blank: true, updatedAt: 1 }),
  ]
  await mount()
  await click(zh['tab.tasks'])
  expect(tab(zh['tab.tasks']).getAttribute('aria-selected')).toBe('true')
  // Polled once so the page is live without the shared state snapshot; the sessions are served by the endpoint.
  expect(server.requests.some(request => request.path === 'sessions' && request.method === 'GET')).toBe(true)
  // Default filter is running; only the active Session is listed.
  expect(all('.dt-session')).toHaveLength(1)
  expect(all('.dt-session-id').map(item => item.textContent)).toEqual(['ws-run-1'])
  expect(all('.dt-session').map(row => row.textContent).some(text => text.includes('运行中'))).toBe(true)
  expect(all('.dt-session').map(row => row.textContent).some(text => text.includes('等待中'))).toBe(false)
  expect(all('.dt-session').map(row => row.textContent).some(text => text.includes('已结束'))).toBe(false)
  // Each row carries its working directory.
  expect(all('.dt-session-cwd').map(item => item.textContent)).toEqual(['/w/run-1'])
  // Each status has its own count row in the status summary.
  expect(all('.dt-status-counts .dt-lv')).toHaveLength(3)
  await click(find(zh['waitingLabel'], '[role="tab"]'))
  expect(all('.dt-session')).toHaveLength(1)
  expect(all('.dt-session').map(row => row.textContent).some(text => text.includes('等待中'))).toBe(true)
  await click(find(zh['endedLabel'], '[role="tab"]'))
  expect(all('.dt-session')).toHaveLength(1)
  expect(all('.dt-session').map(row => row.textContent).some(text => text.includes('已结束'))).toBe(true)
  // English tab label is listed too.
  await remount(en)
  await click(en['tab.tasks'])
  expect(tab(en['tab.tasks']).getAttribute('aria-selected')).toBe('true')
})

it('shows nothing when there are no workspace Sessions', async () => {
  server.sessions = []
  await mount()
  await click(zh['tab.tasks'])
  expect(text()).toContain(zh['sessionEmpty'])
})
