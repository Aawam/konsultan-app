import { LoadingState } from '@/components/ui/loading-state'

export default function Loading() {
  return <LoadingState title="Memuat database" rows={6} metrics={4} />
}
