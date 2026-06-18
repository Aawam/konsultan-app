import { ProyekFormShell } from '@/components/proyek/proyek-form-shell'
import type { DinasOption, Perusahaan } from '@/lib/types/proyek'

type Props = {
  perusahaanList: Perusahaan[]
  dinasList: DinasOption[]
}

export function FormCreateProyek(props: Props) {
  return <ProyekFormShell {...props} mode="create" />
}
