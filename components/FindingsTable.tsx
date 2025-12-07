import React, { useState } from 'react';
import { ARRecord } from '../types';
import { formatCurrency } from '../utils/auditUtils';
import { Search, Filter, CheckCircle, XCircle, AlertOctagon } from 'lucide-react';

interface Props {
  data: ARRecord[];
}

const FindingsTable: React.FC<Props> = ({ data }) => {
  const [filter, setFilter] = useState<'All' | 'High' | 'Medium'>('All');
  const [search, setSearch] = useState('');

  const filteredData = data.filter(item => {
    const matchesFilter = filter === 'All' || item.RiskLevel === filter;
    const matchesSearch = item.Nama_Pelanggan.toLowerCase().includes(search.toLowerCase()) || 
                          item.No_Invoice.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Audit Findings & Vouching</h2>
            <p className="text-slate-500">Detailed ledger with risk stratification.</p>
        </div>
        
        <div className="flex gap-3">
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search invoice or customer..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
             </div>
             <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
                <option value="All">All Risks</option>
                <option value="High">High Risk Only</option>
                <option value="Medium">Medium Risk Only</option>
             </select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Inv. Date</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Amount</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Days Overdue</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{row.Nama_Pelanggan}</div>
                    <div className="text-xs text-slate-400">{row.No_Invoice}</div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{row.Tanggal_Invoice}</td>
                  <td className="p-4 text-sm font-medium text-slate-800 text-right">{formatCurrency(row.Jumlah_Tagihan)}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.Status_Konfirmasi === 'Confirmed' ? 'bg-green-100 text-green-800' :
                        row.Status_Konfirmasi === 'No Reply' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {row.Status_Konfirmasi}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{row.DaysOverdue} days</td>
                  <td className="p-4">
                    {row.RiskLevel === 'High' && (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-xs">
                            <AlertOctagon className="w-4 h-4" /> HIGH
                        </span>
                    )}
                    {row.RiskLevel === 'Medium' && (
                        <span className="text-orange-500 font-medium text-xs">MEDIUM</span>
                    )}
                    {row.RiskLevel === 'Low' && (
                        <span className="text-slate-400 text-xs">LOW</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Trace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between">
            <span>Showing {filteredData.length} records</span>
            <span>Generated by AuditGuard AR</span>
        </div>
      </div>
    </div>
  );
};

export default FindingsTable;