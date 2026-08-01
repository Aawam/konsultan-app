#!/usr/bin/env node

import { buildRequestHeaders, getMeasuredPaths } from './measure-latency-options.mjs'

const target = process.argv[2]
const runs = Number(process.argv[3] ?? 5)
const bypassCache = process.argv.includes('--bypass-cache')
const cookie = process.env.LATENCY_COOKIE?.trim()

if (!target) {
  console.error('Usage: npm run latency -- https://your-domain.com [runs] [--bypass-cache]')
  process.exit(1)
}

const paths = getMeasuredPaths(cookie)

if (!cookie) {
  console.warn('LATENCY_COOKIE tidak diisi; /proyek dan /database dilewati agar redirect login tidak dianggap sebagai latency halaman.')
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
}

function formatMs(value) {
  return `${Math.round(value)}ms`
}

async function measure(url) {
  const started = performance.now()
  const response = await fetch(url, {
    redirect: 'manual',
    headers: buildRequestHeaders({ bypassCache, cookie }),
  })
  const duration = performance.now() - started

  return {
    status: response.status,
    cache: response.headers.get('x-vercel-cache') ?? '-',
    region: response.headers.get('x-vercel-id')?.split('::')[0] ?? '-',
    location: response.headers.get('location') ?? '-',
    duration,
  }
}

for (const path of paths) {
  const url = new URL(path, target).toString()
  const results = []

  for (let i = 0; i < runs; i += 1) {
    results.push(await measure(url))
  }

  const durations = results.map((result) => result.duration)
  const last = results.at(-1)
  const cacheStates = [...new Set(results.map((result) => result.cache))].join('→')

  console.log([
    path.padEnd(10),
    `status=${last.status}`,
    `cache=${cacheStates}`,
    `region=${last.region}`,
    ...(last.location === '-' ? [] : [`location=${last.location}`]),
    `mode=${bypassCache ? 'bypass' : 'warm'}`,
    `avg=${formatMs(durations.reduce((sum, value) => sum + value, 0) / durations.length)}`,
    `p50=${formatMs(percentile(durations, 50))}`,
    `p95=${formatMs(percentile(durations, 95))}`,
  ].join('  '))
}
