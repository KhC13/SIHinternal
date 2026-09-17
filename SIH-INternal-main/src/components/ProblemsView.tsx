import { useState, useEffect, FormEvent } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Sparkles,
  Calendar,
  IndianRupee,
  MapPin,
  Clock,
  CheckCircle2,
  FileCheck2,
  ArrowRight,
  X,
  Send,
  Sliders,
  ChevronRight,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { ProblemStatement, User, ProblemStatus } from '../types';
import { api } from '../api';

interface ProblemsViewProps {
  key?: string;
  user: User | null;
  onSelectProblemForAI: (problemId: string) => void;
  initialSelectedId?: string | null;
}

export function ProblemsView({ user, onSelectProblemForAI, initialSelectedId }: ProblemsViewProps) {
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedProblem, setSelectedProblem] = useState<ProblemStatement | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyProblem, setApplyProblem] = useState<ProblemStatement | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeptId, setNewDeptId] = useState('dept-01');
  const [newSector, setNewSector] = useState('Smart Cities');
  const [newLocation, setNewLocation] = useState('New Delhi / NCR');
  const [newBudget, setNewBudget] = useState('35000000');
  const [newMonths, setNewMonths] = useState('6');
  const [newImpact, setNewImpact] = useState('');
  const [newBeneficiaries, setNewBeneficiaries] = useState('');
  const [newTechs, setNewTechs] = useState('Computer Vision, Edge AI, IoT Sensors');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply Form State
  const [proposalTitle, setProposalTitle] = useState('');
  const [techApproach, setTechApproach] = useState('');
  const [implPlan, setImplPlan] = useState('');
  const [propBudget, setPropBudget] = useState('');
  const [propMonths, setPropMonths] = useState('6');
  const [propImpact, setPropImpact] = useState('');
  const [teamDetails, setTeamDetails] = useState('');

  const sectors = [
    'ALL',
    'Smart Cities',
    'Healthcare',
    'Agriculture',
    'Water Management',
    'Mobility',
    'Clean Energy',
    'Digital Governance',
    'Public Safety',
  ];

  const statuses: { label: string; value: string }[] = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Published', value: 'PUBLISHED' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Shortlisted', value: 'SHORTLISTED' },
    { label: 'Pilot Active', value: 'PILOT' },
    { label: 'Procurement', value: 'PROCUREMENT' },
  ];

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const res = await api.getProblems({
        search: search || undefined,
        sector: selectedSector !== 'ALL' ? selectedSector : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });
      setProblems(res.problems);

      if (initialSelectedId) {
        const found = res.problems.find((p) => p.id === initialSelectedId);
        if (found) {
          loadProblemDetails(found.id);
        }
      }
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [search, selectedSector, selectedStatus]);

  const loadProblemDetails = async (id: string) => {
    try {
      const res = await api.getProblemById(id);
      setSelectedProblem(res.problem);
    } catch (err) {
      console.error('Failed to get problem details:', err);
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

  const getStatusBadge = (status: ProblemStatus) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SHORTLISTED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'PILOT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PROCUREMENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'COMPLETED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleCreateProblem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newBudget) return;

    try {
      setIsSubmitting(true);
      const techArray = newTechs.split(',').map((t) => t.trim()).filter(Boolean);
      await api.createProblem({
        title: newTitle,
        description: newDesc,
        departmentId: newDeptId,
        sector: newSector,
        location: newLocation,
        budget: parseFloat(newBudget),
        timelineMonths: parseInt(newMonths, 10),
        expectedImpact: newImpact || 'Measurable public service improvement and automated telemetry reporting.',
        targetBeneficiaries: newBeneficiaries || 'Citizens and municipal authorities.',
        technologies: techArray,
        requirements: [
          { title: 'Core Technical Integration', description: 'Compatible with standard REST APIs and local sensors.', isMandatory: true },
          { title: 'Information Security Standard', description: 'Data stored within Indian jurisdiction in compliance with DPDP Act 2023.', isMandatory: true },
        ],
        weights: { technical: 25, innovation: 15, feasibility: 15, financial: 10, scalability: 15, impact: 10, security: 5, compliance: 5 },
        status: 'PUBLISHED',
      });

      setShowCreateModal(false);
      // Reset
      setNewTitle('');
      setNewDesc('');
      fetchProblems();
    } catch (err: any) {
      alert('Error creating problem: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!applyProblem || !proposalTitle || !techApproach) return;

    try {
      setIsSubmitting(true);
      await api.submitApplication({
        problemId: applyProblem.id,
        startupId: user?.startupId || 'startup-01',
        proposalTitle,
        technicalApproach: techApproach,
        implementationPlan: implPlan || 'Phase 1: Lab benchmarks. Phase 2: Pilot corridor setup. Phase 3: Field verification.',
        timelineMonths: parseInt(propMonths, 10),
        proposedBudget: parseFloat(propBudget || applyProblem.budget.toString()),
        expectedImpact: propImpact || applyProblem.expected_impact,
        teamDetails: teamDetails || 'Senior engineers and ML architects with prior public sector experience.',
        documents: [{ title: 'Technical Proposal Specification', fileType: 'application/pdf', fileUrl: '/uploads/proposal.pdf' }],
      });

      setShowApplyModal(false);
      setProposalTitle('');
      setTechApproach('');
      alert('Proposal submitted successfully! It is now available under Screening & Review.');
      fetchProblems();
    } catch (err: any) {
      alert('Error submitting application: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Government Innovation Challenges
            </h1>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
              {problems.length} Challenges
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse public-sector problem statements, evaluate technical feasibility, run AI semantic matches, and apply.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Post New Challenge
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, challenge code, or keywords..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Sector Selector */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {sectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedSector === sec
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium outline-none"
        >
          {statuses.map((st) => (
            <option key={st.value} value={st.value}>
              {st.label}
            </option>
          ))}
        </select>
      </div>

      {/* Problems Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Challenges Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or sector filters, or post a new problem statement.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problems.map((prob) => (
            <div
              key={prob.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Code & Badges */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {prob.problem_code}
                    </span>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {prob.sector}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(prob.status)}`}>
                    {prob.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => loadProblemDetails(prob.id)}
                  className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                >
                  {prob.title}
                </h3>

                {/* Department */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{prob.department_name || 'Ministry of Housing & Urban Affairs'}</span>
                </div>

                {/* Description Excerpt */}
                <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                  {prob.description}
                </p>

                {/* Technologies */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {prob.technologies?.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-medium rounded border border-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                  {(prob.technologies?.length || 0) > 4 && (
                    <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">
                      +{(prob.technologies?.length || 0) - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Metadata & CTAs */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Budget</span>
                    <span className="font-bold text-slate-900">{formatINR(prob.budget)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Timeline</span>
                    <span className="font-medium text-slate-700">{prob.timeline_months} Months</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Proposals</span>
                    <span className="font-medium text-slate-700">{prob.applications_count || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectProblemForAI(prob.id);
                    }}
                    title="Launch AI Semantic Matching"
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200 flex items-center gap-1 text-xs font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">AI Match</span>
                  </button>

                  <button
                    onClick={() => {
                      setApplyProblem(prob);
                      setShowApplyModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Apply
                  </button>

                  <button
                    onClick={() => loadProblemDetails(prob.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Problem Detail Modal */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                    {selectedProblem.problem_code}
                  </span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {selectedProblem.sector}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(selectedProblem.status)}`}>
                    {selectedProblem.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  {selectedProblem.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedProblem.department_name} · Ministry: {selectedProblem.department_ministry || 'Government of India'}
                </p>
              </div>
              <button
                onClick={() => setSelectedProblem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs">
              {/* Key Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Sanctioned Budget</span>
                  <span className="text-base font-extrabold text-slate-900">{formatINR(selectedProblem.budget)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Target Timeline</span>
                  <span className="text-base font-extrabold text-slate-900">{selectedProblem.timeline_months} Months</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Deployment Region</span>
                  <span className="text-base font-extrabold text-slate-900 truncate block">{selectedProblem.location}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Total Proposals</span>
                  <span className="text-base font-extrabold text-indigo-600">{selectedProblem.applications_count || 0} Submissions</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">Problem Statement & Scope</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-xs">
                  {selectedProblem.description}
                </p>
              </div>

              {/* Expected Public Impact */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">Expected Public Benefit & Metrics</h4>
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-xl text-emerald-900 leading-relaxed">
                  {selectedProblem.expected_impact}
                  {selectedProblem.target_beneficiaries && (
                    <div className="mt-2 pt-2 border-t border-emerald-200/50 text-[11px] text-emerald-800">
                      <strong>Target Population:</strong> {selectedProblem.target_beneficiaries}
                    </div>
                  )}
                </div>
              </div>

              {/* Requirements */}
              {selectedProblem.requirements && selectedProblem.requirements.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Technical & Operational Requirements</h4>
                  <div className="space-y-2">
                    {selectedProblem.requirements.map((req, i) => (
                      <div key={req.id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2.5">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 ${req.is_mandatory ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{req.title}</span>
                            {req.is_mandatory && (
                              <span className="px-1.5 py-0.2 bg-red-100 text-red-700 font-bold rounded text-[9px]">
                                MANDATORY
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5">{req.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Weights */}
              {selectedProblem.weights && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Technical Evaluation Rubric (Total 100%)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500 block">Technical Architecture</span>
                      <span className="font-extrabold text-slate-900 text-sm">{selectedProblem.weights.technical}%</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500 block">Innovation & IP</span>
                      <span className="font-extrabold text-slate-900 text-sm">{selectedProblem.weights.innovation}%</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500 block">Operational Feasibility</span>
                      <span className="font-extrabold text-slate-900 text-sm">{selectedProblem.weights.feasibility}%</span>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-center">
                      <span className="text-[10px] text-slate-500 block">Public Impact</span>
                      <span className="font-extrabold text-slate-900 text-sm">{selectedProblem.weights.impact}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedProblem(null);
                  onSelectProblemForAI(selectedProblem.id);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Trigger AI Semantic Matcher
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedProblem(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setApplyProblem(selectedProblem);
                    setSelectedProblem(null);
                    setShowApplyModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                >
                  Submit Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Problem Wizard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">Post Public Innovation Challenge</h3>
                <p className="text-xs text-slate-500">Formulate a problem statement for high-tech startup solution matching</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProblem} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Challenge Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Automated AI Drone Medical Dropline in Mountainous Terrains"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Government Ministry / Department *</label>
                  <select
                    value={newDeptId}
                    onChange={(e) => setNewDeptId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  >
                    <option value="dept-01">MOHUA - Smart Cities Mission</option>
                    <option value="dept-02">MOHFW - National Digital Health</option>
                    <option value="dept-03">MORTH - National Highways</option>
                    <option value="dept-04">MOAFW - Agritech Cell</option>
                    <option value="dept-05">MOJS - National River Informatics</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sector *</label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  >
                    {sectors.filter((s) => s !== 'ALL').map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Problem Description & Technical Bottleneck *</label>
                <textarea
                  required
                  rows={4}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail the operational pain point, current failure modes, and why commercial off-the-shelf solutions do not meet public requirements..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Budget (INR) *</label>
                  <input
                    type="number"
                    required
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilot Timeline (Months) *</label>
                  <input
                    type="number"
                    required
                    value={newMonths}
                    onChange={(e) => setNewMonths(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deployment Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Required Technologies (Comma separated)</label>
                <input
                  type="text"
                  value={newTechs}
                  onChange={(e) => setNewTechs(e.target.value)}
                  placeholder="Computer Vision, Edge AI, IoT, LoRaWAN..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expected Public Benefit & Target Beneficiaries</label>
                <input
                  type="text"
                  value={newImpact}
                  onChange={(e) => setNewImpact(e.target.value)}
                  placeholder="e.g., 40% reduction in response time for 250,000 rural residents."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Challenge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Application Proposal Modal */}
      {showApplyModal && applyProblem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                  Proposal Submission
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">{applyProblem.title}</h3>
                <p className="text-xs text-slate-500">Target Budget: {formatINR(applyProblem.budget)}</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Proposal Title *</label>
                <input
                  type="text"
                  required
                  value={proposalTitle}
                  onChange={(e) => setProposalTitle(e.target.value)}
                  placeholder="e.g., Ultra-Low Latency Edge Vision Engine for Corridor Traffic Prioritization"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Technical Architecture & Innovation Approach *</label>
                <textarea
                  required
                  rows={4}
                  value={techApproach}
                  onChange={(e) => setTechApproach(e.target.value)}
                  placeholder="Describe your proprietary algorithms, hardware components, offline capabilities, and compliance with Indian government standards..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Proposed Budget (INR)</label>
                  <input
                    type="number"
                    value={propBudget}
                    onChange={(e) => setPropBudget(e.target.value)}
                    placeholder={`Max ${applyProblem.budget}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilot Timeline (Months)</label>
                  <input
                    type="number"
                    value={propMonths}
                    onChange={(e) => setPropMonths(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Milestone Execution Plan</label>
                <textarea
                  rows={2}
                  value={implPlan}
                  onChange={(e) => setImplPlan(e.target.value)}
                  placeholder="Month 1: Sensor calibration. Month 2: Edge hardware deployment. Month 3: Traffic control integration..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
