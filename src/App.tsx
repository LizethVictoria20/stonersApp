import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TaskList } from './components/TaskController/TaskList';
import { TaskModal } from './components/TaskController/TaskModal';
import { AddTaskModal } from './components/TaskController/AddTaskModal';
import { ExcelImportModal } from './components/TaskController/ExcelImportModal';
import { SOPCatalog } from './components/SOPManual/SOPCatalog';
import { SOPDetailModal } from './components/SOPManual/SOPDetailModal';
import { AddSOPModal } from './components/SOPManual/AddSOPModal';
import { KPIDashboard } from './components/KPIsAndGoals/KPIDashboard';
import { GoalsManager } from './components/KPIsAndGoals/GoalsManager';
import { TeamList } from './components/TeamManager/TeamList';
import { ExportEngineView } from './components/ExportEngine/ExportEngineView';
import { SupabaseGuide } from './components/SupabaseGuide';
import { SalesManager } from './components/SalesTracker/SalesManager';
import { StoreList } from './components/StoreManager/StoreList';
import { ProductManager } from './components/ProductManager/ProductManager';
import { LoginPage } from './components/LoginPage';
import { GmailInboxModal } from './components/GmailInboxModal';
import { AIOpsAssistantModal } from './components/AIOpsAssistantModal';
import { Task, SOPProcedure } from './types';

function MainAppContent() {
  const { activeTab, currentUser, isAuthenticated } = useApp();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const getCurrentRoute = () => {
    const browserPath = window.location.pathname;
    if (basePath && browserPath === basePath) return '/';
    if (basePath && browserPath.startsWith(`${basePath}/`)) {
      return browserPath.slice(basePath.length) || '/';
    }
    return browserPath;
  };
  const [pathname, setPathname] = useState(getCurrentRoute);

  useEffect(() => {
    const handlePopState = () => setPathname(getCurrentRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [basePath]);

  const navigate = (path: string) => {
    const targetPath = `${basePath}${path}` || '/';
    window.history.pushState({}, '', targetPath);
    setPathname(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = currentUser.role === 'admin';
  const isAdminOnlyTab = activeTab === 'team' || activeTab === 'exports' || activeTab === 'supabase_cloud' || activeTab === 'stores';
  const currentTab = (isAdminOnlyTab && !isAdmin) ? 'sales' : activeTab;

  // Modals state
  const [isGmailOpen, setIsGmailOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  
  const [selectedSOP, setSelectedSOP] = useState<SOPProcedure | null>(null);
  const [isAddSOPOpen, setIsAddSOPOpen] = useState(false);

  const handleOpenAI = (initialPrompt?: string) => {
    setAiInitialPrompt(initialPrompt);
    setIsAIOpen(true);
  };

  if (pathname === '/login' || pathname === '/login/' || !isAuthenticated) {
    return <LoginPage onLoginSuccess={() => navigate('/')} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-neutral-950 dark:text-neutral-100 font-sans selection:bg-emerald-500 selection:text-black antialiased transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar 
        onOpenLoginModal={() => navigate('/login')}
        onOpenAIModal={handleOpenAI}
        onOpenGmailModal={() => setIsGmailOpen(true)}
      />

      {/* Main Body */}
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        
        {/* Sidebar Navigation */}
        <Sidebar onOpenAIModal={handleOpenAI} />

        {/* Dynamic Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {currentTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in">
              <KPIDashboard />
              <GoalsManager />
            </div>
          )}

          {currentTab === 'sales' && (
            <div className="animate-in fade-in">
              <SalesManager onOpenAIModal={(prompt) => handleOpenAI(prompt)} />
            </div>
          )}

          {currentTab === 'stores' && (
            <div className="animate-in fade-in">
              <StoreList />
            </div>
          )}

          {currentTab === 'products' && (
            <div className="animate-in fade-in">
              <ProductManager />
            </div>
          )}

          {currentTab === 'tasks' && (
            <div className="animate-in fade-in">
              <TaskList
                onOpenAddTaskModal={() => setIsAddTaskOpen(true)}
                onOpenTaskDetailModal={(task) => setSelectedTask(task)}
                onOpenExcelImportModal={() => setIsExcelImportOpen(true)}
                onOpenAIModal={(prompt) => handleOpenAI(prompt)}
              />
            </div>
          )}

          {currentTab === 'sops' && (
            <div className="animate-in fade-in">
              <SOPCatalog
                onOpenSOPDetail={(sop) => setSelectedSOP(sop)}
                onOpenAddSOP={() => setIsAddSOPOpen(true)}
              />
            </div>
          )}

          {currentTab === 'kpis' && (
            <div className="space-y-8 animate-in fade-in">
              <KPIDashboard />
              <GoalsManager />
            </div>
          )}

          {currentTab === 'team' && (
            <div className="animate-in fade-in">
              <TeamList />
            </div>
          )}

          {currentTab === 'exports' && (
            <div className="animate-in fade-in">
              <ExportEngineView />
            </div>
          )}

          {currentTab === 'supabase_cloud' && (
            <div className="animate-in fade-in">
              <SupabaseGuide />
            </div>
          )}
        </main>

      </div>

      {/* Global Modals */}
      <GmailInboxModal
        isOpen={isGmailOpen}
        onClose={() => setIsGmailOpen(false)}
        onOpenLoginModal={() => navigate('/login')}
      />

      <AIOpsAssistantModal
        isOpen={isAIOpen}
        onClose={() => {
          setIsAIOpen(false);
          setAiInitialPrompt(undefined);
        }}
        initialPrompt={aiInitialPrompt}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
      />

      <TaskModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
      />

      <SOPDetailModal
        sop={selectedSOP}
        onClose={() => setSelectedSOP(null)}
      />

      <AddSOPModal
        isOpen={isAddSOPOpen}
        onClose={() => setIsAddSOPOpen(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
