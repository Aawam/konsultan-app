# RAB Maker Snapshot Workflow

Status: design baseline before AHSP/RAB mutation UI.

## Verdict

RAB Maker must not read live prices from Masterfile AHSP after an item is copied into a project RAB.

The correct model is:

```text
Masterfile AHSP
  -> select uraian pekerjaan
  -> inspect detail item
  -> copy/export into project RAB Maker
  -> edit snapshot fields only
  -> final RAB
```

## Roles

Owner/Admin manages Masterfile AHSP:

- uraian pekerjaan
- kategori
- satuan output
- detail upah/bahan/alat
- koefisien
- harga dasar default
- profit default

Tenaga Ahli works inside RAB Maker for assigned Perencanaan projects:

- choose AHSP items to copy
- fill volume
- override harga dasar snapshot when field price changes
- override profit per uraian when justified
- add override notes

## Locked Versus Editable Fields

Locked after copy to RAB Maker:

- source AHSP reference
- kode analisa snapshot
- uraian pekerjaan snapshot
- satuan output snapshot
- component structure
- koefisien snapshot

Editable in RAB Maker:

- volume
- harga dasar component snapshot/final
- profit persen per uraian
- urutan item
- override reason/notes

## Snapshot Rule

When AHSP is exported to RAB Maker, copy these values:

- AHSP item identity
- item text: kode, uraian, kategori, satuan
- every detail component
- component type: upah/bahan/alat
- component name
- component unit
- koefisien
- harga dasar default
- profit default

After copy, Masterfile changes must not mutate the RAB Maker row.

## Calculation

Per RAB item:

```text
harga_dasar_total =
  sum(koefisien_snapshot * harga_dasar_final_per_detail)

profit_nilai =
  harga_dasar_total * profit_persen / 100

harga_satuan =
  harga_dasar_total + profit_nilai

jumlah_harga =
  volume * harga_satuan
```

Project-level totals:

```text
subtotal = sum(jumlah_harga)
ppn = subtotal * ppn_persen / 100
total_final = subtotal + ppn
```

If overhead or project-level margin is needed later, it must be explicit and separate from per-item `profit_persen`.

## Audit Rule

Audit these actions:

- copy AHSP item to RAB Maker
- remove RAB item
- change volume
- override component harga dasar
- override item profit
- validate RAB
- finalize RAB

## Counter-Argument

Keeping profit in Masterfile gives good defaults per work item, but it can create inconsistent margins if Tenaga Ahli overrides too freely. The control is not to remove profit override, but to require reason, show "changed from default", and keep audit logs.
