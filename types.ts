export interface ARRecord {
  Customer_ID: string;
  Nama_Pelanggan: string;
  No_Invoice: string;
  Tanggal_Invoice: string;
  Tanggal_Jatuh_Tempo: string;
  Jumlah_Tagihan: number;
  Pembayaran_Diterima: number;
  Tanggal_Bayar: string;
  Status_Konfirmasi: string;
  DaysOverdue: number;
  RiskLevel: 'Low' | 'Medium' | 'High';
}

export interface AuditSummary {
  totalAR: number;
  totalCollections: number;
  netExposure: number;
  countHighRisk: number;
  badDebtProvision: number; // Estimated CKPN
  agingBuckets: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
  };
}

export type AppView = 'LANDING' | 'DASHBOARD_INFO' | 'DASHBOARD_ANALYSIS' | 'DASHBOARD_FINDINGS' | 'DASHBOARD_REPORT';

export interface AuditContextType {
  data: ARRecord[];
  summary: AuditSummary | null;
  setData: (data: ARRecord[]) => void;
  view: AppView;
  setView: (view: AppView) => void;
  apiKey: string | null;
  setApiKey: (key: string) => void;
}
