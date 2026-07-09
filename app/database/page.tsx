import { getPerusahaanDetailList } from '@/lib/actions/perusahaan'
import { getDaftarProyek, getDinasList } from '@/lib/actions/proyek'
import { getAhspDetailList, getAhspItemList, getKategoriPekerjaanMasterList, getMasterHargaList, getSatuanList } from '@/lib/actions/ahsp'
import { PageError } from '@/components/ui/page-error'
import { ReferenceDatabaseClient } from '@/components/database/reference-database-client'
import { getCurrentUserProfile, isOwnerAdmin } from '@/lib/auth'

export default async function DatabasePage() {
  const { profile } = await getCurrentUserProfile()
  const canViewInternal = isOwnerAdmin(profile)

  const [
    { data: ahspItems, error: ahspError },
    { data: ahspDetails, error: ahspDetailError },
    { data: upahRows, error: upahError },
    { data: bahanRows, error: bahanError },
    { data: alatRows, error: alatError },
    { data: satuanRows, error: satuanError },
    { data: kategoriRows, error: kategoriError },
    perusahaanResult,
    proyekResult,
    dinasResult,
  ] = await Promise.all([
    getAhspItemList(),
    getAhspDetailList(),
    getMasterHargaList('upah'),
    getMasterHargaList('bahan'),
    getMasterHargaList('alat'),
    getSatuanList(),
    getKategoriPekerjaanMasterList(),
    canViewInternal ? getPerusahaanDetailList() : Promise.resolve({ data: [], error: null }),
    canViewInternal ? getDaftarProyek() : Promise.resolve({ data: [], error: null }),
    canViewInternal ? getDinasList() : Promise.resolve({ data: [], error: null }),
  ])

  const error =
    ahspError ??
    ahspDetailError ??
    upahError ??
    bahanError ??
    alatError ??
    satuanError ??
    kategoriError ??
    perusahaanResult.error ??
    proyekResult.error ??
    dinasResult.error

  if (error) return <PageError error={error} />

  return (
    <ReferenceDatabaseClient
      ahspItems={ahspItems}
      ahspDetails={ahspDetails}
      hargaRows={{
        upah: upahRows,
        bahan: bahanRows,
        alat: alatRows,
      }}
      canViewInternal={canViewInternal}
      satuanList={satuanRows}
      kategoriList={kategoriRows}
      perusahaanList={perusahaanResult.data ?? []}
      proyekList={proyekResult.data ?? []}
      dinasList={dinasResult.data ?? []}
    />
  )
}
