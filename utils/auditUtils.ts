import { ARRecord, AuditSummary } from '../types';

export const parseCSV = (csvText: string): ARRecord[] => {
  const lines = csvText.split('\n').filter(line => line.trim() !== '');
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Basic validation of headers
  const required = ['Customer_ID', 'Nama_Pelanggan', 'Jumlah_Tagihan', 'Tanggal_Invoice'];
  const hasRequired = required.every(r => headers.some(h => h.includes(r)));
  
  if (!hasRequired) throw new Error("Invalid CSV Format. Missing required audit columns.");

  const today = new Date('2023-12-31').getTime(); // Audit cut-off date simulation

  return lines.slice(1).map(line => {
    const values = line.split(',');
    // Mapping logic assuming standard column order if headers are messy, 
    // or strictly by index based on user prompt specification.
    // Spec: Customer_ID, Nama_Pelanggan, No_Invoice, Tanggal_Invoice, Tanggal_Jatuh_Tempo, Jumlah_Tagihan, Pembayaran_Diterima, Tanggal_Bayar, Status_Konfirmasi
    
    const invoiceDate = new Date(values[3]);
    const billAmount = parseFloat(values[5]) || 0;
    const paymentAmount = parseFloat(values[6]) || 0;
    
    // Calculate Days Overdue
    const diffTime = Math.abs(today - invoiceDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    let risk: 'Low' | 'Medium' | 'High' = 'Low';
    if (diffDays > 90) risk = 'High';
    else if (diffDays > 60) risk = 'Medium';

    // Check for Lapping Indication (Round payments delayed)
    if (paymentAmount > 0 && paymentAmount % 1000000 === 0 && diffDays > 45) {
        risk = 'High';
    }

    // Check Confirmation
    const status = values[8]?.trim();
    if (status === 'No Reply' && billAmount > 10000000) risk = 'High';

    return {
      Customer_ID: values[0],
      Nama_Pelanggan: values[1],
      No_Invoice: values[2],
      Tanggal_Invoice: values[3],
      Tanggal_Jatuh_Tempo: values[4],
      Jumlah_Tagihan: billAmount,
      Pembayaran_Diterima: paymentAmount,
      Tanggal_Bayar: values[7],
      Status_Konfirmasi: status,
      DaysOverdue: diffDays,
      RiskLevel: risk
    };
  });
};

export const calculateSummary = (data: ARRecord[]): AuditSummary => {
  const summary: AuditSummary = {
    totalAR: 0,
    totalCollections: 0,
    netExposure: 0,
    countHighRisk: 0,
    badDebtProvision: 0,
    agingBuckets: { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 }
  };

  data.forEach(row => {
    summary.totalAR += row.Jumlah_Tagihan;
    summary.totalCollections += row.Pembayaran_Diterima;
    
    const net = row.Jumlah_Tagihan - row.Pembayaran_Diterima;
    if (net > 0) {
        summary.netExposure += net;
        
        if (row.DaysOverdue <= 30) summary.agingBuckets.current += net;
        else if (row.DaysOverdue <= 60) summary.agingBuckets.days30 += net;
        else if (row.DaysOverdue <= 90) summary.agingBuckets.days60 += net;
        else if (row.DaysOverdue <= 120) summary.agingBuckets.days90 += net;
        else summary.agingBuckets.over90 += net;

        if (row.RiskLevel === 'High') {
            summary.countHighRisk++;
            // Simple CKPN Logic: 50% provision for High Risk
            summary.badDebtProvision += (net * 0.5); 
        }
    }
  });

  return summary;
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
};
