import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../../components/DataTable';
import { getActivityLogsApi } from '../../services/officeApi';

const MASTERS_MAP = {
  all: 'All Masters',
  office_auth: 'Office Auth',
  user_master: 'User Master',
  user_type_master: 'User Type Master',
  product_master: 'Product Master',
  product_image_master: 'Product Image Master',
};

const CHANGE_TYPES = ['all', 'LOGIN', 'CREATED', 'UPDATED', 'ACTIVATED', 'DEACTIVATED', 'DELETED', 'SYNC'];

const getActionBadgeClass = (type) => {
  const t = (type || '').toUpperCase();
  switch (t) {
    case 'LOGIN':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'CREATED':
    case 'ACTIVATED':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'UPDATED':
    case 'SYNC':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'DELETED':
    case 'DEACTIVATED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export default function ActivityReport() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaster, setSelectedMaster] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modal State for inspecting JSON diff (ERP format)
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getActivityLogsApi({
        masterName: selectedMaster,
        changeType: selectedType,
        limit: 200,
      });
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedMaster, selectedType]);

  const openLogDetails = (log) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const columns = useMemo(() => [
    {
      key: 'created_at',
      label: 'Date & Time',
      minWidth: '160px',
      render: (row) => {
        const d = new Date(row.created_at);
        return (
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-slate-900">{d.toLocaleDateString()}</span>
            <span className="text-slate-400 font-mono">{d.toLocaleTimeString()}</span>
          </div>
        );
      },
    },
    {
      key: 'username',
      label: 'Operator',
      minWidth: '150px',
      render: (row) => (
        <span className="font-bold text-slate-900 text-sm">
          {row.username || 'System'}
        </span>
      ),
    },
    {
      key: 'master_name',
      label: 'Target Master',
      minWidth: '160px',
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#064e3b] border border-emerald-200">
          {MASTERS_MAP[row.master_name] || row.master_name}
        </span>
      ),
    },
    {
      key: 'change_type',
      label: 'Action Type',
      minWidth: '120px',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getActionBadgeClass(row.change_type)}`}>
          {row.change_type}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Audit Details',
      sortable: false,
      minWidth: '120px',
      render: (row) => (
        <button
          type="button"
          onClick={() => openLogDetails(row)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bcccdc] bg-[#f0f4f8] text-[#064e3b] hover:bg-[#e6ebf0] text-xs font-bold transition-colors cursor-pointer"
          title="Inspect Activity Diff"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span>Inspect</span>
        </button>
      ),
    },
  ], []);

  // Format value helper for modal inspector
  const renderLogPayload = (val) => {
    if (!val) return <span className="text-slate-400 italic text-xs">—</span>;
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return (
          <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      } catch {
        return <span className="text-xs font-mono text-slate-700">{val}</span>;
      }
    }
    return (
      <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans">
      
      {/* Main DataTable (Exact ERP Format) */}
      <DataTable
        tableId="activity_report"
        title="Activity Report"
        data={logs}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search logs by operator, master, or keywords..."
        toggleActions={
          <div className="flex items-center gap-3">
            {/* Target Master Filter */}
            <select
              value={selectedMaster}
              onChange={(e) => setSelectedMaster(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#047857] cursor-pointer"
            >
              {Object.entries(MASTERS_MAP).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Action Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-8 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#047857] cursor-pointer"
            >
              {CHANGE_TYPES.map((t) => (
                <option key={t} value={t}>{t === 'all' ? 'All Actions' : t}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Activity Log Detail Modal (ERP Format) */}
      {modalOpen && selectedLog && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[18px] w-full max-w-[750px] mx-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-[#064e3b] to-[#047857]">
              <div className="flex-1">
                <h2 className="m-0 text-lg font-bold text-white tracking-wide">Activity Log Detail</h2>
                <p className="mt-1 text-[13px] text-emerald-100">
                  {MASTERS_MAP[selectedLog.master_name] || selectedLog.master_name} —{' '}
                  <span className="font-semibold">{selectedLog.change_type}</span> by{' '}
                  <span className="font-semibold">{selectedLog.username || 'System'}</span>
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="bg-white/15 border-none rounded-lg w-[34px] h-[34px] cursor-pointer flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Log ID</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Timestamp</span>
                  <span className="text-slate-700 text-xs">{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Record ID</span>
                  <span className="font-mono text-slate-700">{selectedLog.record_id || '—'}</span>
                </div>
              </div>

              {/* Payload Diffs */}
              {selectedLog.old_values && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Before Mutation (Previous State)
                  </h4>
                  {renderLogPayload(selectedLog.old_values)}
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    After Mutation (Captured State)
                  </h4>
                  {renderLogPayload(selectedLog.new_values)}
                </div>
              )}

              {!selectedLog.old_values && !selectedLog.new_values && (
                <div className="p-8 text-center text-slate-400 italic">
                  No additional state payload captured for this log entry.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold text-xs transition-colors cursor-pointer"
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
