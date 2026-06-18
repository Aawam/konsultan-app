import { ProyekFormShell } from '@/components/proyek/proyek-form-shell'
import type { DinasOption, Perusahaan, ProyekFormData } from '@/lib/types/proyek'

type Props = {
  perusahaanList: Perusahaan[]
  dinasList: DinasOption[]
  initialData: ProyekFormData
}

export function FormEditProyek(props: Props) {
  return <ProyekFormShell {...props} mode="edit" />
}
