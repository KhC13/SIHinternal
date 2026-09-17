import { useState, useEffect } from 'react';
import {
  Building2,
  Cpu,
  Sparkles,
  Award,
  Layers,
  IndianRupee,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Flame,
  FileText,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DashboardAnalytics, AuditLog, User } from '../types';
import { api } from '../api';

interface DashboardViewProps {
  user: User | null;
  onNavigate: (tab: string, filter?: any) => void;
  onCreateChallengeClick: () => void;
}

const SECTOR_COLORS = [
  '#4f46e5',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#14b8a6',
];

export function DashboardView({ user, onNavigate, onCreateChallengeClick }: DashboardViewProps) {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [anData, logsData] = await Promise.all([
          api.getDashboardAnalytics(),
          api.getAuditLogs().catch((err) => {
            console.warn('Audit logs fetch fallback:', err);
            return { logs: [] };
          }),
        ]);
        setAnalytics(anData);
        setRecentLogs(logsData.logs ? logsData.logs.slice(0, 6) : []);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const formatINR = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(1)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading live PostgreSQL metrics & analytics...</p>
        </div>
      </div>
    );
  }

  const kpis = analytics.kpis;
  const funnel = analytics.charts.pipelineFunnel;

  const funnelSteps = [
    { label: 'Public Problems', count: funnel.problems, sub: 'Identified Challenges', tab: 'problems' },
    { label: 'Startup Proposals', count: funnel.applications, sub: 'Submitted Solutions', tab: 'applications' },
    { label: 'AI Matched', count: funnel.ai_matches, sub: 'Semantic Compatibility', tab: 'ai-matching' },
    { label: 'Shortlisted', count: funnel.shortlisted, sub: 'Evaluation Approved', tab: 'applications' },
    { label: 'Active Pilots', count: funnel.pilots, sub: 'Field Verification', tab: 'pilots' },
    { label: 'Scale Approved', count: funnel.scale_ready, sub: 'Ready for Procurement', tab: 'pilots' },
    { label: 'Procurement Pipeline', count: funnel.procurement, sub: 'GFR 2017 Innovation', tab: 'procurement' },
    { label: 'Signed Contracts', count: funnel.contracts, sub: 'Executed & Scaled', tab: 'procurement' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-md text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Empowering Public Governance Through High-Tech Startups
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            InnovProcure orchestrates public-sector problem discovery, AI semantic startup matching,
            field milestone pilots, and scale innovation procurement under GFR 2017 guidelines.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onCreateChallengeClick}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Publish New Challenge
            </button>
            <button
              onClick={() => onNavigate('ai-matching')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Launch AI Matching Studio
            </button>
            <button
              onClick={() => onNavigate('procurement')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              View Procurement Kanban
            </button>
          </div>
        </div>
      </div>

      {/* 8 Core Enterprise KPIs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            National Innovation Procurement Indicators
          </h2>
          <span className="text-xs text-slate-500 font-medium">Real-Time Aggregations</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Problems */}
          <div
            onClick={() => onNavigate('problems')}
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Challenges</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.totalProblems}</div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
              <span className="font-semibold text-emerald-600">{kpis.activeProblems} Active</span> across ministries
            </div>
          </div>

          {/* 2. Registered Startups */}
          <div
            onClick={() => onNavigate('startups')}
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Tech Startups</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.registeredStartups}</div>
            <div className="mt-1 text-[11px] text-slate-500">DPIIT & STQC Verified Startups</div>
          </div>

          {/* 3. AI Matches */}
          <div
            onClick={() => onNavigate('ai-matching')}
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">AI Semantic Matches</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.aiMatches}</div>
            <div className="mt-1 text-[11px] text-amber-600 font-medium">Multi-dimensional scoring</div>
          </div>

          {/* 4. Shortlisted Startups */}
          <div
            onClick={() => onNavigate('applications')}
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Shortlisted Proposals</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.shortlistedStartups}</div>
            <div className="mt-1 text-[11px] text-slate-500">Committee approved</div>
          </div>

          {/* 5. Active Pilots */}
          <div
            onClick={() => onNavigate('pilots')}
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Field Pilots</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.activePilots}</div>
            <div className="mt-1 text-[11px] text-emerald-600 font-medium">Milestones & KPI tracking</div>
          </div>

          {/* 6. Total Procurement Value */}
          <div
            onClick={() => onNavigate('procurement')}
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all cursor-pointer group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Procurement Budget</span>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{formatINR(kpis.procurementValue)}</div>
            <div className="mt-1 text-[11px] text-slate-500">Approved procurement commitments</div>
          </div>

          {/* 7. Successful Innovations */}
          <div
            onClick={() => onNavigate('procurement')}
            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all cursor-pointer group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Scaled Deployments</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{kpis.successfulInnovations}</div>
            <div className="mt-1 text-[11px] text-cyan-600 font-medium">Contracts awarded & deployed</div>
          </div>

          {/* 8. Conversion Efficiency */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/60 p-4 rounded-xl border border-indigo-200 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-900">Procurement Cycle</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-indigo-950">4.2 Mo</div>
            <div className="mt-1 text-[11px] text-indigo-800 font-medium">From challenge to pilot contract</div>
          </div>
        </div>
      </div>

      {/* Innovation Procurement Funnel Lifecycle */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              National Innovation Procurement Funnel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live progression of public problems into verified field pilots and scale government procurement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {funnelSteps.map((step, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate(step.tab)}
              className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition-all text-center group"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Step 0{idx + 1}
              </div>
              <div className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {step.count}
              </div>
              <div className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">{step.label}</div>
              <div className="text-[10px] text-slate-500 line-clamp-1">{step.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Problems by Sector */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Challenges Distribution by Sector</h3>
              <p className="text-xs text-slate-500">Breakdown of active public-sector problem statements</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.charts.problemsBySector} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="sector" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  formatter={(val: any) => [`${val} Challenges`, 'Volume']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {analytics.charts.problemsBySector.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Procurement Value by Department */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Procurement Commitments by Ministry</h3>
              <p className="text-xs text-slate-500">Total approved procurement value across departments</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.charts.procurementByDepartment} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <XAxis dataKey="department_code" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)}Cr`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px', border: 'none' }}
                  formatter={(val: any) => [`₹${(val / 10000000).toFixed(2)} Crores`, 'Budget']}
                />
                <Bar dataKey="total_value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Recent Activity & Quick Action Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Activity Feed */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Governance & Audit Trail</h3>
                <p className="text-xs text-slate-500">Immutable ledger of procurement actions, shortlists, and approvals</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Full Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                    {log.action.slice(0, 3)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {log.action.replace(/_/g, ' ')}
                      <span className="text-slate-400 font-normal ml-1">on {log.entity}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Actor: <span className="font-medium text-slate-700">{log.user_email || 'System'}</span> · IP: {log.ip_address}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: GFR 2017 Innovation Protocol Badge */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-200/80 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider mb-2">
              <Award className="w-4 h-4 text-indigo-600" />
              GFR 2017 Innovation Framework
            </div>
            <h4 className="font-bold text-sm text-slate-900 leading-snug">
              Exemption from Rule 149 (GeM Exclusive Mandate)
            </h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Under Department of Expenditure guidelines, startups completing successful verified field pilots
              are eligible for single-source nomination or special Swiss-Challenge scale contracts.
            </p>
            <div className="mt-4 pt-3 border-t border-indigo-200/60 flex items-center justify-between text-xs">
              <span className="text-indigo-900 font-semibold">Scale Pilot Threshold:</span>
              <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-[11px]">Score ≥ 80%</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Next Pending Action
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              1 pilot in Odisha Rural Diabetic Eye Care achieved <strong className="text-slate-900">94.8/100 Scale Readiness</strong>.
              Review scale assessment to advance to contract execution.
            </p>
            <button
              onClick={() => onNavigate('pilots')}
              className="mt-3 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              Review Scale Pilot <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
