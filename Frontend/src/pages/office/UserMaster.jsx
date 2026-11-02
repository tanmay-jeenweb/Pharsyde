import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { 
  getOfficeUsersApi, 
  toggleOfficeUserActiveApi, 
  deleteOfficeUserApi, 
  getOfficeUserTypesApi 
} from '../../services/officeApi';

export default function UserMaster() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
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

  // Format exactly matching ERP's AdminDashboard user columns
  const userColumns = useMemo(() => [
    {
      key: 'name',
      label: 'Full Name',
      minWidth: '160px',
      render: (row) => (
        <span className="text-sm font-semibold text-slate-900">
          {row.name || '—'}
        </span>
      ),
    },
    {
      key: 'username',
      label: 'Username',
      minWidth: '130px',
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
      key: 'user_type',
      label: 'User Type',
      minWidth: '130px',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#064e3b] border border-emerald-200">
          {row.user_group_name || row.user_type || '—'}
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
      key: 'date_of_join',
      label: 'Date of Join',
      minWidth: '120px',
      render: (row) => {
        if (!row.date_of_join) return <span className="text-sm text-slate-400 italic">—</span>;
        const date = new Date(row.date_of_join);
        if (isNaN(date.getTime())) return <span className="text-sm text-slate-400 italic">—</span>;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return <span className="text-sm text-slate-600">{`${day}/${month}/${year}`}</span>;
      },
    },
    {
      key: 'active',
      label: 'Status',
      minWidth: '110px',
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
          {/* Edit User Button (Navigates to Full Page Form) */}
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
        tableId="admin_user_master"
        title="User Master"
        data={users}
        columns={userColumns}
        loading={loading}
        searchPlaceholder="Search users by name or email..."
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
          <button
            onClick={() => navigate('/office/user-master/create')}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#064e3b] text-white hover:bg-[#047857] transition-colors cursor-pointer shadow-sm hover:shadow"
            title="Create User"
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
