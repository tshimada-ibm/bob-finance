import type { TimeWindow } from '../types/market';

export interface TimeWindowConfig {
  id: TimeWindow;
  label: string;
  description: string;
}

export const TIME_WINDOWS: TimeWindowConfig[] = [
  { id: 'day', label: 'Current day', description: 'Most recent trading session' },
  { id: 'week', label: 'Last 7 days', description: 'Trend over the past 7 days' },
  { id: 'quarter', label: 'Last quarter', description: 'Rolling 3-month trend' },
];
