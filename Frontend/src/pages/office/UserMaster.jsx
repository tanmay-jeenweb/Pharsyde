import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { 
  getOfficeUsersApi, 
  toggleOfficeUserActiveApi, 
  deleteOfficeUserApi, 
  getOfficeUserTypesApi,
  syncOfficeTechPOSUsersApi,
} from '../../services/officeApi';

export default function UserMaster() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 7000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, typesRes] = await Promise.all([
        getOfficeUsersApi({ showInactive }),
        getOfficeUserTypesApi(),
      ]);
      setUsers(usersRes.users || []);
      setUserTypes(typesRes.data || []);
    } catch (err) {
      console.error(err);
      notify(err.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [showInactive]);

  const handleToggleActive = async (user) => {
    const newState = !user.active;
    const actionLabel = newState ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionLabel} user "${user.name}"?`)) return;

    try {
      await toggleOfficeUserActiveApi(user.id, newState);
      notify(`User "${user.name}" ${actionLabel}d successfully.`);
      await fetchData();
    } catch (err) {
      notify(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete user "${user.name}"?`)) return;

    try {
      await deleteOfficeUserApi(user.id);
      notify(`User "${user.name}" deleted.`);
      await fetchData();
    } catch (err) {
      notify(err.message || 'Failed to delete user', 'error');
    }
  };

  const handleSyncTechPOS = async () => {
    if (syncing) return;
    try {
      setSyncing(true);
      notify('Connecting to TechPOS and synchronizing members...', 'info');
      const res = await syncOfficeTechPOSUsersApi();
      const stats = res.stats || {};
      
      if (stats.errors && stats.errors.length > 0) {
        notify(
          `Sync: ${stats.fetchedFromTechPOS || 0} fetched, ${stats.importedFromTechPOS || 0} imported, ${stats.updatedFromTechPOS || 0} updated. Note: ${stats.errors[0]}`,
          'error'
        );
      } else {
        notify(
          `TechPOS Sync Complete: ${stats.fetchedFromTechPOS || 0} fetched, ${stats.importedFromTechPOS || 0} imported, ${stats.updatedFromTechPOS || 0} updated, ${stats.pushedToTechPOS || 0} linked/synced!`,
          'success'
        );
      }
      await fetchData();
    } catch (err) {
      console.error('TechPOS user sync failed:', err);
      notify(err.message || 'TechPOS synchronization failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Format exactly matching ERP's AdminDashboard user columns with TechPOS integrations
  const userColumns = useMemo(() => [
    {
      key: 'name',
      label: 'Full Name',
      minWidth: '160px',
      render: (row) => (
        <div>
          <span className="text-sm font-semibold text-slate-900 block">
            {row.name || [row.first_name, row.last_name].filter(Boolean).join(' ') || '—'}
          </span>
          {row.user_type === 'Customer' && (
            <span className="text-[10px] text-slate-400 font-mono">Store Customer</span>
          )}
        </div>
      ),
    },
    {
      key: 'username',
      label: 'Username',
      minWidth: '120px',
      render: (row) => (
        <span className="text-sm text-slate-600 font-mono">
          {row.username || '—'}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      minWidth: '180px',
      render: (row) => (
        <span className="text-sm text-slate-600 font-mono">
          {row.email || '—'}
        </span>
      ),
    },
    {
      key: 'techpos_member_id',
      label: 'TechPOS Member ID',
      minWidth: '150px',
      render: (row) => {
        if (row.user_type !== 'Customer' && row.role !== 'user') {
          return <span className="text-xs text-slate-400 font-medium">—</span>;
        }
        return row.techpos_member_id ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 text-blue-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            #{row.techpos_member_id}
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">Unlinked</span>
        );
      },
    },
    {
      key: 'reward_points',
      label: 'Reward Points',
      minWidth: '120px',
      render: (row) => {
        if (row.user_type !== 'Customer' && row.role !== 'user') {
          return <span className="text-xs text-slate-400 font-medium">—</span>;
        }
        const pts = Number(row.reward_points) || 0;
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-bold ${pts > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
            <span>⭐ {pts} pts</span>
          </span>
        );
      },
    },
    {
      key: 'reward_points_dollar_value',
      label: 'Reward Value ($ CAD)',
      minWidth: '145px',
      render: (row) => {
        if (row.user_type !== 'Customer' && row.role !== 'user') {
          return <span className="text-xs text-slate-400 font-medium">—</span>;
        }
        const pts = Number(row.reward_points) || 0;
        const storedVal = Number(row.reward_points_dollar_value) || 0;
        const val = storedVal > 0 ? storedVal : (pts > 0 ? pts * 1.00 : 0);
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${
            val > 0 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'text-slate-400'
          }`}>
            <span>💵</span>
            <span>${val.toFixed(2)} CAD</span>
          </span>
        );
      },
    },
    {
      key: 'password_set',
      label: 'Online Access',
      minWidth: '120px',
      render: (row) => {
        if (row.user_type !== 'Customer' && row.role !== 'user') {
          return <span className="text-xs text-slate-400 font-medium">—</span>;
        }
        return row.password_set ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Web
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200" title="In-store customer, hasn't set web password yet">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> In-Store Only
          </span>
        );
      },
    },
    {
      key: 'user_type',
      label: 'User Type',
      minWidth: '120px',
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
          row.user_type === 'Customer'
            ? 'bg-sky-50 text-sky-800 border-sky-200'
            : row.role === 'admin' || row.user_type === 'Admin'
            ? 'bg-purple-50 text-purple-800 border-purple-200'
            : 'bg-emerald-50 text-[#064e3b] border-emerald-200'
        }`}>
          {row.user_group_name || row.user_type || 'Staff'}
        </span>
      ),
    },
    {
      key: 'mob_no',
      label: 'Mobile',
      minWidth: '120px',
      render: (row) => <span className="text-sm text-slate-600">{row.mob_no || '—'}</span>,
    },
    {
      key: 'date_of_birth',
      label: 'Date of Birth',
      minWidth: '120px',
      render: (row) => {
        if (!row.date_of_birth) return <span className="text-sm text-slate-400 italic">—</span>;
        const date = new Date(row.date_of_birth);
        if (isNaN(date.getTime())) return <span className="text-sm text-slate-400 italic">—</span>;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return <span className="text-sm text-slate-600">{`${day}/${month}/${year}`}</span>;
      },
    },
    {
      key: 'techpos_sync_status',
      label: 'Sync Status',
      minWidth: '110px',
      render: (row) => {
        if (row.user_type !== 'Customer' && row.role !== 'user') {
          return <span className="text-xs text-slate-400 font-medium">—</span>;
        }
        if (row.techpos_sync_status === 'synced' || row.techpos_member_id) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
            </span>
          );
        }
        if (row.techpos_sync_status === 'failed') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Failed
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Pending
          </span>
        );
      },
    },
    {
      key: 'active',
      label: 'Status',
      minWidth: '100px',
      render: (row) =>
        row.active ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Deactivated
          </span>
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      minWidth: '130px',
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* Edit User Button */}
          <button
            onClick={() => navigate(`/office/user-master/create?id=${row.id}`)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#bcccdc] bg-[#f0f4f8] text-[#064e3b] hover:bg-[#e6ebf0] transition-colors cursor-pointer"
            title="Edit User"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931Z" />
            </svg>
          </button>

          {/* Toggle Active / Deactivate Button */}
          <button
            onClick={() => handleToggleActive(row)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
              row.active
                ? 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
            title={row.active ? 'Deactivate User' : 'Activate User'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
            </svg>
          </button>

          {/* Delete User Button */}
          <button
            onClick={() => handleDeleteUser(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
            title="Delete User"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h12m-1.5 0-.563 12.375A2.25 2.25 0 0113.693 21H10.307a2.25 2.25 0 01-2.244-2.125L7.5 7.5m3-3h3A1.5 1.5 0 0115 6v1.5H9V6a1.5 1.5 0 011.5-1.5Z" />
            </svg>
          </button>
        </div>
      ),
    },
  ], [userTypes]);

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans">
      
      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-xs ${
            notification.type === 'error'
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : notification.type === 'info'
              ? 'bg-blue-50 text-blue-900 border border-blue-200'
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

      {/* Main DataTable (ERP Format) */}
      <DataTable
        tableId="admin_user_master_v2"
        title="User Master"
        data={users}
        columns={userColumns}
        loading={loading}
        searchPlaceholder="Search users by name, email, or TechPOS ID..."
        toggleActions={
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600 select-none">
            <div
              onClick={() => setShowInactive((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                showInactive ? 'bg-amber-400' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  showInactive ? 'translate-x-4' : ''
                }`}
              />
            </div>
            Show Deactivated
          </label>
        }
        actionButton={
          <div className="flex items-center gap-2.5">
            {/* Sync TechPOS Members Button */}
            <button
              onClick={handleSyncTechPOS}
              disabled={syncing}
              className={`flex items-center gap-2 px-3.5 h-10 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                syncing
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
              title="Synchronize customers with TechPOS members"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={2} 
                stroke="currentColor" 
                className={`w-4 h-4 ${syncing ? 'animate-spin text-emerald-600' : 'text-slate-600'}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span>{syncing ? 'Syncing...' : 'Sync TechPOS'}</span>
            </button>

            {/* Create User Button */}
            <button
              onClick={() => navigate('/office/user-master/create')}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#064e3b] text-white hover:bg-[#047857] transition-colors cursor-pointer shadow-sm hover:shadow"
              title="Create User"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        }
      />

    </div>
  );
}
