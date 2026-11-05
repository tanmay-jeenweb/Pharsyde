import React, { useState, useEffect } from 'react';
import {
  Mail,
  MessageSquare,
  Users,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  Download,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tag,
  Edit3,
  Send,
  X
} from 'lucide-react';
import {
  getOfficeContactInquiriesApi,
  getOfficeContactInquiryByIdApi,
  updateOfficeContactInquiryStatusApi,
  deleteOfficeContactInquiryApi,
  getOfficeNewsletterSubscribersApi,
  toggleOfficeNewsletterStatusApi,
  deleteOfficeNewsletterSubscriberApi
} from '../../services/officeApi';

export default function FormSubmissionMaster() {
  const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'newsletter'

  // ==========================================
  // Tab 1: Contact Inquiries State
  // ==========================================
  const [inquiries, setInquiries] = useState([]);
  const [inquiryStats, setInquiryStats] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0, spam: 0 });
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('all');
  const [inquiryPage, setInquiryPage] = useState(1);
  const [inquiryTotalPages, setInquiryTotalPages] = useState(1);
  const [inquiryTotalCount, setInquiryTotalCount] = useState(0);

  // Inquiry Detail / Edit Modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // ==========================================
  // Tab 2: Newsletter Subscribers State
  // ==========================================
  const [subscribers, setSubscribers] = useState([]);
  const [newsletterStats, setNewsletterStats] = useState({ total: 0, subscribed: 0, unsubscribed: 0, today: 0 });
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [newsletterSearch, setNewsletterSearch] = useState('');
  const [newsletterStatusFilter, setNewsletterStatusFilter] = useState('all');
  const [newsletterPage, setNewsletterPage] = useState(1);
  const [newsletterTotalPages, setNewsletterTotalPages] = useState(1);
  const [newsletterTotalCount, setNewsletterTotalCount] = useState(0);

  // Common UI State
  const [notification, setNotification] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'inquiry' | 'subscriber', id, label }

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // ==========================================
  // Data Fetching: Inquiries
  // ==========================================
  const fetchInquiries = async () => {
    try {
      setInquiriesLoading(true);
      const res = await getOfficeContactInquiriesApi({
        search: inquirySearch,
        status: inquiryStatusFilter,
        page: inquiryPage,
        limit: 25
      });
      if (res && res.success) {
        setInquiries(res.inquiries || []);
        setInquiryTotalCount(res.total || 0);
        setInquiryTotalPages(res.totalPages || 1);
        if (res.stats) setInquiryStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to fetch contact inquiries:', err);
      notify(err.message || 'Failed to fetch contact inquiries', 'error');
    } finally {
      setInquiriesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inquiries') {
      fetchInquiries();
    }
  }, [inquirySearch, inquiryStatusFilter, inquiryPage, activeTab]);

  // ==========================================
  // Data Fetching: Newsletter Subscribers
  // ==========================================
  const fetchSubscribers = async () => {
    try {
      setSubscribersLoading(true);
      const res = await getOfficeNewsletterSubscribersApi({
        search: newsletterSearch,
        status: newsletterStatusFilter,
        page: newsletterPage,
        limit: 25
      });
      if (res && res.success) {
        setSubscribers(res.subscribers || []);
        setNewsletterTotalCount(res.total || 0);
        setNewsletterTotalPages(res.totalPages || 1);
        if (res.stats) setNewsletterStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to fetch subscribers:', err);
      notify(err.message || 'Failed to fetch newsletter subscribers', 'error');
    } finally {
      setSubscribersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'newsletter') {
      fetchSubscribers();
    }
  }, [newsletterSearch, newsletterStatusFilter, newsletterPage, activeTab]);

  // ==========================================
  // Inquiry Actions
  // ==========================================
  const handleOpenInquiryDetails = async (inquiry) => {
    setSelectedInquiry(inquiry);
    setAdminNotes(inquiry.admin_notes || '');
    setDetailModalOpen(true);

    try {
      setDetailLoading(true);
      const res = await getOfficeContactInquiryByIdApi(inquiry.id);
      if (res && res.success && res.inquiry) {
        setSelectedInquiry(res.inquiry);
        setAdminNotes(res.inquiry.admin_notes || '');
      }
    } catch (err) {
      console.warn('Could not refresh full inquiry details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateInquiryStatus = async (id, newStatus) => {
    try {
      const res = await updateOfficeContactInquiryStatusApi(id, { status: newStatus });
      if (res && res.success) {
        notify(`Inquiry #${id} status changed to ${newStatus}`);
        setInquiries((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
        }
        fetchInquiries();
      }
    } catch (err) {
      notify(err.message || 'Failed to update status', 'error');
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedInquiry) return;
    try {
      setSavingNotes(true);
      const res = await updateOfficeContactInquiryStatusApi(selectedInquiry.id, {
        adminNotes: adminNotes
      });
      if (res && res.success) {
        notify('Internal admin note saved successfully');
        setSelectedInquiry((prev) => ({ ...prev, admin_notes: adminNotes }));
        setInquiries((prev) =>
          prev.map((item) => (item.id === selectedInquiry.id ? { ...item, admin_notes: adminNotes } : item))
        );
      }
    } catch (err) {
      notify(err.message || 'Failed to save admin note', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteInquiry = async (id) => {
    try {
      const res = await deleteOfficeContactInquiryApi(id);
      if (res && res.success) {
        notify('Inquiry deleted successfully');
        setInquiries((prev) => prev.filter((item) => item.id !== id));
        if (selectedInquiry && selectedInquiry.id === id) {
          setDetailModalOpen(false);
          setSelectedInquiry(null);
        }
        setDeleteConfirm(null);
        fetchInquiries();
      }
    } catch (err) {
      notify(err.message || 'Failed to delete inquiry', 'error');
    }
  };

  // ==========================================
  // Newsletter Actions
  // ==========================================
  const handleToggleSubscriberStatus = async (subscriber) => {
    const nextStatus = subscriber.status === 'subscribed' ? 'unsubscribed' : 'subscribed';
    try {
      const res = await toggleOfficeNewsletterStatusApi(subscriber.id, nextStatus);
      if (res && res.success) {
        notify(`Subscriber ${subscriber.email} marked as ${nextStatus}`);
        setSubscribers((prev) =>
          prev.map((s) => (s.id === subscriber.id ? { ...s, status: nextStatus } : s))
        );
        fetchSubscribers();
      }
    } catch (err) {
      notify(err.message || 'Failed to update subscriber status', 'error');
    }
  };

  const handleDeleteSubscriber = async (id) => {
    try {
      const res = await deleteOfficeNewsletterSubscriberApi(id);
      if (res && res.success) {
        notify('Subscriber removed successfully');
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        setDeleteConfirm(null);
        fetchSubscribers();
      }
    } catch (err) {
      notify(err.message || 'Failed to delete subscriber', 'error');
    }
  };

  const handleCopyAllActiveEmails = () => {
    const activeEmails = subscribers
      .filter((s) => s.status === 'subscribed')
      .map((s) => s.email)
      .join(', ');

    if (!activeEmails) {
      notify('No active subscriber emails to copy in current view', 'error');
      return;
    }

    navigator.clipboard.writeText(activeEmails).then(() => {
      notify(`Copied ${subscribers.filter((s) => s.status === 'subscribed').length} active emails to clipboard!`);
    });
  };

  // Export CSV Helper
  const handleExportCSV = (type) => {
    if (type === 'inquiries') {
      if (inquiries.length === 0) {
        notify('No inquiries to export', 'error');
        return;
      }
      const headers = ['ID', 'Date', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Admin Notes'];
      const rows = inquiries.map((i) => [
        i.id,
        new Date(i.created_at).toLocaleString(),
        `"${(i.name || '').replace(/"/g, '""')}"`,
        `"${(i.email || '').replace(/"/g, '""')}"`,
        `"${(i.phone || '').replace(/"/g, '""')}"`,
        `"${(i.subject || '').replace(/"/g, '""')}"`,
        `"${(i.message || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
        i.status,
        `"${(i.admin_notes || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `contact_inquiries_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify('Exported contact inquiries to CSV');
    } else {
      if (subscribers.length === 0) {
        notify('No subscribers to export', 'error');
        return;
      }
      const headers = ['ID', 'Date Subscribed', 'Email', '19+ Consent', 'Status', 'Source', 'IP Address'];
      const rows = subscribers.map((s) => [
        s.id,
        new Date(s.created_at).toLocaleString(),
        `"${(s.email || '').replace(/"/g, '""')}"`,
        s.consent ? 'Verified (19+)' : 'No',
        s.status,
        s.source || 'homepage',
        s.ip_address || ''
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify('Exported newsletter subscribers to CSV');
    }
  };

  // Helper Badge Color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'spam':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'subscribed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'unsubscribed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Page Header Card (Exact ERP Structure matching OrderMaster & UserMaster) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Form Submissions Master
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8EF705]/30 text-slate-900 border border-[#8EF705]">
              Storefront Responses
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review customer contact inquiries, support tickets, and Pharsyde Circle newsletter marketing subscriptions.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={activeTab === 'inquiries' ? fetchInquiries : fetchSubscribers}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Refresh active table"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                (activeTab === 'inquiries' ? inquiriesLoading : subscribersLoading) ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh Records</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportCSV(activeTab)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            title="Export data to CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-[#8EF705]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip (Adapts based on active tab) */}
      {activeTab === 'inquiries' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Inquiries
              </span>
              <div className="text-2xl font-black text-slate-900">{inquiryStats.total}</div>
              <span className="text-xs text-slate-500 font-medium mt-1 block">All customer contact inquiries</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
                New / Unread
              </span>
              <div className="text-2xl font-black text-blue-700">{inquiryStats.new}</div>
              <span className="text-xs text-blue-600 font-semibold mt-1 block">Requires staff attention</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
                In Progress
              </span>
              <div className="text-2xl font-black text-amber-700">{inquiryStats.inProgress}</div>
              <span className="text-xs text-amber-600 font-semibold mt-1 block">Staff currently handling</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                Resolved
              </span>
              <div className="text-2xl font-black text-emerald-700">{inquiryStats.resolved}</div>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">Completed inquiries</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Subscribers
              </span>
              <div className="text-2xl font-black text-slate-900">{newsletterStats.total}</div>
              <span className="text-xs text-slate-500 font-medium mt-1 block">All mailing list members</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                Active Subscribed
              </span>
              <div className="text-2xl font-black text-emerald-700">{newsletterStats.subscribed}</div>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block">Receiving marketing drops</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Unsubscribed
              </span>
              <div className="text-2xl font-black text-slate-600">{newsletterStats.unsubscribed}</div>
              <span className="text-xs text-slate-400 font-medium mt-1 block">Opted out from updates</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <X className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
                Joined Today
              </span>
              <div className="text-2xl font-black text-blue-700">{newsletterStats.today}</div>
              <span className="text-xs text-blue-600 font-semibold mt-1 block">New today's signups</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Unified Table Card with Integrated Tabs Header & Filter Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Tab Strip (Cleanly integrated into top of card) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('inquiries')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inquiries'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Contact Inquiries</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  inquiryStats.new > 0 && activeTab !== 'inquiries'
                    ? 'bg-rose-500 text-white animate-pulse'
                    : activeTab === 'inquiries'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {inquiryStats.new > 0 ? `${inquiryStats.new} new` : inquiryStats.total}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('newsletter')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'newsletter'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Newsletter Subscribers</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  activeTab === 'newsletter' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {newsletterStats.total}
              </span>
            </button>
          </div>

          {activeTab === 'newsletter' && (
            <button
              type="button"
              onClick={handleCopyAllActiveEmails}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8EF705] hover:bg-[#80de04] text-slate-950 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
              title="Copy comma-separated email list of active subscribers"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Active Emails</span>
            </button>
          )}
        </div>

        {/* =========================================================================
            TAB 1: CONTACT INQUIRIES CONTENT
           ========================================================================= */}
        {activeTab === 'inquiries' && (
          <>
            {/* Filter & Search Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={inquirySearch}
                  onChange={(e) => {
                    setInquirySearch(e.target.value);
                    setInquiryPage(1);
                  }}
                  placeholder="Search by name, email, phone, subject..."
                  className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 placeholder-slate-400"
                />
                {inquirySearch && (
                  <button
                    type="button"
                    onClick={() => setInquirySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                {['all', 'new', 'in_progress', 'resolved', 'spam'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setInquiryStatusFilter(st);
                      setInquiryPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                      inquiryStatusFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Inquiries Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Received</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Customer</th>
                    <th className="py-3.5 px-4 min-w-[180px]">Contact Info</th>
                    <th className="py-3.5 px-4 min-w-[150px]">Subject</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Message Preview</th>
                    <th className="py-3.5 px-4 min-w-[110px] text-center">Status</th>
                    <th className="py-3.5 pr-6 pl-4 text-right min-w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {inquiriesLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        <span>Loading contact inquiries...</span>
                      </td>
                    </tr>
                  ) : inquiries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No contact inquiries found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Inquiries submitted from the customer storefront /contact page will appear here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    inquiries.map((inq) => {
                      const isUnread = inq.status === 'new';
                      return (
                        <tr
                          key={inq.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isUnread ? 'bg-blue-50/20 font-medium' : ''
                          }`}
                        >
                          <td className="py-3.5 pl-6 pr-4 text-center text-slate-400 font-mono text-[11px]">
                            {inq.id}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                            <div>{new Date(inq.created_at).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(inq.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{inq.name}</span>
                            {inq.ip_address && (
                              <span className="text-[10px] font-mono text-slate-400">IP: {inq.ip_address}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <a
                              href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                              className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold block truncate"
                            >
                              <Mail className="w-3 h-3 shrink-0" />
                              <span>{inq.email}</span>
                            </a>
                            {inq.phone && (
                              <a
                                href={`tel:${inq.phone}`}
                                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px] mt-0.5"
                              >
                                <Phone className="w-3 h-3 shrink-0" />
                                <span>{inq.phone}</span>
                              </a>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {inq.subject}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={inq.message}>
                            <p className="truncate">{inq.message}</p>
                            {inq.admin_notes && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 border border-amber-200">
                                <Edit3 className="w-2.5 h-2.5" /> Note attached
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${getStatusBadge(
                                inq.status
                              )}`}
                            >
                              {inq.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenInquiryDetails(inq)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="View details and reply"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <select
                                value={inq.status}
                                onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value)}
                                className="text-[11px] py-1 px-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-emerald-500"
                                title="Change status"
                              >
                                <option value="new">New</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="spam">Spam</option>
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteConfirm({
                                    type: 'inquiry',
                                    id: inq.id,
                                    label: `Inquiry from ${inq.name} (${inq.email})`
                                  })
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete inquiry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {inquiryTotalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page {inquiryPage} of {inquiryTotalPages} ({inquiryTotalCount} total inquiries)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setInquiryPage((p) => Math.max(1, p - 1))}
                    disabled={inquiryPage <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setInquiryPage((p) => Math.min(inquiryTotalPages, p + 1))}
                    disabled={inquiryPage >= inquiryTotalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            TAB 2: NEWSLETTER SUBSCRIBERS CONTENT
           ========================================================================= */}
        {activeTab === 'newsletter' && (
          <>
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={newsletterSearch}
                  onChange={(e) => {
                    setNewsletterSearch(e.target.value);
                    setNewsletterPage(1);
                  }}
                  placeholder="Search by email address or signup source..."
                  className="w-full pl-10 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-900 placeholder-slate-400"
                />
                {newsletterSearch && (
                  <button
                    type="button"
                    onClick={() => setNewsletterSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
                {['all', 'subscribed', 'unsubscribed'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setNewsletterStatusFilter(st);
                      setNewsletterPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                      newsletterStatusFilter === st
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter Subscribers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 min-w-[130px]">Subscribed Date</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Subscriber Email</th>
                    <th className="py-3.5 px-4 min-w-[130px] text-center">Age & Consent</th>
                    <th className="py-3.5 px-4 min-w-[120px]">Source</th>
                    <th className="py-3.5 px-4 min-w-[100px] text-center">Status</th>
                    <th className="py-3.5 pr-6 pl-4 text-right min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {subscribersLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                        <span>Loading subscribers list...</span>
                      </td>
                    </tr>
                  ) : subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Mail className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No newsletter subscribers found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Subscribers who join via the Pharsyde Circle banner on the home page will appear here.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 pl-6 pr-4 text-center text-slate-400 font-mono text-[11px]">
                          {sub.id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                          <div>{new Date(sub.created_at).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <a
                            href={`mailto:${sub.email}`}
                            className="text-slate-900 hover:text-emerald-700 flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sub.email}</span>
                          </a>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>19+ CASL Verified</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {sub.source || 'homepage'}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${getStatusBadge(
                              sub.status
                            )}`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleSubscriberStatus(sub)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border ${
                                sub.status === 'subscribed'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={sub.status === 'subscribed' ? 'Mark Unsubscribed' : 'Reactivate Subscription'}
                            >
                              {sub.status === 'subscribed' ? 'Unsubscribe' : 'Reactivate'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                  type: 'subscriber',
                                  id: sub.id,
                                  label: `Subscriber: ${sub.email}`
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete subscriber"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {newsletterTotalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page {newsletterPage} of {newsletterTotalPages} ({newsletterTotalCount} total subscribers)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNewsletterPage((p) => Math.max(1, p - 1))}
                    disabled={newsletterPage <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsletterPage((p) => Math.min(newsletterTotalPages, p + 1))}
                    disabled={newsletterPage >= newsletterTotalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* =========================================================================
          INQUIRY DETAILS MODAL
         ========================================================================= */}
      {detailModalOpen && selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">#{selectedInquiry.id}</span>
                  <h3 className="font-heading font-black text-lg text-slate-900">
                    Contact Inquiry Details
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${getStatusBadge(
                      selectedInquiry.status
                    )}`}
                  >
                    {selectedInquiry.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Received on {new Date(selectedInquiry.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Customer Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Customer Name</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedInquiry.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Subject Category</span>
                  <span className="font-bold text-emerald-800 text-sm mt-0.5 block">{selectedInquiry.subject}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Email Address</span>
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1 mt-0.5 text-xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{selectedInquiry.email}</span>
                  </a>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[10px]">Phone Number</span>
                  {selectedInquiry.phone ? (
                    <a
                      href={`tel:${selectedInquiry.phone}`}
                      className="font-bold text-slate-800 hover:underline flex items-center gap-1 mt-0.5 text-xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedInquiry.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not provided</span>
                  )}
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Inquiry Message:
                </label>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap shadow-inner font-sans">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Update Resolution Status:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['new', 'in_progress', 'resolved', 'spam'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, st)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer border ${
                        selectedInquiry.status === st
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Internal Staff / Admin Notes:
                  </label>
                  <span className="text-[10px] text-slate-400">Visible only to office administrators</span>
                </div>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record customer interaction summary, resolution outcome, or follow-up details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAdminNotes}
                    disabled={savingNotes}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {savingNotes ? 'Saving Notes...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({
                    type: 'inquiry',
                    id: selectedInquiry.id,
                    label: `Inquiry from ${selectedInquiry.name}`
                  })
                }
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Inquiry</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedInquiry.phone && (
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Customer</span>
                  </a>
                )}
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply via Email</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRM DELETE MODAL
         ========================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-slate-900 mb-2">
              Confirm Record Deletion
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to permanently delete this record? This action cannot be undone.
              <span className="block font-bold text-slate-800 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                {deleteConfirm.label}
              </span>
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'inquiry') {
                    handleDeleteInquiry(deleteConfirm.id);
                  } else {
                    handleDeleteSubscriber(deleteConfirm.id);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
