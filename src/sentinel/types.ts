export interface AuditResult {
  passed: boolean;
  reasons: string[];
  [key: string]: any;
}

export interface ReconResult {
  status: 'ok' | 'pending_balance' | 'error';
  deficit?: number;
  currency?: string;
  [key: string]: any;
}
