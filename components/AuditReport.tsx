import React from 'react';
import { AuditSummary } from '../types';
import { formatCurrency } from '../utils/auditUtils';
import { Download } from 'lucide-react';

interface Props {
  summary: AuditSummary;
}

const AuditReport: React.FC<Props> = ({ summary }) => {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="p-8 h-full flex flex-col items-center overflow-y-auto custom-scrollbar">
      <div className="w-full max-w-4xl bg-white shadow-lg border border-slate-200 p-12 min-h-[800px]">
        
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-serif font-bold text-slate-900">INTERNAL AUDIT MEMORANDUM</h1>
                <p className="text-slate-500 mt-2">Ref: AR-2023-FINAL</p>
            </div>
            <div className="text-right">
                <p className="font-bold">Date: {today}</p>
                <p>To: Chief Financial Officer</p>
                <p>From: AuditGuard AI System</p>
            </div>
        </div>

        {/* Content */}
        <div className="space-y-8 text-slate-800 font-serif leading-relaxed">
            
            <section>
                <h3 className="text-lg font-bold uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">1. Executive Summary</h3>
                <p>
                    We have performed substantive audit procedures on the Accounts Receivable ledger as of December 31, 2023. 
                    The total gross receivable exposure is <strong>{formatCurrency(summary.totalAR)}</strong>. 
                    Our analysis indicates a net risk exposure of <strong>{formatCurrency(summary.netExposure)}</strong> after collections.
                </p>
            </section>

            <section>
                <h3 className="text-lg font-bold uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">2. Valuation Assertion & Impairment</h3>
                <p>
                    A significant portion of the receivables ({((summary.agingBuckets.over90 / summary.netExposure) * 100).toFixed(1)}%) is overdue by more than 90 days. 
                    Based on the aging profile and risk assessment, we recommend a provision for bad debts (CKPN) of approximately:
                </p>
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 text-center font-bold text-xl">
                    {formatCurrency(summary.badDebtProvision)}
                </div>
            </section>

            <section>
                <h3 className="text-lg font-bold uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">3. Key Audit Matters (KAM)</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong>High Risk Concentration:</strong> There are {summary.countHighRisk} customers identified as High Risk due to significant overdue balances or anomalies in payment patterns (potential lapping).
                    </li>
                    <li>
                        <strong>Confirmation Status:</strong> Several material balances returned "No Reply" on positive confirmation requests. Alternative procedures (tracing subsequent payments) were performed.
                    </li>
                </ul>
            </section>

            <section>
                <h3 className="text-lg font-bold uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">4. Recommendations</h3>
                <p>
                    1. Immediately initiate legal collection proceedings for accounts overdue > 120 days.<br/>
                    2. Segregate duties between cash receipt handling and AR ledger recording to mitigate lapping risks.<br/>
                    3. Review credit limits for customers appearing in the High Risk category.
                </p>
            </section>

             <div className="mt-16 pt-8 border-t border-slate-300 flex justify-between">
                <div>
                    <p className="font-bold">Prepared By:</p>
                    <p className="font-mono text-sm mt-4 text-slate-500">[ Digital Signature ]</p>
                    <p>AuditGuard AI</p>
                </div>
                <div>
                    <p className="font-bold">Reviewed By:</p>
                    <div className="h-12 border-b border-slate-400 w-48 mb-2"></div>
                    <p>Audit Partner</p>
                </div>
            </div>

        </div>
      </div>
      
      <div className="mt-8 mb-12">
        <button 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
            onClick={() => window.print()}
        >
            <Download size={18} />
            Export to PDF
        </button>
      </div>
    </div>
  );
};

export default AuditReport;