import React, { useCallback, useState } from 'react';
import { Upload, FileType, AlertCircle } from 'lucide-react';
import { parseCSV, calculateSummary } from '../utils/auditUtils';
import { ARRecord, AuditSummary } from '../types';

interface DataUploadProps {
  onDataLoaded: (data: ARRecord[], summary: AuditSummary) => void;
}

const DataUpload: React.FC<DataUploadProps> = ({ onDataLoaded }) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        const summary = calculateSummary(data);
        onDataLoaded(data, summary);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV");
      }
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-50">
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Initiate Audit Session</h2>
            <p className="text-slate-500">Upload your Accounts Receivable Ledger (CSV) to begin substantive procedures.</p>
        </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`w-full max-w-2xl p-12 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center bg-white shadow-sm ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
        }`}
      >
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Upload className="w-8 h-8 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-700 mb-2">
          Drag & Drop CSV File Here
        </h3>
        <p className="text-sm text-slate-400 mb-6">or click to browse from your device</p>
        
        <input
          type="file"
          accept=".csv"
          onChange={onInputChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg cursor-pointer transition-colors shadow-lg shadow-blue-600/20"
        >
          Select File
        </label>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3 border border-red-200 max-w-2xl w-full">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="mt-12 w-full max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h4 className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
            <FileType className="w-4 h-4" /> Required CSV Format
        </h4>
        <code className="block bg-slate-100 p-4 rounded text-xs text-slate-600 font-mono overflow-x-auto">
          Customer_ID, Nama_Pelanggan, No_Invoice, Tanggal_Invoice, Tanggal_Jatuh_Tempo, Jumlah_Tagihan, Pembayaran_Diterima, Tanggal_Bayar, Status_Konfirmasi
        </code>
      </div>
    </div>
  );
};

export default DataUpload;