import { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  Cpu,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  Check,
  ShieldCheck,
  Zap,
  Info,
  ExternalLink,
} from 'lucide-react';
import { ProblemStatement, AIMatch, Startup } from '../types';
import { api } from '../api';

interface AIMatchingViewProps {
  selectedProblemId?: string | null;
  onNavigateToStartup: (startupId: string) => void;
  onNavigateToApplications: () => void;
}

export function AIMatchingView({
  selectedProblemId,
  onNavigateToStartup,
  onNavigateToApplications,
}: AIMatchingViewProps) {
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [activeProblemId, setActiveProblemId] = useState<string>(selectedProblemId || '');
  const [matches, setMatches] = useState<AIMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<AIMatch | null>(null);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadProblems() {
      try {
        const res = await api.getProblems();
        setProblems(res.problems);
        if (!activeProblemId && res.problems.length > 0) {
          setActiveProblemId(selectedProblemId || res.problems[0].id);
        }
      } catch (err) {
        console.error('Failed to load problems for AI matching:', err);
      }
    }
    loadProblems();
  }, []);

  useEffect(() => {
    if (selectedProblemId) {
      setActiveProblemId(selectedProblemId);
    }
  }, [selectedProblemId]);

  const loadMatches = async (probId: string) => {
    if (!probId) return;
    try {
      setLoading(true);
      const res = await api.getMatchesForProblem(probId);
      setMatches(res.matches);
      if (res.matches.length > 0) {
        setSelectedMatch(res.matches[0]);
      } else {
        setSelectedMatch(null);
      }
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProblemId) {
      loadMatches(activeProblemId);
    }
  }, [activeProblemId]);

  const handleRunAIMatch = async () => {
    if (!activeProblemId) return;
    try {
      setIsGenerating(true);
      const res = await api.generateMatches(activeProblemId, 6);
      setMatches(res.matches);
      if (res.matches.length > 0) {
        setSelectedMatch(res.matches[0]);
      }
    } catch (err: any) {
      alert('Error running AI matching: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShortlist = async (match: AIMatch) => {
    if (!match.application_id) {
      alert(`No active application found for ${match.company_name}. Please encourage the startup to submit a formal proposal first.`);
      return;
    }
    try {
      await api.shortlistApplication(match.application_id);
      setShortlistedIds((prev) => new Set([...prev, match.application_id!]));
      alert(`${match.company_name} has been shortlisted for technical evaluation & pilot consideration!`);
    } catch (err: any) {
      alert('Error shortlisting: ' + err.message);
    }
  };

  const activeProblem = problems.find((p) => p.id === activeProblemId);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const parseArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [val];
      }
    }
    return [];
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-md text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Gemini-Powered Semantic Innovation Matcher
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              AI Challenge & Startup Compatibility Engine
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Evaluates technical architecture, sector domain, past government deployments, and budgetary
              alignment to score and rank candidates against public tender requirements.
            </p>
          </div>

          <button
            onClick={handleRunAIMatch}
            disabled={isGenerating || !activeProblemId}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Analyzing Compatibility...' : 'Run Real-Time AI Match'}
          </button>
        </div>
      </div>

      {/* Challenge Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-700 whitespace-nowrap">Target Challenge:</span>
          <select
            value={activeProblemId}
            onChange={(e) => setActiveProblemId(e.target.value)}
            className="w-full sm:w-[480px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold outline-none focus:border-indigo-500"
          >
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                [{p.problem_code}] {p.title} ({p.sector})
              </option>
            ))}
          </select>
        </div>

        {activeProblem && (
          <div className="flex items-center gap-3 text-slate-500 text-[11px] shrink-0">
            <span>Budget: <strong className="text-slate-800">₹{(activeProblem.budget / 10000000).toFixed(2)} Cr</strong></span>
            <span>·</span>
            <span>Timeline: <strong className="text-slate-800">{activeProblem.timeline_months} Mo</strong></span>
            <span>·</span>
            <span className="text-indigo-600 font-semibold">{matches.length} Candidates Evaluated</span>
          </div>
        )}
      </div>

      {/* Main Matching Grid: Candidates List & Deep Comparison Pane */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Pre-computed Matches Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click &quot;Run Real-Time AI Match&quot; above to trigger semantic scoring across all 30 registered high-tech startups.
          </p>
          <button
            onClick={handleRunAIMatch}
            disabled={isGenerating}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Generate Matches Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Candidate Ranking Cards */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              <span>Candidate Startups (Ranked)</span>
              <span>AI Fit Score</span>
            </div>

            <div className="space-y-2.5">
              {matches.map((match, idx) => {
                const isSelected = selectedMatch?.id === match.id;
                const isShortlisted = match.application_id && shortlistedIds.has(match.application_id);

                return (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-400 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            {match.company_name}
                            {isShortlisted && (
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                                SHORTLISTED
                              </span>
                            )}
                          </h4>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {match.location} · {match.stage}
                          </div>
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-lg border font-extrabold text-sm ${getScoreColor(match.overall_score)}`}>
                        {match.overall_score.toFixed(1)}%
                      </div>
                    </div>

                    {/* Quick strengths summary */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {match.technologies?.slice(0, 3).map((tech) => (
                        <span key={tech} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 7 Cols: Deep Compatibility Breakdown */}
          <div className="lg:col-span-7">
            {selectedMatch ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                      AI Compatibility Assessment
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {selectedMatch.company_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Stage: <strong className="text-slate-700">{selectedMatch.stage}</strong> · Team: <strong className="text-slate-700">{selectedMatch.team_size || 25} engineers</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <div className={`inline-block px-3 py-1.5 rounded-xl border text-xl font-black ${getScoreColor(selectedMatch.overall_score)}`}>
                      {selectedMatch.overall_score.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1 font-semibold uppercase">Overall Compatibility</span>
                  </div>
                </div>

                {/* Multi-Dimensional Fit Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    Multi-Factor Evaluation Rubric
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Technology Architecture</span>
                        <span className="font-bold text-slate-900">{selectedMatch.technology_score}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${selectedMatch.technology_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Sector & Domain Expertise</span>
                        <span className="font-bold text-slate-900">{selectedMatch.sector_score}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${selectedMatch.sector_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Tender Requirements Match</span>
                        <span className="font-bold text-slate-900">{selectedMatch.requirement_score}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${selectedMatch.requirement_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Public Sector Track Record</span>
                        <span className="font-bold text-slate-900">{selectedMatch.experience_score}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-600 rounded-full" style={{ width: `${selectedMatch.experience_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Budget Feasibility</span>
                        <span className="font-bold text-slate-900">{selectedMatch.budget_fit_score}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 rounded-full" style={{ width: `${selectedMatch.budget_fit_score}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-600">Public Impact Potential</span>
                        <span className="font-bold text-slate-900">{selectedMatch.impact_potential_score}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 rounded-full" style={{ width: `${selectedMatch.impact_potential_score}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    AI Synthesis & Evaluation Justification
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selectedMatch.match_explanation}
                  </p>
                </div>

                {/* Strengths & Risks */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80">
                    <h5 className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Key Competitive Strengths
                    </h5>
                    <ul className="space-y-1.5 text-emerald-950">
                      {parseArray(selectedMatch.strengths).map((s, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80">
                    <h5 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Deployment Risks & Mitigations
                    </h5>
                    <ul className="space-y-1.5 text-amber-950">
                      {parseArray(selectedMatch.potential_risks).map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Next Step & CTA */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                      Recommended Committee Action
                    </span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {selectedMatch.recommended_next_step}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigateToStartup(selectedMatch.startup_id)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg"
                    >
                      View Dossier
                    </button>

                    <button
                      onClick={() => handleShortlist(selectedMatch)}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Shortlist Candidate
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                Select a candidate from the left to view comprehensive compatibility breakdown.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
