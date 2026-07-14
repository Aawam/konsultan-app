import { ClockIcon } from 'lucide-react'

import type { RabAuditTimelineEvent } from '@/lib/actions/rab'

type AuditTimelineProps = {
  events: RabAuditTimelineEvent[]
}

const SOURCE_STYLE: Record<RabAuditTimelineEvent['source'], string> = {
  workflow: 'border-violet/25 bg-violet/10 text-violet',
  rab: 'border-brand/25 bg-brand/10 text-brand',
  export: 'border-emerald/25 bg-emerald/10 text-emerald',
}

const SOURCE_LABEL: Record<RabAuditTimelineEvent['source'], string> = {
  workflow: 'Workflow',
  rab: 'RAB',
  export: 'Export',
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Audit</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Timeline Aktivitas</h2>
        </div>
        <ClockIcon className="size-5 text-muted-foreground" />
      </div>

      <div className="mt-5 space-y-3">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3 md:grid-cols-[120px_1fr_auto]">
              <div>
                <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${SOURCE_STYLE[event.source]}`}>
                  {SOURCE_LABEL[event.source]}
                </span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
                {event.actor && <p className="mt-1 text-[11px] font-medium text-muted-foreground">{event.actor}</p>}
              </div>
              <p className="whitespace-nowrap text-xs text-muted-foreground md:text-right">
                {formatTimestamp(event.occurred_at)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Belum ada aktivitas RAB.
          </div>
        )}
      </div>
    </section>
  )
}
