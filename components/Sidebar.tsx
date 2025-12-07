import React from 'react';
import { AppView } from '../types';
import { LayoutDashboard, FileText, Activity, Search, FileDown, LogOut } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  reset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, reset }) => {
  
  const menuItems = [
    { id: 'DASHBOARD_INFO', label: 'Informasi', icon: LayoutDashboard },
    { id: 'DASHBOARD_ANALYSIS', label: 'Analisis (AI Voice)', icon: Activity },
    { id: 'DASHBOARD_FINDINGS', label: 'Findings', icon: Search },
    { id: 'DASHBOARD_REPORT', label: 'Report', icon: FileDown },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen fixed left-0 top-0 shadow-xl z-10">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white">
                AG
            </div>
            <h1 className="text-xl font-bold tracking-tight">AuditGuard AR</h1>
        </div>
        <p className="text-xs text-slate-400 mt-2">AI Substantive Audit System</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as AppView)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={reset}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
        >
          <LogOut size={16} />
          <span>Exit Audit Session</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;