import { useState, useEffect } from 'react';
import {
  Cpu,
  Search,
  Filter,
  ExternalLink,
  Award,
  Building2,
  Users,
  IndianRupee,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  X,
  Globe,
  Mail,
  Phone,
  FileText,
} from 'lucide-react';
import { Startup } from '../types';
import { api } from '../api';

interface StartupsViewProps {
  initialStartupId?: string | null;
  onInviteToChallenge?: (startupId: string) => void;
}

export function StartupsView({ initialStartupId }: StartupsViewProps) {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);

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

  const stages = ['ALL', 'Seed Funded', 'Pre-Series A', 'Series A', 'Growth', 'Bootstrapped'];

  const fetchStartups = async () => {
    try {
      setLoading(true);
      const res = await api.getStartups({
        search: search || undefined,
        sector: selectedSector !== 'ALL' ? selectedSector : undefined,
        stage: selectedStage !== 'ALL' ? selectedStage : undefined,
      });
      setStartups(res.startups);

      if (initialStartupId) {
        const found = res.startups.find((s) => s.id === initialStartupId);
        if (found) {
          loadStartupDetails(found.id);
        }
      }
    } catch (err) {
      console.error('Failed to load startups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, [search, selectedSector, selectedStage]);

  const loadStartupDetails = async (id: string) => {
    try {
      const res = await api.getStartupById(id);
      setSelectedStartup(res.startup);
    } catch (err) {
      console.error('Failed to fetch startup profile:', err);
    }
  };

  const handleStartupDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedStartup || !event.target.files?.length) return;

    try {
      setUploadingDocs(true);
      const uploaded = await api.uploadStartupDocuments(selectedStartup.id, Array.from(event.target.files));
      const nextDocs = uploaded.documents || [];
      setSelectedStartup((prev) =>
        prev
          ? {
              ...prev,
              documents: [...(prev.documents || []), ...nextDocs],
            }
          : prev
      );
      alert('Startup documents uploaded successfully.');
      event.target.value = '';
    } catch (err: any) {
      alert('Failed to upload startup document: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingDocs(false);
    }
  };

  const formatINR = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(1)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Verified High-Tech Startup Ecosystem
            </h1>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
              {startups.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            DPIIT-recognized deep-tech enterprises with evaluated certifications (STQC, C-DAC, ABDM, BIS).
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name, technology, or keywords..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Sector Filter */}
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

        {/* Stage Filter */}
        <select
          value={selectedStage}
          onChange={(e) => setSelectedStage(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium outline-none"
        >
          {stages.map((st) => (
            <option key={st} value={st}>
              {st === 'ALL' ? 'All Funding Stages' : st}
            </option>
          ))}
        </select>
      </div>

      {/* Startup Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : startups.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Startups Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {startups.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3
                      onClick={() => loadStartupDetails(st.id)}
                      className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {st.company_name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{st.location}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full">
                    {st.stage}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-2">
                  {st.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {st.technologies?.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-1.5 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-medium rounded border border-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                  {(st.technologies?.length || 0) > 3 && (
                    <span className="px-1 py-0.5 text-slate-400 text-[10px]">
                      +{(st.technologies?.length || 0) - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Row */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Team</span>
                    <span className="font-semibold text-slate-800">{st.team_size}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Funding</span>
                    <span className="font-semibold text-slate-800">{formatINR(st.funding_total)}</span>
                  </div>
                  {st.previous_gov_experience && (
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded">
                      Gov Proven
                    </span>
                  )}
                </div>

                <button
                  onClick={() => loadStartupDetails(st.id)}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 font-semibold text-xs"
                >
                  Profile <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Startup Profile Modal */}
      {selectedStartup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                    {selectedStartup.stage}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">CIN: {selectedStartup.registration_number}</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">{selectedStartup.company_name}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedStartup.location}
                  </span>
                  <span>Founded: {selectedStartup.founded_year}</span>
                  <span>Team: {selectedStartup.team_size} members</span>
                  <span>Total Capital: {formatINR(selectedStartup.funding_total)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStartup(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Pitch Summary */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Public Sector Value Proposition</h4>
                <div className="bg-indigo-50/60 border border-indigo-200/80 p-3.5 rounded-xl text-indigo-950 leading-relaxed font-medium">
                  {selectedStartup.pitch_summary}
                </div>
              </div>

              {/* Core Description */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Company Overview</h4>
                <p className="text-slate-600 leading-relaxed">{selectedStartup.description}</p>
              </div>

              {/* Technologies & Sectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-bold text-slate-800 text-xs mb-2">Technologies & Architecture</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStartup.technologies?.map((tech) => (
                      <span key={tech} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-slate-800 text-xs mb-2">Industry Sectors</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStartup.sectors?.map((sec) => (
                      <span key={sec} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px] font-medium">
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Past Government Experience */}
              {selectedStartup.projects && selectedStartup.projects.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Past Government Deployments & Case Studies
                  </h4>
                  <div className="space-y-2">
                    {selectedStartup.projects.map((proj, i) => (
                      <div key={proj.id || i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{proj.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{proj.year}</span>
                        </div>
                        <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                          Client: {proj.client}
                        </div>
                        <p className="text-slate-600 text-[11px] mt-1">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications & Compliance */}
              {selectedStartup.certifications && selectedStartup.certifications.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Government Certifications & Security Audits
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedStartup.certifications.map((cert, i) => (
                      <div key={cert.id || i} className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{cert.name}</div>
                          <div className="text-[10px] text-slate-500">Issued by {cert.issuing_body} ({cert.year})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Startup ID / Document Uploads */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <h4 className="font-bold text-slate-900 text-sm">Startup ID / Compliance Documents</h4>
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-indigo-700">
                    <input type="file" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleStartupDocUpload} />
                    {uploadingDocs ? 'Uploading...' : 'Upload Docs'}
                  </label>
                </div>

                {selectedStartup.documents && selectedStartup.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedStartup.documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{doc.title}</div>
                            <div className="text-[11px] text-slate-500">{doc.file_type} · {(doc.file_size / 1024).toFixed(1)} KB</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-indigo-700">Open</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
                    No startup identification or compliance documents uploaded yet.
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6 text-slate-500 text-xs">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <a href={selectedStartup.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                    {selectedStartup.website}
                  </a>
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedStartup.contact_email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedStartup.contact_phone}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedStartup(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
