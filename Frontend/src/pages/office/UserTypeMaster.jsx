import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { 
  getOfficeUserTypesApi, 
  deleteOfficeUserTypeApi 
} from '../../services/officeApi';

const MASTERS_CONFIG = [
  { 
    key: 'user_master', 
    label: 'User Master',
    allowedPerms: ['can_read', 'can_write', 'can_update', 'can_delete']
  },
  { 
    key: 'user_type_master', 
    label: 'User Type Master',
    allowedPerms: ['can_read', 'can_write', 'can_update', 'can_delete']
  },
  { 
    key: 'product_master', 
    label: 'Product Master',
    allowedPerms: ['can_read', 'can_write', 'can_update', 'can_delete']
  },
  { 
    key: 'product_image_master', 
    label: 'Product Image Master',
    allowedPerms: ['can_read', 'can_update']
  },
  { 
    key: 'activity_report', 
    label: 'Activity Report',
    allowedPerms: ['can_read']
  },
];

const PERMS = ['can_read', 'can_write', 'can_update', 'can_delete'];
const PERM_LABELS = { 
  can_read: 'Read', 
  can_write: 'Write', 
  can_update: 'Update', 
  can_delete: 'Delete' 
};

const PERM_COLORS = {
  can_read:   { bg: '#f0fdf4', border: '#bbf7d0', text: '#064e3b' },
  can_write:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' },
  can_update: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  can_delete: { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239' },
};

const getAllowed = (master) => (master && master.allowedPerms) || ['can_read', 'can_write', 'can_update', 'can_delete'];

// ── PermBadges Component (ERP format) ─────────────────────────────────────────
function PermBadges({ permissions = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const normalized = useMemo(() => {
    return MASTERS_CONFIG.map((m) => {
      const found = (permissions || []).find(
        (p) => (p.master_name || p.masterName) === m.key
      );
      const allowed = getAllowed(m);
      const granted = PERMS.filter((perm) => {
        if (!allowed.includes(perm)) return false;
        const val = found?.[perm] ?? found?.[perm === 'can_read' ? 'canRead' : perm === 'can_write' ? 'canWrite' : perm === 'can_update' ? 'canUpdate' : 'canDelete'];
        return !!val;
      });
      return { masterKey: m.key, label: m.label, granted };
    }).filter((item) => item.granted.length > 0);
  }, [permissions]);

  if (normalized.length === 0) {
    return <span className="text-slate-400 italic text-xs">No permissions granted</span>;
  }

  const displayedRows = isExpanded ? normalized : normalized.slice(0, 2);
  const hiddenCount = normalized.length - 2;

  return (
    <div className="flex flex-col gap-1.5 py-1">
      {displayedRows.map(({ masterKey, label, granted }) => (
        <div key={masterKey} className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 whitespace-nowrap">
            {label}
          </span>
          <span className="text-slate-300 text-[10px]">→</span>
          {granted.map((perm) => {
            const c = PERM_COLORS[perm];
            return (
              <span
                key={perm}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: c.bg,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                }}
              >
                {PERM_LABELS[perm]}
              </span>
            );
          })}
        </div>
      ))}

      {hiddenCount > 0 && !isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="text-[11px] font-semibold text-[#064e3b] hover:text-[#047857] text-left cursor-pointer mt-0.5"
        >
          + {hiddenCount} more masters
        </button>
      )}

      {isExpanded && normalized.length > 2 && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 text-left cursor-pointer mt-0.5"
        >
          Show less
        </button>
      )}
    </div>
  );
}

// ── Main UserTypeMaster Page ──────────────────────────────────────────────────
export default function UserTypeMaster() {
  const navigate = useNavigate();
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUserTypes = async () => {
    try {
      setLoading(true);
      const res = await getOfficeUserTypesApi();
      setUserTypes(res.data || []);
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to load user types', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTypes();
  }, []);

  const handleDelete = async (ut) => {
    if (ut.type_name === 'Admin') {
      alert('The core Admin role cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user group "${ut.type_name}"?`)) return;

    try {
      await deleteOfficeUserTypeApi(ut.id);
      notify(`User group "${ut.type_name}" deleted.`);
      await fetchUserTypes();
    } catch (err) {
      notify(err.message || 'Failed to delete user group', 'error');
    }
  };

  // Columns definition matching ERP's UserGroupMaster
  const columns = useMemo(() => [
    {
      key: 'id',
      label: 'ID',
      minWidth: '60px',
      render: (row) => <span className="text-slate-500 font-mono text-xs">{row.id}</span>,
    },
    {
      key: 'type_name',
      label: 'User Group',
      minWidth: '180px',
      render: (row) => (
        <div>
          <span className="font-bold text-[#064e3b] text-sm block">
            {row.type_name}
          </span>
          {row.description && (
            <span className="text-xs text-slate-400 block mt-0.5">
              {row.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      sortable: false,
      minWidth: '320px',
      render: (row) => <PermBadges permissions={row.permissions} />,
    },
    {
      key: 'user_count',
      label: 'Users',
      minWidth: '90px',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {row.user_count || 0}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      minWidth: '120px',
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* Edit Button (Navigates to Full Page Form) */}
          <button
            onClick={() => navigate(`/office/user-type-master/create?id=${row.id}`)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bcccdc] bg-[#f0f4f8] text-[#064e3b] hover:bg-[#e6ebf0] transition-colors cursor-pointer"
            title="Edit User Group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Z" />
            </svg>
          </button>

          {/* Delete Button (ERP Format) */}
          {row.type_name !== 'Admin' && (
            <button
              onClick={() => handleDelete(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Delete User Group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12m-1.5 0-.563 12.375A2.25 2.25 0 0113.693 21H10.307a2.25 2.25 0 01-2.244-2.125L7.5 7.5m3-3h3A1.5 1.5 0 0115 6v1.5H9V6a1.5 1.5 0 011.5-1.5Z" />
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans">
      
      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          <span>{notification.msg}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main DataTable (Exact ERP Format) */}
      <DataTable
        tableId="user_group_master"
        title="User Type Master"
        data={userTypes}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search user groups..."
        actionButton={
          <button
            onClick={() => navigate('/office/user-type-master/create')}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#064e3b] text-white hover:bg-[#047857] transition-colors cursor-pointer shadow-sm hover:shadow"
            title="Create User Group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        }
      />

    </div>
  );
}
