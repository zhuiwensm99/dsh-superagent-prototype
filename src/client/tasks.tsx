/** Tasks/Session view: read-only supervision of all DSH workspace sessions running in the orchestrator. */
import { useMemo, useState } from 'react'
import type { SessionSummary } from '../app/api.ts'
import { usePoll, type SessionListView } from './api.ts'
import { SegmentedControl, StateDot, Icon } from './controls.tsx'
import { LabelValue } from './widgets.tsx'
import { usePanel } from './provider.tsx'
import { localized } from './text.ts'

type SessionFilter = 'running' | 'waiting' | 'ended'

const FILTERS: { value: SessionFilter; key: 'runningLabel' | 'waitingLabel' | 'endedLabel' }[] = [
  { value: 'running', key: 'runningLabel' },
  { value: 'waiting', key: 'waitingLabel' },
  { value: 'ended', key: 'endedLabel' },
]

/** One workspace Session row: id, live status, and the workspace it runs in. */
function SessionRow({ session }: { session: SessionSummary }) {
  const { t } = usePanel()
  const isActive = session.running
  const isEnded = session.blank
  return (
    <li className="dt-row dt-session">
      <div className="dt-session-id">
        <StateDot state={isActive ? 'ongoing' : isEnded ? 'done' : 'idle'} className="dt-session-status-dot" />
        <span className="dt-session-title">{localized(t, session.sessionId)}</span>
      </div>
      <div className="dt-session-meta">
        <span className="dt-session-cwd" aria-label={t('sessionCwdLabel')}>{session.cwd || t('sessionCwdLabel')}</span>
        <LabelValue label={t('sessionCountLabel')}
          value={isActive ? t('runningLabel') : isEnded ? t('endedLabel') : t('waitingLabel')} />
      </div>
    </li>
  )
}

export function TasksPage(): React.ReactNode {
  const { t, call } = usePanel()
  const [filter, setFilter] = useState<SessionFilter>('running')
  // Polled on its own so the page stays live without coupling to the shared `GET state` snapshot.
  const { data, error } = usePoll(() => call('GET sessions'), [])
  const sessions = (data?.sessions ?? []) as SessionListView['sessions']
  const running = sessions.filter(session => session.running && !session.blank)
  const waiting = sessions.filter(session => !session.running && !session.blank)
  const ended = sessions.filter(session => session.blank)
  const counts: Record<SessionFilter, number> = { running: running.length, waiting: waiting.length, ended: ended.length }
  const shown = filter === 'running' ? running : filter === 'waiting' ? waiting : ended
  const sessionList = useMemo(() => sessions, [sessions])

  return (
    <div className="dt-page tasks-page">
      <h2 className="dt-page-title">
        <Icon name="session" size={18} />
        <span>{t('tasksSubtitle')}</span>
        <span className="dt-muted">{sessionList.length} {t('sessions')}</span>
      </h2>
      <div className="dt-filters">
        <div className="dt-status-counts">
          {FILTERS.map(({ value, key }) => (
            <LabelValue key={value} label={t(key)} value={counts[value]} />
          ))}
        </div>
        <SegmentedControl label={t('tab.tasks')} value={filter} onChange={setFilter}
          options={FILTERS.map(({ value, key }) => ({ value, label: t(key) }))} />
      </div>
      {sessionList.length
        ? (
        <ul className="dt-list dt-session-list">
          {shown.map(session => <SessionRow key={session.sessionId} session={session} />)}
        </ul>
        )
        : <div className="dt-hint">{sessions.length === 0 ? t('sessionEmpty') : t('loading')}</div>}
    </div>
  )
}
