import { NextRequest, NextResponse } from 'next/server'

const PRIVATE_NO_STORE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

function privateJson<T>(body: T, status: number) {
  return NextResponse.json(body, {
    status,
    headers: PRIVATE_NO_STORE_HEADERS,
  })
}

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'NOT_IMPLEMENTED'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'

export type ApiErrorBody = {
  error: string
  errorCode: ApiErrorCode
  details?: unknown
}

export type ApiSuccessBody<T> = {
  data: T
}

export function apiError(
  errorCode: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  if (errorCode === 'INTERNAL_ERROR') {
    return privateJson({
      error: 'Terjadi kesalahan pada server. Silakan coba lagi.',
      errorCode,
    }, status)
  }

  const body: ApiErrorBody = details === undefined
    ? { error: message, errorCode }
    : { error: message, errorCode, details }

  return privateJson(body, status)
}

export function apiUnauthorized(message = 'Unauthorized') {
  return apiError('UNAUTHORIZED', message, 401)
}

export function apiData<T>(data: T, status = 200) {
  return privateJson<ApiSuccessBody<T>>({ data }, status)
}

export function apiOk(status = 200) {
  return privateJson({ ok: true }, status)
}

export async function readJsonBody<T>(req: NextRequest) {
  try {
    return { data: await req.json() as T, error: null }
  } catch {
    return {
      data: null,
      error: apiError('BAD_REQUEST', 'Body request harus berupa JSON valid.', 400),
    }
  }
}
