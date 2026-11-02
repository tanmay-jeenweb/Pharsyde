import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { 
  getOfficeUserByIdApi, 
  createOfficeUserApi, 
  updateOfficeUserApi, 
  getOfficeUserTypesApi 
} from '../../services/officeApi';

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id: routeId } = useParams();
  const userId = routeId || searchParams.get('id');
  const isEditMode = Boolean(userId);

  const [userTypes, setUserTypes] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    user_type_id: '',
    mob_no: '',
    date_of_birth: '',
    date_of_join: new Date().toISOString().split('T')[0],
    active: true,
  });

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const initPage = async () => {
      try {
        const typesRes = await getOfficeUserTypesApi();
        const typesList = typesRes.data || [];
        setUserTypes(typesList);

        if (isEditMode) {
          setLoading(true);
          const userRes = await getOfficeUserByIdApi(userId);
          const u = userRes.user;
          if (u) {
            setForm({
              name: u.name || '',
              username: u.username || '',
              email: u.email || '',
              password: '',
              user_type_id: u.user_type_id ? String(u.user_type_id) : (typesList[0]?.id ? String(typesList[0].id) : ''),
              mob_no: u.mob_no || '',
              date_of_birth: u.date_of_birth ? u.date_of_birth.split('T')[0] : '',
              date_of_join: u.date_of_join ? u.date_of_join.split('T')[0] : '',
              active: u.active !== false && u.active !== 0,
            });
          }
        } else if (typesList.length > 0) {
          setForm((prev) => ({
            ...prev,
            user_type_id: String(typesList[0].id),
          }));
        }
      } catch (err) {
        console.error(err);
        notify(err.message || 'Failed to initialize page', 'error');
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [userId, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.email.trim()) {
      notify('Please fill out all required fields.', 'error');
      return;
    }
    if (!isEditMode && !form.password) {
      notify('Password is required for new accounts.', 'error');
      return;
    }

    setSaving(true);
    try {
      const selectedType = userTypes.find((t) => String(t.id) === String(form.user_type_id));
      const payload = {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        user_type_id: form.user_type_id ? Number(form.user_type_id) : null,
        user_type: selectedType?.type_name || 'Staff',
        mob_no: form.mob_no.trim() || null,
        date_of_birth: form.date_of_birth || null,
        date_of_join: form.date_of_join || null,
        active: !!form.active,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (isEditMode) {
        await updateOfficeUserApi(userId, payload);
        notify('User updated successfully.');
      } else {
        await createOfficeUserApi(payload);
        notify('User created successfully.');
      }

      setTimeout(() => {
        navigate('/office/user-master');
      }, 700);
    } catch (err) {
      notify(err.message || 'Failed to save user', 'error');
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
            {isEditMode ? 'Edit User' : 'Create New User'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEditMode
              ? 'Update user profile details and role assignment.'
              : 'Add a new administrative or backoffice user to the system.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/office/user-master')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#064e3b] hover:text-[#047857] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to User Master
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
              User Profile & Authentication Details
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fill out account identity, credentials, and access role configuration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="e.g. jdoe"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent font-mono transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. jdoe@pharsyde.com"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Password {isEditMode ? <span className="text-slate-400 font-normal lowercase">(leave blank to keep current)</span> : <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  required={!isEditMode}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={isEditMode ? '••••••••' : 'Enter account password'}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* User Type / Group */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  User Type (Role Group) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.user_type_id}
                  onChange={(e) => setForm({ ...form, user_type_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all cursor-pointer font-semibold text-slate-800"
                >
                  <option value="">Select User Type</option>
                  {userTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.type_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={form.mob_no}
                  onChange={(e) => setForm({ ...form, mob_no: e.target.value })}
                  placeholder="e.g. +1 555-0199"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

              {/* Date of Join */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Date of Join
                </label>
                <input
                  type="date"
                  value={form.date_of_join}
                  onChange={(e) => setForm({ ...form, date_of_join: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#047857] focus:border-transparent transition-all"
                />
              </div>

            </div>

            {/* Active Switch */}
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="accent-[#064e3b] w-4 h-4 rounded cursor-pointer"
                />
                <span>Active Account (User can sign in to Office suite)</span>
              </label>
            </div>

            {/* Form Footer Buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/office/user-master')}
                className="px-6 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#047857] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create User Account'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}

