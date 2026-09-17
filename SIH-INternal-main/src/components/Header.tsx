import { useState } from 'react';
import {
  Shield,
  Bell,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Search,
  Plus,
  Building2,
  Cpu,
  FileCheck2,
  Activity,
  Layers,
  FileText,
  UserCheck,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { User, Notification, UserRole } from '../types';
import { api } from '../api';

interface HeaderProps {
  user: User | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onSwitchUser: (role: UserRole) => void;
  onCreateChallengeClick: () => void;
  onGlobalSearch: (query: string) => void;
  searchQuery: string;
  onGoToLanding: () => void;
}

export function Header({
  user,
  activeTab,
  onTabChange,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onSwitchUser,
  onCreateChallengeClick,
  onGlobalSearch,
  searchQuery,
  onGoToLanding,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const roleLabels: Record<UserRole, { label: string; badge: string }> = {
    SUPER_ADMIN: { label: 'Super Admin', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    GOVERNMENT_OFFICER: { label: 'Govt. Innovation Officer', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    EVALUATOR: { label: 'Technical Evaluator', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    STARTUP: { label: 'Startup Founder', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
    PROCUREMENT_OFFICER: { label: 'Procurement Controller', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  };

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: Activity },
    { id: 'problems', label: 'Govt. Challenges', icon: Building2 },
    { id: 'ai-matching', label: 'AI Match Studio', icon: Sparkles, highlight: true },
    { id: 'startups', label: 'Startup Directory', icon: Cpu },
    { id: 'applications', label: 'Screening & Review', icon: FileCheck2 },
    { id: 'pilots', label: 'Pilots & KPIs', icon: Layers },
    { id: 'procurement', label: 'Procurement Pipeline', icon: FileText },
    ...(user?.role === 'SUPER_ADMIN' ? [{ id: 'audit', label: 'Audit Trail', icon: Shield }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Republic of India Innovation Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-white tracking-wide">GOVERNMENT OF INDIA</span>
          <span className="text-slate-500">|</span>
          <span>National Innovation Procurement Infrastructure</span>
          <span className="hidden md:inline text-slate-400">· GFR 2017 Innovation Protocol</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 hidden sm:inline">Active Production Database: PostgreSQL</span>
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded text-[11px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            CONNECTED
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <button className="flex items-center gap-3 cursor-pointer text-left" onClick={onGoToLanding} aria-label="Open InnovProcure landing page">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 flex items-center justify-center text-white shadow-md shadow-indigo-200 border border-indigo-600">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">InnovProcure</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded tracking-wider">ENTERPRISE</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">Public Challenges · AI Match · Scale Procurement</p>
            </div>
          </button>

          {/* Global Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onGlobalSearch(e.target.value)}
                placeholder="Search challenges, startups, sectors, technologies..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Create Challenge Button (for Gov Officers & Super Admins) */}
            <button
              onClick={onCreateChallengeClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Post Challenge</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider">
                      Notifications ({unreadCount} unread)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllNotificationsRead}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">No notifications yet.</div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => onMarkNotificationRead(notif.id)}
                          className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                            !notif.is_read ? 'bg-indigo-50/40 font-medium' : 'text-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-slate-900">{notif.title}</span>
                            {!notif.is_read && <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-slate-900 leading-none truncate max-w-[130px]">
                    {user?.name || 'Authorized User'}
                  </div>
                  <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded font-semibold border ${roleLabels[user?.role || 'SUPER_ADMIN'].badge}`}>
                    {roleLabels[user?.role || 'SUPER_ADMIN'].label}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Persona Switcher Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Current Account
                    </span>
                    <span className="font-semibold text-xs text-slate-800 block">{user?.name}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{user?.email}</span>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Demo Persona (1-Click)
                  </div>

                  <div className="space-y-1 mt-1">
                    <button
                      onClick={() => {
                        onSwitchUser('SUPER_ADMIN');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-800">Dr. Rajeshwar Sharma, IAS</div>
                        <div className="text-[10px] text-slate-400">Super Admin (Mission Director)</div>
                      </div>
                      {user?.role === 'SUPER_ADMIN' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUser('GOVERNMENT_OFFICER');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-800">Priyanka Verma</div>
                        <div className="text-[10px] text-slate-400">Govt. Innovation Officer (MOHUA)</div>
                      </div>
                      {user?.role === 'GOVERNMENT_OFFICER' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUser('EVALUATOR');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-800">Prof. Anirudh Sen</div>
                        <div className="text-[10px] text-slate-400">Technical Evaluation Chair</div>
                      </div>
                      {user?.role === 'EVALUATOR' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUser('STARTUP');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-800">Vikram Malhotra</div>
                        <div className="text-[10px] text-slate-400">Startup Founder (AetherAI Vision)</div>
                      </div>
                      {user?.role === 'STARTUP' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        onSwitchUser('PROCUREMENT_OFFICER');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-800">Sunita Krishnan</div>
                        <div className="text-[10px] text-slate-400">Chief Procurement Controller</div>
                      </div>
                      {user?.role === 'PROCUREMENT_OFFICER' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </button>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      id="reset-demo-dataset-btn"
                      onClick={async () => {
                        if (confirm('Reset database to clean, curated demo dataset?')) {
                          try {
                            await api.resetDemoData();
                            window.location.reload();
                          } catch (err: any) {
                            alert('Failed to reset: ' + err.message);
                          }
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Reset to Clean Demo Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/70 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="ml-1 px-1.5 py-0.2 text-[9px] bg-gradient-to-r from-amber-500 to-indigo-500 text-white font-bold rounded-full">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
