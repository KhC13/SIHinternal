import { useState, useEffect, FormEvent } from 'react';
import {
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Award,
  AlertTriangle,
  TrendingUp,
  Building2,
  IndianRupee,
  Calendar,
  Sliders,
  ChevronRight,
  X,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  FileDown,
  FileText,
  Lock,
} from 'lucide-react';
import { Pilot, PilotStatus, PilotKPI, PilotMilestone, User } from '../types';
import { api } from '../api';
import { ScaleAssessmentModal } from './ScaleAssessmentModal';
import { generatePilotPdf } from '../utils/generatePilotPdf';
import { PilotKPIDashboard } from './PilotKPIDashboard';
import { LayoutGrid, BarChart3 } from 'lucide-react';

interface PilotsViewProps {
  user?: User | null;
  onNavigateToProcurement: () => void;
}

export function PilotsView({ user, onNavigateToProcurement }: PilotsViewProps) {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPilot, setSelectedPilot] = useState<Pilot | null>(null);

  // Modals & PDF export
  const [scaleModalPilot, setScaleModalPilot] = useState<Pilot | null>(null);
  const [updateKPIModal, setUpdateKPIModal] = useState<PilotKPI | null>(null);
  const [kpiNewVal, setKpiNewVal] = useState('');
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'both' | 'analytics' | 'cards'>('both');

  // Check authorization: Procurement Officers & Super Admins can generate & download official Pilot PDF summary reports
  const isAuthorized = user?.role === 'SUPER_ADMIN' || user?.role === 'PROCUREMENT_OFFICER';

  const handleDownloadPdf = async (pilotToExport: Pilot) => {
    if (!isAuthorized) {
      alert(
        'Access Restricted: Official Pilot PDF Summary Reports can only be generated and downloaded by Procurement Officers and Super Admins.'
      );
      return;
    }

    try {
      setGeneratingPdfId(pilotToExport.id);
      let fullPilot = pilotToExport;
      // Fetch full details if milestones, KPIs, or scale assessments might not be fully loaded
      try {
        const res = await api.getPilotById(pilotToExport.id);
        if (res.pilot) {
          fullPilot = res.pilot;
        }
      } catch (err) {
        console.warn('Could not fetch latest pilot details, generating with available data:', err);
      }

      generatePilotPdf(fullPilot, user);
    } catch (err: any) {
      console.error('Failed to generate PDF summary report:', err);
      alert('Error generating PDF report: ' + (err.message || 'Unknown error'));
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const fetchPilots = async () => {
    try {
      setLoading(true);
      const res = await api.getPilots({
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
      setPilots(res.pilots);
    } catch (err) {
      console.error('Failed to load pilots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPilots();
  }, [selectedStatus]);

  const loadPilotDetails = async (id: string) => {
    try {
      const res = await api.getPilotById(id);
      setSelectedPilot(res.pilot);
    } catch (err) {
      console.error('Failed to fetch pilot details:', err);
    }
  };

  const handleUpdateKPI = async (e: FormEvent) => {
    e.preventDefault();
    if (!updateKPIModal || !kpiNewVal) return;

    try {
      await api.updateKPI(updateKPIModal.id, parseFloat(kpiNewVal));
      setUpdateKPIModal(null);
      setKpiNewVal('');
      alert('KPI value updated in real-time telemetry ledger!');
      if (selectedPilot) {
        loadPilotDetails(selectedPilot.id);
      }
      fetchPilots();
    } catch (err: any) {
      alert('Error updating KPI: ' + err.message);
    }
  };

  const formatINR = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status: PilotStatus) => {
    switch (status) {
      case 'APPROVED_FOR_SCALE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ACTIVE':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PLANNED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'COMPLETED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Field Pilots & Milestone KPI Monitoring
            </h1>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
              {pilots.length} Pilots
            </span>
            {isAuthorized ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                PDF Report Export Enabled ({user?.role?.replace(/_/g, ' ')})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 text-[11px] font-medium rounded-full border border-slate-200">
                <Lock className="w-3 h-3 text-slate-400" />
                PDF Export: Procurement/Admin Only
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track real-world deployment telemetry, verify SLA milestones, and generate authenticated GFR pilot summary dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="view-mode-both-btn"
              onClick={() => setViewMode('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'both'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Combined View</span>
            </button>
            <button
              id="view-mode-analytics-btn"
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'analytics'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>KPI Analytics</span>
            </button>
            <button
              id="view-mode-cards-btn"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Projects Grid</span>
            </button>
          </div>

          <button
            onClick={onNavigateToProcurement}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            View Procurement Kanban <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Data Dashboard Component using Recharts */}
      {(viewMode === 'analytics' || viewMode === 'both') && (
        <PilotKPIDashboard
          pilots={pilots}
          onSelectPilot={(pilot) => loadPilotDetails(pilot.id)}
        />
      )}

      {/* Filter Tabs */}
      {(viewMode === 'cards' || viewMode === 'both') && (
        <>
          {viewMode === 'both' && (
            <div className="pt-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                Individual Pilot Projects Directory ({pilots.length})
              </h3>
            </div>
          )}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 text-xs">
        {['ALL', 'ACTIVE', 'PLANNED', 'APPROVED_FOR_SCALE', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedStatus === st
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Pilots Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : pilots.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Field Pilots Found</h3>
          <p className="text-xs text-slate-500 mt-1">Shortlist proposals from the Screening tab to launch new pilots.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pilots.map((pilot) => (
            <div
              key={pilot.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {pilot.problem_code || 'PILOT'}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {pilot.sector}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(pilot.status)}`}>
                    {pilot.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3
                  onClick={() => loadPilotDetails(pilot.id)}
                  className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                >
                  {pilot.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Startup: <strong className="text-slate-800">{pilot.company_name}</strong></span>
                  <span>·</span>
                  <span>Dept: {pilot.department_name}</span>
                </div>

                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                  {pilot.objectives}
                </p>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">Milestone Completion</span>
                    <span className="font-bold text-slate-900">{pilot.completion_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pilot.completion_percentage >= 80 ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${pilot.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Bottom Metadata & CTAs */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sanctioned Grant</span>
                    <span className="font-bold text-slate-900">{formatINR(pilot.budget)}</span>
                  </div>
                  {pilot.scale_readiness_score && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Scale Score</span>
                      <span className="font-bold text-emerald-600">{pilot.scale_readiness_score}/100</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(pilot)}
                    disabled={generatingPdfId === pilot.id}
                    title={
                      isAuthorized
                        ? 'Generate and download official Pilot Summary PDF report'
                        : 'PDF Report generation is restricted to Procurement Officers & Admins'
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      isAuthorized
                        ? 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300'
                        : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    {generatingPdfId === pilot.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : isAuthorized ? (
                      <FileDown className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Lock className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{generatingPdfId === pilot.id ? 'PDF...' : 'PDF Report'}</span>
                  </button>

                  <button
                    onClick={() => setScaleModalPilot(pilot)}
                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    Scale Eval
                  </button>

                  <button
                    onClick={() => loadPilotDetails(pilot.id)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Pilot Detail Modal */}
      {selectedPilot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {selectedPilot.problem_code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(selectedPilot.status)}`}>
                    {selectedPilot.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedPilot.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Startup: <strong className="text-slate-800">{selectedPilot.company_name}</strong> · Sanctioned Budget: {formatINR(selectedPilot.budget)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownloadPdf(selectedPilot)}
                  disabled={generatingPdfId === selectedPilot.id}
                  title={
                    isAuthorized
                      ? 'Download official Pilot Performance & Verification Summary PDF'
                      : 'Authorized for Procurement Officers and Super Admins only'
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                    isAuthorized
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {generatingPdfId === selectedPilot.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FileDown className="w-3.5 h-3.5" />
                  )}
                  <span>{generatingPdfId === selectedPilot.id ? 'Generating...' : 'Download PDF Summary'}</span>
                  {!isAuthorized && <Lock className="w-3 h-3 text-slate-400" />}
                </button>

                <button onClick={() => setSelectedPilot(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 text-xs">
              {/* Scale Score Banner if available */}
              {selectedPilot.scaleAssessment && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      GFR 2017 Innovation Protocol Assessment
                    </span>
                    <div className="text-lg font-black text-emerald-950 mt-0.5">
                      Score: {selectedPilot.scaleAssessment.overall_score}/100 · {selectedPilot.scaleAssessment.readiness_level.replace(/_/g, ' ')}
                    </div>
                    <p className="text-emerald-800 text-[11px] mt-0.5">{selectedPilot.scaleAssessment.summary}</p>
                  </div>
                  <button
                    onClick={onNavigateToProcurement}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs shrink-0"
                  >
                    View in Procurement
                  </button>
                </div>
              )}

              {/* Milestones Tracker */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Pilot Verification Milestones
                </h4>
                <div className="space-y-2">
                  {selectedPilot.milestones?.map((ms) => (
                    <div key={ms.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{ms.title}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              ms.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ms.status === 'IN_PROGRESS'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ms.status}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{ms.description}</p>
                        <div className="text-slate-400 text-[10px] mt-1">
                          Due Date: {new Date(ms.due_date).toLocaleDateString()} · Lead: {ms.owner}
                        </div>
                      </div>
                      <span className="font-extrabold text-slate-800 text-sm">{ms.completion_percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-Time KPIs */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Live Performance Telemetry (KPIs)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPilot.kpis?.map((kpi) => (
                    <div key={kpi.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{kpi.name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              kpi.status === 'EXCEEDED' || kpi.status === 'ON_TRACK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {kpi.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-xl font-black text-slate-900">
                            {kpi.current_value} {kpi.metric_unit}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Target: {kpi.target_value} {kpi.metric_unit}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Baseline: {kpi.baseline_value} {kpi.metric_unit}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setUpdateKPIModal(kpi);
                            setKpiNewVal(kpi.current_value.toString());
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Update Metric
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Register */}
              {selectedPilot.risks && selectedPilot.risks.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Pilot Risk Mitigation Register
                  </h4>
                  <div className="space-y-2">
                    {selectedPilot.risks.map((risk) => (
                      <div key={risk.id} className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{risk.title}</span>
                          <span className="px-1.5 py-0.2 bg-amber-200/60 text-amber-900 text-[9px] font-bold rounded">
                            {risk.severity} SEVERITY
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedPilot(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-100"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(selectedPilot)}
                  disabled={generatingPdfId === selectedPilot.id}
                  title={
                    isAuthorized
                      ? 'Download official Pilot Performance & Verification Summary PDF'
                      : 'Authorized for Procurement Officers and Super Admins only'
                  }
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                    isAuthorized
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {generatingPdfId === selectedPilot.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-600" />
                  )}
                  <span>{generatingPdfId === selectedPilot.id ? 'Compiling PDF...' : 'Export Pilot PDF'}</span>
                  {!isAuthorized && <Lock className="w-3 h-3 text-slate-400" />}
                </button>

                <button
                  onClick={() => {
                    setScaleModalPilot(selectedPilot);
                    setSelectedPilot(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Conduct Scale Readiness Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scale Assessment Modal */}
      {scaleModalPilot && (
        <ScaleAssessmentModal
          pilot={scaleModalPilot}
          onClose={() => setScaleModalPilot(null)}
          onSuccess={() => {
            fetchPilots();
          }}
        />
      )}

      {/* Update KPI Metric Modal */}
      {updateKPIModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-1">Update KPI Metric</h3>
            <p className="text-slate-500 mb-4">{updateKPIModal.name} ({updateKPIModal.metric_unit})</p>

            <form onSubmit={handleUpdateKPI} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Recorded Value *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={kpiNewVal}
                  onChange={(e) => setKpiNewVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUpdateKPIModal(null)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Save Telemetry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
