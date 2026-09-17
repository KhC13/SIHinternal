import { useState, useEffect } from 'react';
import { User, Notification, UserRole } from './types';
import { api, getStoredUser, getStoredToken } from './api';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProblemsView } from './components/ProblemsView';
import { AIMatchingView } from './components/AIMatchingView';
import { StartupsView } from './components/StartupsView';
import { ApplicationsView } from './components/ApplicationsView';
import { PilotsView } from './components/PilotsView';
import { ProcurementView } from './components/ProcurementView';
import { AuditView } from './components/AuditView';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';

export default function App() {
  const [appView, setAppView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Cross-view state passing
  const [selectedProblemIdForAI, setSelectedProblemIdForAI] = useState<string | null>(null);
  const [selectedStartupId, setSelectedStartupId] = useState<string | null>(null);
  const [createChallengeTrigger, setCreateChallengeTrigger] = useState(0);

  useEffect(() => {
    if (appView === 'dashboard' && getStoredToken() && getStoredUser()) {
      setAuthReady(true);
    }
  }, [appView]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [authReady, currentUser]);

  if (appView === 'landing') {
    return <LandingPage onOpenAuth={() => setAppView('auth')} />;
  }

  if (appView === 'auth') {
    return (
      <AuthPage
        onBackToLanding={() => setAppView('landing')}
        onAuthenticated={(user) => {
          setCurrentUser(user);
          setAuthReady(true);
          setAppView('dashboard');
        }}
      />
    );
  }

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchUser = async (role: UserRole) => {
    const roleEmailMap: Record<UserRole, string> = {
      SUPER_ADMIN: 'admin@innovprocure.gov.in',
      GOVERNMENT_OFFICER: 'officer@innovprocure.gov.in',
      EVALUATOR: 'evaluator@innovprocure.gov.in',
      STARTUP: 'startup@innovprocure.com',
      PROCUREMENT_OFFICER: 'procurement@innovprocure.gov.in',
    };

    try {
      const email = roleEmailMap[role];
      const data = await api.login(email, 'InnovProcure@123');
      setCurrentUser(data.user);
      setAuthReady(true);
      fetchNotifications();
    } catch (err: any) {
      alert('Error switching user: ' + err.message);
    }
  };

  const canAccessAuditTrail = currentUser?.role === 'SUPER_ADMIN';

  const handleNavigateToAIWithProblem = (problemId: string) => {
    setSelectedProblemIdForAI(problemId);
    setActiveTab('ai-matching');
  };

  const handleNavigateToStartup = (startupId: string) => {
    setSelectedStartupId(startupId);
    setActiveTab('startups');
  };

  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
    if (activeTab !== 'problems' && activeTab !== 'startups') {
      setActiveTab('problems');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        user={currentUser}
        activeTab={canAccessAuditTrail ? activeTab : activeTab === 'audit' ? 'dashboard' : activeTab}
        onTabChange={(tab) => {
          if (tab === 'audit' && !canAccessAuditTrail) {
            setActiveTab('dashboard');
            return;
          }
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onSwitchUser={handleSwitchUser}
        onCreateChallengeClick={() => {
          setActiveTab('problems');
          setCreateChallengeTrigger((prev) => prev + 1);
        }}
        onGlobalSearch={handleGlobalSearch}
        searchQuery={searchQuery}
        onGoToLanding={() => setAppView('landing')}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            user={currentUser}
            onNavigate={(tab) => setActiveTab(tab)}
            onCreateChallengeClick={() => {
              setActiveTab('problems');
              setCreateChallengeTrigger((prev) => prev + 1);
            }}
          />
        )}

        {activeTab === 'problems' && (
          <ProblemsView
            key={`problems-${createChallengeTrigger}`}
            user={currentUser}
            onSelectProblemForAI={handleNavigateToAIWithProblem}
          />
        )}

        {activeTab === 'ai-matching' && (
          <AIMatchingView
            selectedProblemId={selectedProblemIdForAI}
            onNavigateToStartup={handleNavigateToStartup}
            onNavigateToApplications={() => setActiveTab('applications')}
          />
        )}

        {activeTab === 'startups' && (
          <StartupsView
            initialStartupId={selectedStartupId}
          />
        )}

        {activeTab === 'applications' && (
          <ApplicationsView
            onNavigateToProblem={(probId) => {
              setActiveTab('problems');
            }}
            onNavigateToStartup={handleNavigateToStartup}
          />
        )}

        {activeTab === 'pilots' && (
          <PilotsView
            user={currentUser}
            onNavigateToProcurement={() => setActiveTab('procurement')}
          />
        )}

        {activeTab === 'procurement' && <ProcurementView />}

        {canAccessAuditTrail && activeTab === 'audit' && <AuditView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">InnovProcure</span>
            <span>·</span>
            <span>National Innovation Procurement Infrastructure</span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">PostgreSQL Connected</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Compliant with General Financial Rules (GFR 2017) Innovation Rule 194 & Public Procurement Policy
          </div>
        </div>
      </footer>
    </div>
  );
}
