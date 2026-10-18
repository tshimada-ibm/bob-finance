import type { Company } from '../types/market';

export const MAX_SYMBOLS = 5;

/**
 * IBM plus up to four competitors. This is the single place to edit to change what the dashboard tracks:
 * add an entry here and both the live (Yahoo) and mock data sources, the cards, charts and ranking pick it up.
 */
export const DEFAULT_COMPANIES: Company[] = [
  { symbol: 'IBM', name: 'IBM', color: '#0f62fe', primary: true, mockBasePrice: 235 },
  { symbol: 'MSFT', name: 'Microsoft', color: '#da1e28', mockBasePrice: 420 },
  { symbol: 'ORCL', name: 'Oracle', color: '#198038', mockBasePrice: 170 },
  { symbol: 'SAP', name: 'SAP', color: '#b28600', mockBasePrice: 260 },
  { symbol: 'CRM', name: 'Salesforce', color: '#8a3ffc', mockBasePrice: 300 },
].slice(0, MAX_SYMBOLS);
