import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { 
  getOfficeUserTypeByIdApi, 
  createOfficeUserTypeApi, 
  updateOfficeUserTypeApi 
} from '../../services/officeApi';

const MASTERS_CONFIG = [
  { 
    key: 'user_master', 
    label: 'User Master', 
    desc: 'Manage user profiles and system accounts',
    allowedPerms: ['can_read', 'can_write', 'can_update', 'can_delete']
  },
  { 
    key: 'user_type_master', 
    label: 'User Type Master', 
    desc: 'Define roles and permission privileges',
    allowedPerms: ['can_read', 'can_write', 'can_update', 'can_delete']
  },
  { 
    key: 'product_master', 
    label: 'Product Master', 
    desc: 'Product catalog, pricing, and stock',
    allowedPerms: ['can_read', 'can_write', 'can_update', 'can_delete']
  },
  { 
    key: 'product_image_master', 
    label: 'Product Image Master', 
    desc: 'TechPOS image repository and synchronization',
    allowedPerms: ['can_read', 'can_update']
  },
  { 
    key: 'activity_report', 
    label: 'Activity Report', 
    desc: 'Audit trail and system logs inspection',
    allowedPerms: ['can_read']
  },
  {
    key: 'form_submissions_master',
    label: 'Form Submissions',
    desc: 'Customer contact inquiries & newsletter subscriptions',
    allowedPerms: ['can_read', 'can_update', 'can_delete']
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
  can_read:   { bg: '#f0fdf4', border: '#bbf7d0', text: '#064e3b', check: '#047857' },
  can_write:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', check: '#2563eb' },
  can_update: { bg: '#fffbeb', border: '#fde68a', text: '#92400e', check: '#d97706' },
  can_delete: { bg: '#fff1f2', border: '#fecdd3', text: '#9f1239', check: '#e11d48' },
};

const getAllowed = (master) => (master && master.allowedPerms) || ['can_read', 'can_write', 'can_update', 'can_delete'];

function CheckCell({ checked, color, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        border: `2px solid ${checked ? color.check : '#cbd5e1'}`,
        background: checked ? color.check : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
        margin: '0 auto',
        boxShadow: checked ? `0 0 0 3px ${color.bg}` : 'none',
      }}
    >
      {checked && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} style={{ width: 13, height: 13 }}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}

export default function CreateUserTypePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams();
  const typeId = routeId || searchParams.get('id');
  const isEditMode = Boolean(typeId);

  const [typeName, setTypeName] = useState('');
  const [description, setDescription] = useState('');
  const [permissionsMap, setPermissionsMap] = useState({});
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const initPermissionsMap = (existingPerms = []) => {
    const map = {};
    for (const m of MASTERS_CONFIG) {
      const found = (existingPerms || []).find(
        (p) => (p.master_name || p.masterName) === m.key
      );
      const allowed = getAllowed(m);
      map[m.key] = {
        can_read: allowed.includes('can_read') && found ? !!(found.can_read || found.canRead) : false,
        can_write: allowed.includes('can_write') && found ? !!(found.can_write || found.canWrite) : false,
        can_update: allowed.includes('can_update') && found ? !!(found.can_update || found.canUpdate) : false,
        can_delete: allowed.includes('can_delete') && found ? !!(found.can_delete || found.canDelete) : false,
      };
    }
    return map;
  };

  useEffect(() => {
    const loadData = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const res = await getOfficeUserTypeByIdApi(typeId);
          const ut = res.data;
          if (ut) {
            setTypeName(ut.type_name || '');
            setDescription(ut.description || '');
            setPermissionsMap(initPermissionsMap(ut.permissions || []));
          }
        } catch (err) {
          notify(err.message || 'Failed to load user type details', 'error');
          navigate('/office/user-type-master');
        } finally {
          setLoading(false);
        }
      } else {
        setPermissionsMap(initPermissionsMap([]));
      }
    };

    loadData();
  }, [typeId, isEditMode]);

  const togglePerm = (masterKey, perm) => {
    const master = MASTERS_CONFIG.find((x) => x.key === masterKey);
    if (!getAllowed(master).includes(perm)) return;

    setPermissionsMap((prev) => ({
      ...prev,
      [masterKey]: {
        ...prev[masterKey],
        [perm]: !prev[masterKey]?.[perm],
      },
    }));
  };

  const toggleRowAll = (masterKey) => {
    const master = MASTERS_CONFIG.find((x) => x.key === masterKey);
    const allowed = getAllowed(master);
    const row = permissionsMap[masterKey] || {};
    const allChecked = allowed.every((p) => row[p]);
    const newVal = !allChecked;

    setPermissionsMap((prev) => {
      const nextRow = { ...prev[masterKey] };
      allowed.forEach((p) => {
        nextRow[p] = newVal;
      });
      return {
        ...prev,
        [masterKey]: nextRow,
      };
    });
  };

  const toggleColumnAll = (perm) => {
    const relevantMasters = MASTERS_CONFIG.filter((m) => getAllowed(m).includes(perm));
    const allChecked = relevantMasters.every((m) => permissionsMap[m.key]?.[perm]);
    const newVal = !allChecked;

    setPermissionsMap((prev) => {
      const next = { ...prev };
      for (const m of relevantMasters) {
        next[m.key] = {
          ...next[m.key],
          [perm]: newVal,
        };
      }
      return next;
    });
  };

  const isRowAll = (masterKey) => {
    const master = MASTERS_CONFIG.find((x) => x.key === masterKey);
    const allowed = getAllowed(master);
    const row = permissionsMap[masterKey] || {};
    return allowed.every((p) => row[p]);
  };

  const isColAll = (perm) => {
    const relevantMasters = MASTERS_CONFIG.filter((m) => getAllowed(m).includes(perm));
    if (relevantMasters.length === 0) return false;
    return relevantMasters.every((m) => permissionsMap[m.key]?.[perm]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!typeName.trim()) {
      notify('User group name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const permissionsList = Object.entries(permissionsMap).map(([masterName, p]) => {
        const master = MASTERS_CONFIG.find((m) => m.key === masterName);
        const allowed = getAllowed(master);
        return {
          masterName,
          canRead: allowed.includes('can_read') && p.can_read ? 1 : 0,
          canWrite: allowed.includes('can_write') && p.can_write ? 1 : 0,
          canUpdate: allowed.includes('can_update') && p.can_update ? 1 : 0,
          canDelete: allowed.includes('can_delete') && p.can_delete ? 1 : 0,
          canApprove: 0,
        };
      });

      const payload = {
        type_name: typeName.trim(),
        description: description.trim(),
        permissions: permissionsList,
      };

      if (isEditMode) {
        await updateOfficeUserTypeApi(typeId, payload);
        notify('User group updated successfully.');
      } else {
        await createOfficeUserTypeApi(payload);
        notify('User group created successfully.');
      }

      setTimeout(() => {
        navigate('/office/user-type-master');
      }, 700);
    } catch (err) {
      notify(err.message || 'Failed to save user group', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans max-w-5xl mx-auto w-full">
      
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

      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit User Group' : 'Create New User Group'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEditMode
              ? 'Modify group details and granular module rights matrix.'
              : 'Configure a new user role and designate permission privileges across backoffice masters.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/office/user-type-master')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#064e3b] hover:text-[#047857] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to User Type Master
        </button>
      </div>

      {/* Main Full Page Form Card */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#064e3b]" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="p-6 bg-slate-50 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">
              User Group Information & Access Rights
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify the role identification and configure only the applicable permissions for each master module.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            
            {/* Identity Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  User Group Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={typeName}
                  onChange={(e) => setTypeName(e.target.value)}
                  placeholder="e.g. Inventory Manager"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent font-semibold transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Warehouse staff with inventory write access"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Granular Permission Matrix Table */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Module Access Matrix
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Check specific action rights enabled for members. Actions marked with "—" are not applicable to that master.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f0f4f8] border-b border-slate-200 text-xs font-bold text-[#064e3b]">
                      <th className="py-3.5 px-4 text-left">Master Module</th>
                      {PERMS.map((perm) => (
                        <th key={perm} className="py-3 px-3 text-center min-w-[95px]">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="uppercase text-[11px] tracking-wider">{PERM_LABELS[perm]}</span>
                            <button
                              type="button"
                              onClick={() => toggleColumnAll(perm)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                                isColAll(perm)
                                  ? 'bg-[#064e3b] text-white shadow-xs'
                                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {isColAll(perm) ? '✓ All' : 'Col All'}
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="py-3.5 px-4 text-center min-w-[90px]">Row All</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {MASTERS_CONFIG.map((m) => {
                      const row = permissionsMap[m.key] || {};
                      const rowAll = isRowAll(m.key);
                      const allowed = getAllowed(m);

                      return (
                        <tr key={m.key} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block text-sm">
                              {m.label}
                            </span>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {m.desc}
                            </span>
                          </td>

                          {PERMS.map((perm) => {
                            const isAllowed = allowed.includes(perm);
                            return (
                              <td key={perm} className="py-3.5 px-3 text-center">
                                {isAllowed ? (
                                  <CheckCell
                                    checked={!!row[perm]}
                                    color={PERM_COLORS[perm]}
                                    onChange={() => togglePerm(m.key, perm)}
                                  />
                                ) : (
                                  <span className="text-slate-300 font-bold text-base select-none" title="Not applicable">—</span>
                                )}
                              </td>
                            );
                          })}

                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleRowAll(m.key)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                                rowAll
                                  ? 'bg-[#064e3b] text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              {rowAll ? '✓ All' : 'All'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Form Footer Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/office/user-type-master')}
                className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#047857] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create User Group'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
