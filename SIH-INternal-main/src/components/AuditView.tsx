import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  FileText,
  ChevronRight,
  X,
} from 'lucide-react';
import { AuditLog } from '../types';
import { api } from '../api';

export function AuditView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const actionTypes = [
    'ALL',
    'CREATE_PROBLEM',
    'SHORTLIST_APPLICATION',
    'CREATE_PILOT',
    'UPDATE_PILOT_STAGE',
    'CREATE_CONTRACT',
    'LOGIN',
  ];

  const filteredLogs = logs.filter((log) => {
    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    const matchesSearch =
      !search ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase()) ||
      (log.user_email && log.user_email.toLowerCase().includes(search.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Audit Trail & Governance Ledger
            </h1>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
              {logs.length} Immutable Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete auditability for public tenders, evaluations, approvals, and contract executions.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, actor, or entity..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Action Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {actionTypes.map((act) => (
            <button
              key={act}
              onClick={() => setSelectedAction(act)}
              className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                selectedAction === act
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {act === 'ALL' ? 'All Events' : act.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Audit Events</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Actor / Officer</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-semibold">{log.entity}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {log.user_email || 'System Daemon'}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{log.ip_address}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      View JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Metadata Drawer/Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Event Metadata Inspector</h3>
                <p className="text-slate-400 font-mono text-[10px]">{selectedLog.id}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Action:</span>
                <span className="font-bold text-slate-900">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Entity:</span>
                <span className="font-bold text-slate-900">{selectedLog.entity} ({selectedLog.entity_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Actor:</span>
                <span className="font-bold text-slate-900">{selectedLog.user_email || 'System'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-700">{selectedLog.created_at}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Payload Metadata</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-[11px] overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold text-xs"
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
