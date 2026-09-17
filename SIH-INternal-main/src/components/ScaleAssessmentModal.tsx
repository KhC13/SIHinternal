import { useState } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  X,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Pilot, ScaleAssessment } from '../types';
import { api } from '../api';

interface ScaleAssessmentModalProps {
  pilot: Pilot;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScaleAssessmentModal({ pilot, onClose, onSuccess }: ScaleAssessmentModalProps) {
  const [impactScore, setImpactScore] = useState(18);
  const [techScore, setTechScore] = useState(19);
  const [opScore, setOpScore] = useState(13);
  const [finScore, setFinScore] = useState(9);
  const [userScore, setUserScore] = useState(9);
  const [secScore, setSecScore] = useState(4.8);
  const [compScore, setCompScore] = useState(9.5);
  const [scaleScore, setScaleScore] = useState(14);
  const [summary, setSummary] = useState(
    'Pilot demonstrated robust technical uptime (99.8%) and 34% measured reduction in emergency transit delay. Ready for national municipal rollout under GFR Rule 194.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate overall score (normalized out of 100)
  const totalRaw =
    impactScore + techScore + opScore + finScore + userScore + secScore + compScore + scaleScore;
  const overallScore = Math.min(100, Math.round(totalRaw * 10) / 10);

  const getReadinessLevel = (score: number) => {
    if (score >= 85) return { label: 'HIGHLY_READY', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (score >= 75) return { label: 'READY', color: 'text-indigo-700 bg-indigo-100 border-indigo-300' };
    if (score >= 65) return { label: 'CONDITIONALLY_READY', color: 'text-amber-700 bg-amber-100 border-amber-300' };
    return { label: 'NOT_READY', color: 'text-rose-700 bg-rose-100 border-rose-300' };
  };

  const readiness = getReadinessLevel(overallScore);

  const handleSubmit = async (approveForProcurement: boolean) => {
    try {
      setIsSubmitting(true);
      await api.submitScaleAssessment({
        pilotId: pilot.id,
        impactScore,
        technicalReadinessScore: techScore,
        operationalReadinessScore: opScore,
        financialSustainabilityScore: finScore,
        userAdoptionScore: userScore,
        securityScore: secScore,
        complianceScore: compScore,
        scalabilityScore: scaleScore,
        overallScore,
        readinessLevel: readiness.label,
        summary,
        recommendations: [
          'Authorize single-source innovation rate contract under GFR 2017 Rule 194.',
          'Mandate standard STQC re-certification every 24 months.',
          'Execute phased state-wide deployment across top 10 municipal hubs.',
        ],
      });

      if (approveForProcurement) {
        // Automatically create a procurement file
        await api.createProcurement({
          pilotId: pilot.id,
          problemId: pilot.problem_id,
          startupId: pilot.startup_id,
          departmentId: pilot.department_id,
          title: `Scale Procurement: ${pilot.title}`,
          estimatedValue: pilot.budget * 4,
          approvedBudget: pilot.budget * 3.5,
          currentStage: 'RECOMMENDATION',
          targetCompletionDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }

      alert(
        approveForProcurement
          ? 'Scale Assessment Approved! Pilot has transitioned to the Scale Procurement Pipeline.'
          : 'Scale Assessment saved successfully!'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error recording assessment: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase tracking-wider">
                GFR 2017 Innovation Protocol
              </span>
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 leading-tight">
              Scale Readiness Assessment: {pilot.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Startup: <strong className="text-slate-700">{pilot.company_name}</strong> · Sector: {pilot.sector}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Live Score Display Banner */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">
                Calculated Readiness Score
              </span>
              <div className="text-3xl font-black text-white mt-0.5">{overallScore} / 100</div>
              <span className="text-[11px] text-slate-300">Target threshold for GFR Rule 194: 80%</span>
            </div>

            <div className="text-right">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                Readiness Classification
              </span>
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${readiness.color}`}>
                {readiness.label.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Sliders for 8 Dimensions */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              8-Dimensional Evaluation Rubric
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Public Impact Delivery (Max 20)</span>
                  <span className="font-bold text-slate-900">{impactScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={impactScore}
                  onChange={(e) => setImpactScore(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Technical Reliability & SLA (Max 20)</span>
                  <span className="font-bold text-slate-900">{techScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={techScore}
                  onChange={(e) => setTechScore(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Operational Feasibility (Max 15)</span>
                  <span className="font-bold text-slate-900">{opScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={opScore}
                  onChange={(e) => setOpScore(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Scalability & Cloud/Edge Architecture (Max 15)</span>
                  <span className="font-bold text-slate-900">{scaleScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={scaleScore}
                  onChange={(e) => setScaleScore(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Financial Unit Economics (Max 10)</span>
                  <span className="font-bold text-slate-900">{finScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={finScore}
                  onChange={(e) => setFinScore(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>User & Frontline Adoption (Max 10)</span>
                  <span className="font-bold text-slate-900">{userScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={userScore}
                  onChange={(e) => setUserScore(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>Cybersecurity Standard (Max 5)</span>
                  <span className="font-bold text-slate-900">{secScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={secScore}
                  onChange={(e) => setSecScore(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span>GFR & BIS Regulatory Compliance (Max 10)</span>
                  <span className="font-bold text-slate-900">{compScore}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={compScore}
                  onChange={(e) => setCompScore(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Assessment Summary */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">Committee Executive Assessment Justification</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none text-xs"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold text-xs hover:bg-slate-100"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold text-xs"
            >
              Save Assessment Only
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs shadow-xs flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              {isSubmitting ? 'Processing...' : 'Approve for Scale Procurement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
