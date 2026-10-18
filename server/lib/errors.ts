import type { TimeWindow } from '../../src/types/market';

export type ApiErrorCode = 'INVALID_SYMBOL' | 'BAD_REQUEST' | 'UPSTREAM_ERROR';

const STATUS: Record<ApiErrorCode, number> = {
  INVALID_SYMBOL: 400,
  BAD_REQUEST: 400,
  UPSTREAM_ERROR: 502,
};

/** Error with a stable machine-readable code; the HTTP layer renders it as { code, message }. */
export class ApiError extends Error {
  readonly status: number;
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = STATUS[code];
  }
}

export const TIME_WINDOW_IDS: readonly TimeWindow[] = ['day', 'week', 'quarter'];
