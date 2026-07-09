import { NextRequest, NextResponse } from 'next/server'

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
  const body: ApiErrorBody = details === undefined
    ? { error: message, errorCode }
    : { error: message, errorCode, details }

  return NextResponse.json(body, { status })
}

export function apiData<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccessBody<T>>({ data }, { status })
}

export function apiOk(status = 200) {
  return NextResponse.json({ ok: true }, { status })
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
