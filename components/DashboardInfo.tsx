import React from 'react';
import { ARRecord, AuditSummary } from '../types';
import { formatCurrency } from '../utils/auditUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, AlertTriangle, Wallet, Users } from 'lucide-react';

interface Props {
  data: ARRecord[];
  summary: AuditSummary;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];

const DashboardInfo: React.FC<Props> = ({ data, summary }) => {
  const agingData = [
    { name: 'Current', value: summary.agingBuckets.current },
    { name: '31-60 Days', value: summary.agingBuckets.days30 },
    { name: '61-90 Days', value: summary.agingBuckets.days60 },
    { name: '91-120 Days', value: summary.agingBuckets.days90 },
    { name: '> 120 Days', value: summary.agingBuckets.over90 },
  ].filter(d => d.value > 0);

  // Top 5 Debtors
  const debtorMap = new Map<string, number>();
  data.forEach(d => {
    const current = debtorMap.get(d.Nama_Pelanggan) || 0;
    debtorMap.set(d.Nama_Pelanggan, current + (d.Jumlah_Tagihan - d.Pembayaran_Diterima));
  });
  
  const topDebtors = Array.from(debtorMap.entries())
    .map(([name, val]) => ({ name, value: val }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {sub && <p className={`text-xs mt-2 font-medium ${color}`}>{sub}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Audit Overview</h2>
        <p className="text-slate-500">Executive summary of Accounts Receivable as of 31 Dec 2023.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total AR Exposure" 
          value={formatCurrency(summary.netExposure)} 
          sub="Gross Receivables"
          icon={Wallet}
          color="text-blue-600"
        />
        <StatCard 
          title="Potential Bad Debt" 
          value={formatCurrency(summary.agingBuckets.over90 + summary.agingBuckets.days90)} 
          sub="> 90 Days Overdue"
          icon={AlertTriangle}
          color="text-red-600"
        />
        <StatCard 
          title="High Risk Customers" 
          value={summary.countHighRisk} 
          sub="Require Immediate Confirmation"
          icon={Users}
          color="text-orange-600"
        />
        <StatCard 
          title="Est. CKPN Provision" 
          value={formatCurrency(summary.badDebtProvision)} 
          sub="50% on High Risk"
          icon={TrendingUp}
          color="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Aging Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Aging Schedule Profile</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={agingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Debtors Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 5 Concentration Risk</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDebtors} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardInfo;