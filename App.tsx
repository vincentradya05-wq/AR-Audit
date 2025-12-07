import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DataUpload from './components/DataUpload';
import DashboardInfo from './components/DashboardInfo';
import AnalysisChat from './components/AnalysisChat';
import FindingsTable from './components/FindingsTable';
import AuditReport from './components/AuditReport';
import { ARRecord, AuditSummary, AppView } from './types';
import { Key } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [data, setData] = useState<ARRecord[]>([]);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(process.env.API_KEY || null); // Check env first, else ask user (simulated)
  
  // Simulation for API Key selection if not in env
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    // Check if key exists or needs selection
    // In a real scenario with Gemini user-paid keys, we might use window.aistudio.openSelectKey
    // Here we assume if process.env.API_KEY is missing, we might prompt. 
    // However, the prompt says "Use process.env.API_KEY directly". 
    // We will assume it's there. If strictly needed for user selection flow as per VEO instructions (but we aren't using VEO),
    // we would implement that. For now, we proceed assuming key is available or we let user proceed to upload.
  }, []);

  const handleDataLoaded = (parsedData: ARRecord[], summaryData: AuditSummary) => {
    setData(parsedData);
    setSummary(summaryData);
    setView('DASHBOARD_INFO');
  };

  const resetSession = () => {
    setData([]);
    setSummary(null);
    setView('LANDING');
  };

  if (!summary && view !== 'LANDING') {
      // Fallback if refreshed
      setView('LANDING');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {view !== 'LANDING' && (
        <Sidebar 
          currentView={view} 
          setView={setView} 
          reset={resetSession} 
        />
      )}

      <main className={`flex-1 transition-all duration-300 ${view !== 'LANDING' ? 'ml-64' : ''}`}>
        {view === 'LANDING' && (
          <DataUpload onDataLoaded={handleDataLoaded} />
        )}
        
        {view === 'DASHBOARD_INFO' && summary && (
          <DashboardInfo data={data} summary={summary} />
        )}

        {view === 'DASHBOARD_ANALYSIS' && summary && (
            <div className="h-screen pt-4 pb-4">
               {/* 
                 Passing apiKey strictly for the Live API component. 
                 Ideally, this comes from env, but components might need to instantiate fresh clients.
               */}
               <AnalysisChat 
                  apiKey={apiKey || process.env.API_KEY || ''} 
                  data={data} 
                  summary={summary} 
               />
            </div>
        )}

        {view === 'DASHBOARD_FINDINGS' && (
            <FindingsTable data={data} />
        )}

        {view === 'DASHBOARD_REPORT' && summary && (
            <AuditReport summary={summary} />
        )}
      </main>
    </div>
  );
};

export default App;