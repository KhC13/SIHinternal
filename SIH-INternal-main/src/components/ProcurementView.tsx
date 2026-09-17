import { useState, useEffect, FormEvent } from 'react';
import {
  FileText,
  IndianRupee,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronRight,
  FileCheck2,
  X,
  FileSignature,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Procurement, ProcurementStage, Contract } from '../types';
import { api } from '../api';

export function ProcurementView() {
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcurement, setSelectedProcurement] = useState<Procurement | null>(null);

  // Stage Update Modal
  const [stageModalProc, setStageModalProc] = useState<Procurement | null>(null);
  const [targetStage, setTargetStage] = useState<ProcurementStage>('BUDGET_APPROVAL');
  const [stageNotes, setStageNotes] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  // Contract Modal
  const [contractModalProc, setContractModalProc] = useState<Procurement | null>(null);
  const [contractNumber, setContractNumber] = useState('');
  const [contractVal, setContractVal] = useState('');
  const [contractTerms, setContractTerms] = useState('');
  const [isCreatingContract, setIsCreatingContract] = useState(false);

  const stages: { key: ProcurementStage; label: string; desc: string }[] = [
    { key: 'RECOMMENDATION', label: '1. Pilot Recommendation', desc: 'Scale Readiness evaluated' },
    { key: 'BUDGET_APPROVAL', label: '2. Ministry Budget Sanction', desc: 'Standing Finance Committee' },
    { key: 'TENDER_EXEMPTION', label: '3. GFR Rule 194 Exemption', desc: 'Special Innovation Sandbox' },
    { key: 'VENDOR_NEGOTIATION', label: '4. Rate Contract Negotiation', desc: 'Cost & SLA alignment' },
    { key: 'CONTRACT', label: '5. Contract Execution', desc: 'Legal binding agreement' },
    { key: 'PURCHASE_ORDER', label: '6. Work Order & Scale-out', desc: 'Active implementation' },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [procRes, contractRes] = await Promise.all([
        api.getProcurements(),
        api.getContracts(),
      ]);
      setProcurements(procRes.procurements);
      setContracts(contractRes.contracts);
    } catch (err) {
      console.error('Failed to load procurement pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadProcurementDetails = async (id: string) => {
    try {
      const res = await api.getProcurementById(id);
      setSelectedProcurement(res.procurement);
    } catch (err) {
      console.error('Failed to load procurement file:', err);
    }
  };

  const handleAdvanceStage = async (e: FormEvent) => {
    e.preventDefault();
    if (!stageModalProc) return;

    try {
      setIsUpdatingStage(true);
      await api.updateProcurementStage(
        stageModalProc.id,
        targetStage,
        stageNotes || `Advanced to ${targetStage} in accordance with GFR 2017 Innovation Protocol.`
      );
      setStageModalProc(null);
      setStageNotes('');
      alert(`Procurement file successfully transitioned to ${targetStage}!`);
      fetchData();
      if (selectedProcurement?.id === stageModalProc.id) {
        loadProcurementDetails(stageModalProc.id);
      }
    } catch (err: any) {
      alert('Error updating stage: ' + err.message);
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleCreateContract = async (e: FormEvent) => {
    e.preventDefault();
    if (!contractModalProc) return;

    try {
      setIsCreatingContract(true);
      const generatedCode = contractNumber || `GOI-INNOV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      await api.createContract({
        procurementId: contractModalProc.id,
        contractNumber: generatedCode,
        startupId: contractModalProc.startup_id,
        departmentId: contractModalProc.department_id,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contractValue: parseFloat(contractVal || contractModalProc.approved_budget.toString()),
        terms: contractTerms || 'Standard GFR 2017 Innovation Rate Contract with quarterly SLA milestones.',
      });

      setContractModalProc(null);
      alert(`Contract ${generatedCode} successfully signed & awarded!`);
      fetchData();
    } catch (err: any) {
      alert('Error creating contract: ' + err.message);
    } finally {
      setIsCreatingContract(false);
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

  const totalProcValue = procurements.reduce((acc, p) => acc + (p.approved_budget || p.estimated_value || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 rounded-md text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              GFR 2017 Special Innovation Procurement Pipeline
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Scale Procurement Kanban & Rate Contracts
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Track successful verified pilots transitioning directly into multi-year government scale contracts
              under Rule 194 innovation exemption procedures.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 p-3 rounded-xl border border-white/10 shrink-0">
            <div>
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Committed Scale Value</span>
              <span className="text-xl font-extrabold text-emerald-400">{formatINR(totalProcValue)}</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div>
              <span className="text-[10px] text-slate-300 uppercase font-bold block">Awarded Contracts</span>
              <span className="text-xl font-extrabold text-white">{contracts.length} Executed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Procurement Kanban Columns */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {stages.map((stg) => {
            const stageProcurements = procurements.filter((p) => p.current_stage === stg.key);

            return (
              <div key={stg.key} className="bg-slate-50/80 rounded-xl border border-slate-200 p-3 flex flex-col min-w-[220px]">
                {/* Stage Header */}
                <div className="pb-2.5 border-b border-slate-200 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 leading-tight">{stg.label}</span>
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                      {stageProcurements.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{stg.desc}</span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1">
                  {stageProcurements.map((proc) => (
                    <div
                      key={proc.id}
                      className="bg-white rounded-lg border border-slate-200 hover:border-indigo-400 p-3 shadow-xs hover:shadow-md transition-all text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-mono font-bold text-indigo-700">{proc.problem_code}</span>
                          <span>{proc.department_code}</span>
                        </div>

                        <h4
                          onClick={() => loadProcurementDetails(proc.id)}
                          className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer leading-snug"
                        >
                          {proc.title}
                        </h4>

                        <div className="text-[11px] text-slate-600 mt-1">
                          Startup: <strong className="text-slate-800">{proc.company_name}</strong>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Sanctioned</span>
                          <span className="font-extrabold text-slate-900">{formatINR(proc.approved_budget)}</span>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => loadProcurementDetails(proc.id)}
                          className="text-[10px] text-slate-500 hover:text-indigo-600 font-medium"
                        >
                          Details
                        </button>

                        <div className="flex items-center gap-1">
                          {proc.current_stage === 'CONTRACT' && !proc.contract_number && (
                            <button
                              onClick={() => {
                                setContractModalProc(proc);
                                setContractVal(proc.approved_budget.toString());
                              }}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                            >
                              Sign Contract
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setStageModalProc(proc);
                              // default next stage
                              const curIdx = stages.findIndex((s) => s.key === proc.current_stage);
                              if (curIdx < stages.length - 1) {
                                setTargetStage(stages[curIdx + 1].key);
                              }
                            }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Advance Stage"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Executed Contracts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Signed Public Innovation Contracts</h3>
              <p className="text-xs text-slate-500">Active agreements executing under GFR 2017 Innovation Protocol</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold">
            {contracts.length} Legally Binding Contracts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Contract Code</th>
                <th className="px-4 py-3">Procurement Title</th>
                <th className="px-4 py-3">Awarded Startup</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Value (INR)</th>
                <th className="px-4 py-3">Term Period</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-700">{c.contract_number}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{c.procurement_title || 'Innovation Scale Agreement'}</td>
                  <td className="px-4 py-3 text-slate-700">{c.company_name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.department_name}</td>
                  <td className="px-4 py-3 font-extrabold text-slate-900">{formatINR(c.contract_value)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Procurement Detail Modal */}
      {selectedProcurement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase tracking-wider">
                  {selectedProcurement.current_stage.replace(/_/g, ' ')}
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 mt-1">{selectedProcurement.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Startup: <strong className="text-slate-800">{selectedProcurement.company_name}</strong> · Sanctioned: {formatINR(selectedProcurement.approved_budget)}
                </p>
              </div>
              <button onClick={() => setSelectedProcurement(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Procurement Officer</span>
                  <span className="font-bold text-slate-900">{selectedProcurement.procurement_officer_name || 'Sunita Krishnan'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Target Completion Date</span>
                  <span className="font-bold text-slate-900">{new Date(selectedProcurement.target_completion_date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Event History */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                  Stage Transition Audit Trail
                </h4>
                <div className="space-y-2">
                  {selectedProcurement.events?.map((ev) => (
                    <div key={ev.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {ev.from_stage} → <span className="text-indigo-600">{ev.to_stage}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{ev.notes}</p>
                        <div className="text-slate-400 text-[10px] mt-1">
                          By {ev.actor_name || 'Procurement Controller'}
                        </div>
                      </div>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(ev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedProcurement(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Stage Modal */}
      {stageModalProc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="font-bold text-base text-slate-900 mb-1">Advance Procurement Stage</h3>
            <p className="text-slate-500 mb-4">{stageModalProc.title}</p>

            <form onSubmit={handleAdvanceStage} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Next Target Stage *</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as ProcurementStage)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                >
                  {stages.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label} ({s.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Committee Notes / Regulatory Justification</label>
                <textarea
                  rows={3}
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder="Record justification, committee approval reference, or GFR Rule 194 exemption remarks..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStageModalProc(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStage}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isUpdatingStage ? 'Advancing...' : 'Confirm Transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Sign Modal */}
      {contractModalProc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <h3 className="font-bold text-base text-slate-900 mb-1">Sign & Execute Scale Contract</h3>
            <p className="text-slate-500 mb-4">{contractModalProc.title}</p>

            <form onSubmit={handleCreateContract} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contract Number Code</label>
                <input
                  type="text"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="e.g. GOI-MOHUA-2026-904"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contract Value (INR) *</label>
                <input
                  type="number"
                  required
                  value={contractVal}
                  onChange={(e) => setContractVal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contract Terms & SLA Framework</label>
                <textarea
                  rows={3}
                  value={contractTerms}
                  onChange={(e) => setContractTerms(e.target.value)}
                  placeholder="Multi-year deployment milestones, 99.8% uptime SLA, C-DAC security audit..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContractModalProc(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingContract}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isCreatingContract ? 'Signing...' : 'Sign & Award Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
