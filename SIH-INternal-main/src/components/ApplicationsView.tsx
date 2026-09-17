import { useState, useEffect, FormEvent } from 'react';
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Award,
  IndianRupee,
  Calendar,
  Building2,
  User,
  Sliders,
  ChevronRight,
  X,
  Send,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Application, ApplicationStatus, Evaluation } from '../types';
import { api } from '../api';

interface ApplicationsViewProps {
  onNavigateToProblem: (problemId: string) => void;
  onNavigateToStartup: (startupId: string) => void;
}

export function ApplicationsView({ onNavigateToProblem, onNavigateToStartup }: ApplicationsViewProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Evaluation Sheet Modal
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalApp, setEvalApp] = useState<Application | null>(null);
  const [techScore, setTechScore] = useState('18');
  const [innovScore, setInnovScore] = useState('14');
  const [feasScore, setFeasScore] = useState('14');
  const [finScore, setFinScore] = useState('9');
  const [scaleScore, setScaleScore] = useState('9');
  const [impactScore, setImpactScore] = useState('14');
  const [secScore, setSecScore] = useState('4.5');
  const [compScore, setCompScore] = useState('9.5');
  const [evalComments, setEvalComments] = useState('');
  const [isSubmittingEval, setIsSubmittingEval] = useState(false);

  const statuses: { label: string; value: string }[] = [
    { label: 'All Submissions', value: 'ALL' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Screening', value: 'SCREENING' },
    { label: 'Evaluation', value: 'EVALUATION' },
    { label: 'Shortlisted', value: 'SHORTLISTED' },
    { label: 'Field Pilot', value: 'PILOT' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.getApplications({
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
      setApplications(res.applications);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus]);

  const loadAppDetails = async (id: string) => {
    try {
      const res = await api.getApplicationById(id);
      setSelectedApp(res.application);
    } catch (err) {
      console.error('Failed to load application details:', err);
    }
  };

  const handleShortlist = async (appId: string) => {
    try {
      await api.shortlistApplication(appId);
      alert('Application shortlisted for pilot sanctioning!');
      fetchApplications();
      if (selectedApp?.id === appId) {
        loadAppDetails(appId);
      }
    } catch (err: any) {
      alert('Error shortlisting: ' + err.message);
    }
  };

  const handleReject = async (appId: string) => {
    const reason = prompt('Please enter rejection feedback for the startup:');
    if (reason === null) return;
    try {
      await api.rejectApplication(appId, reason);
      alert('Application status updated to REJECTED.');
      fetchApplications();
      if (selectedApp?.id === appId) {
        setSelectedApp(null);
      }
    } catch (err: any) {
      alert('Error rejecting: ' + err.message);
    }
  };

  const handleSubmitEvaluation = async (e: FormEvent) => {
    e.preventDefault();
    if (!evalApp) return;

    try {
      setIsSubmittingEval(true);
      await api.submitEvaluation({
        applicationId: evalApp.id,
        technicalScore: parseFloat(techScore),
        innovationScore: parseFloat(innovScore),
        feasibilityScore: parseFloat(feasScore),
        financialScore: parseFloat(finScore),
        scalabilityScore: parseFloat(scaleScore),
        impactScore: parseFloat(impactScore),
        securityScore: parseFloat(secScore),
        complianceScore: parseFloat(compScore),
        comments: evalComments || 'Comprehensive technical and financial review completed with high feasibility marks.',
      });

      setShowEvalModal(false);
      alert('Evaluation score submitted successfully to the committee record!');
      fetchApplications();
    } catch (err: any) {
      alert('Error submitting evaluation: ' + err.message);
    } finally {
      setIsSubmittingEval(false);
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

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'SHORTLISTED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PILOT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'EVALUATION':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'SCREENING':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUBMITTED':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Proposal Screening & Evaluation Studio
            </h1>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
              {applications.length} Proposals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review technical approaches, score rubrics against tender specs, and shortlist candidates for field pilots.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 text-xs">
        {statuses.map((st) => (
          <button
            key={st.value}
            onClick={() => setSelectedStatus(st.value)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedStatus === st.value
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Proposals Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try switching status filters or encourage startups to apply.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {app.problem_code || 'CHALLENGE'}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {app.sector}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(app.status)}`}>
                    {app.status}
                  </span>
                </div>

                <h3
                  onClick={() => loadAppDetails(app.id)}
                  className="font-bold text-base text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {app.proposal_title}
                </h3>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {app.company_name}
                  </span>
                  <span>·</span>
                  <span>Target: {app.problem_title}</span>
                  <span>·</span>
                  <span>Submitted: {new Date(app.submitted_at).toLocaleDateString()}</span>
                </div>

                <p className="text-xs text-slate-600 mt-2 line-clamp-1">
                  {app.technical_approach}
                </p>
              </div>

              {/* Middle Metrics */}
              <div className="flex items-center gap-6 text-xs shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Proposed Budget</span>
                  <span className="font-extrabold text-slate-900">{formatINR(app.proposed_budget)}</span>
                  <span className="text-[10px] text-slate-400 block">Tender: {formatINR(app.problem_budget || 0)}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Evaluation Score</span>
                  <span className="font-extrabold text-indigo-600 text-sm">
                    {app.evaluation_score ? `${app.evaluation_score.toFixed(1)}/100` : 'Pending'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEvalApp(app);
                      setShowEvalModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Score
                  </button>

                  {app.status !== 'SHORTLISTED' && app.status !== 'PILOT' && (
                    <button
                      onClick={() => handleShortlist(app.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs"
                    >
                      Shortlist
                    </button>
                  )}

                  <button
                    onClick={() => loadAppDetails(app.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                    {selectedApp.problem_code}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(selectedApp.status)}`}>
                    {selectedApp.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedApp.proposal_title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Candidate Startup: <strong className="text-slate-800">{selectedApp.company_name}</strong></span>
                  <span>·</span>
                  <span>Timeline: {selectedApp.timeline_months} Months</span>
                </div>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Key Financial Comparison */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Proposed Budget</span>
                  <span className="text-base font-extrabold text-slate-900">{formatINR(selectedApp.proposed_budget)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Sanctioned Tender Budget</span>
                  <span className="text-base font-extrabold text-slate-700">{formatINR(selectedApp.problem_budget || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Evaluation Score</span>
                  <span className="text-base font-extrabold text-indigo-600">
                    {selectedApp.evaluation_score ? `${selectedApp.evaluation_score.toFixed(1)}/100` : 'Under Review'}
                  </span>
                </div>
              </div>

              {/* Technical Approach */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Technical Architecture & Innovation Approach</h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-line">
                  {selectedApp.technical_approach}
                </div>
              </div>

              {/* Implementation Plan */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Milestone Execution Schedule</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
                  {selectedApp.implementation_plan}
                </div>
              </div>

              {/* Team Details */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Proposed Project Team & Domain Experience</h4>
                <p className="text-slate-600 leading-relaxed">{selectedApp.team_details}</p>
              </div>

              {/* Attached Documents */}
              {selectedApp.documents && selectedApp.documents.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Attached Technical Dossiers & Schematics</h4>
                  <div className="space-y-1.5">
                    {selectedApp.documents.map((doc) => (
                      <div key={doc.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span className="font-semibold text-slate-800">{doc.title}</span>
                        </div>
                        <span className="text-slate-400 text-[10px] font-mono">PDF · Verified</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleReject(selectedApp.id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg border border-rose-200"
              >
                Reject with Feedback
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEvalApp(selectedApp);
                    setShowEvalModal(true);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Score Rubric
                </button>
                {selectedApp.status !== 'SHORTLISTED' && selectedApp.status !== 'PILOT' && (
                  <button
                    onClick={() => handleShortlist(selectedApp.id)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    Shortlist for Pilot
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evaluator Rubric Modal */}
      {showEvalModal && evalApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Technical Committee Scoring Rubric
                </span>
                <h3 className="font-extrabold text-base text-slate-900">{evalApp.proposal_title}</h3>
                <p className="text-xs text-slate-500">Applicant: {evalApp.company_name}</p>
              </div>
              <button onClick={() => setShowEvalModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Technical Architecture (Max 20)</label>
                  <input
                    type="number"
                    step="0.5"
                    max="20"
                    min="0"
                    required
                    value={techScore}
                    onChange={(e) => setTechScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Innovation & Novelty (Max 15)</label>
                  <input
                    type="number"
                    step="0.5"
                    max="15"
                    min="0"
                    required
                    value={innovScore}
                    onChange={(e) => setInnovScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Operational Feasibility (Max 15)</label>
                  <input
                    type="number"
                    step="0.5"
                    max="15"
                    min="0"
                    required
                    value={feasScore}
                    onChange={(e) => setFeasScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Financial Prudence (Max 10)</label>
                  <input
                    type="number"
                    step="0.5"
                    max="10"
                    min="0"
                    required
                    value={finScore}
                    onChange={(e) => setFinScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Scalability & Integration (Max 10)</label>
                  <input
                    type="number"
                    step="0.5"
                    max="10"
                    min="0"
                    required
                    value={scaleScore}
                    onChange={(e) => setScaleScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Public Impact Potential (Max 15)</label>
                  <input
                    type="number"
                    step="0.5"
                    max="15"
                    min="0"
                    required
                    value={impactScore}
                    onChange={(e) => setImpactScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cybersecurity (Max 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    max="5"
                    min="0"
                    required
                    value={secScore}
                    onChange={(e) => setSecScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">GFR / BIS Compliance (Max 10)</label>
                  <input
                    type="number"
                    step="0.5"
                    max="10"
                    min="0"
                    required
                    value={compScore}
                    onChange={(e) => setCompScore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Evaluator Notes & Justification</label>
                <textarea
                  rows={3}
                  value={evalComments}
                  onChange={(e) => setEvalComments(e.target.value)}
                  placeholder="Record justification for scores and field pilot recommendation..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEvalModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEval}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isSubmittingEval ? 'Saving...' : 'Submit Official Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
