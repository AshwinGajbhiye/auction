import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  ShoppingBag,
  Gavel,
  AlertTriangle,
  FileText,
  Check,
  X,
  Search,
} from 'lucide-react';
import { adminApi, AdminStats, AdminUserItem, AuditLogItem } from '../api/admin';
import { reportsApi, ReportItem } from '../api/reports';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'audit'>('reports');

  // Reports state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Users state
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const res = await reportsApi.getReports(1, 50);
      setReports(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await adminApi.getUsers({ q: userSearch || undefined });
      setUsers(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await adminApi.getAuditLogs(1, 50);
      setAuditLogs(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const handleResolveReport = async () => {
    if (!selectedReportId) return;
    try {
      await reportsApi.updateReport(selectedReportId, {
        status: resolutionAction,
        resolutionNotes: resolutionNotes.trim(),
      });
      setResolveModalOpen(false);
      setResolutionNotes('');
      await fetchReports();
      await fetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update report.');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to set status to ${newStatus}?`)) return;
    try {
      await adminApi.updateUserStatus(userId, newStatus, 'Moderator action');
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update role.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Admin Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-md">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Campus Moderation Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            System overview, incident reporting queue, and user trust management
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
            <span className="text-2xl font-extrabold font-display text-slate-900 mt-1 block">
              {stats.totalUsers}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Listings</span>
            <span className="text-2xl font-extrabold font-display text-brand-600 mt-1 block">
              {stats.activeListings}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Auctions</span>
            <span className="text-2xl font-extrabold font-display text-amber-600 mt-1 block">
              {stats.activeAuctions}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Reports</span>
            <span className={`text-2xl font-extrabold font-display mt-1 block ${stats.pendingReports > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {stats.pendingReports}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Deals Done</span>
            <span className="text-2xl font-extrabold font-display text-emerald-600 mt-1 block">
              {stats.completedPurchases}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Universities</span>
            <span className="text-2xl font-extrabold font-display text-slate-900 mt-1 block">
              {stats.totalColleges}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Reports Queue ({reports.filter((r) => r.status === 'OPEN').length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          User Moderation
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          Audit Logs
        </button>
      </div>

      {/* Tab 1: Reports Queue */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {loadingReports ? (
            <LoadingSpinner message="Loading reports..." />
          ) : reports.length > 0 ? (
            reports.map((r) => (
              <div
                key={r.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge-pill text-[10px] font-bold ${
                        r.status === 'OPEN'
                          ? 'bg-rose-100 text-rose-800'
                          : r.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {r.status}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{r.category}</span>
                  </div>

                  <p className="text-xs text-slate-700">{r.description}</p>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                    <span>Reporter: <strong>{r.reporter?.name}</strong></span>
                    {r.listing && <span>Listing: <strong>{r.listing.title}</strong></span>}
                    {r.reportedUser && <span>Target User: <strong>{r.reportedUser.name}</strong></span>}
                  </div>
                </div>

                {r.status === 'OPEN' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedReportId(r.id);
                        setResolutionAction('RESOLVED');
                        setResolveModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReportId(r.id);
                        setResolutionAction('DISMISSED');
                        setResolveModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
              Clean inbox! No moderation reports in the queue.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Users Moderation */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchUsers();
            }}
            className="flex gap-2 max-w-md"
          >
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
            />
            <button
              type="submit"
              className="px-4 py-2 gradient-brand text-white text-xs font-bold rounded-xl"
            >
              Search
            </button>
          </form>

          {loadingUsers ? (
            <LoadingSpinner message="Searching users..." />
          ) : users.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900">{u.name}</h4>
                    <p className="text-slate-500">{u.email} • {u.college?.name}</p>
                    <span className="text-[10px] text-slate-400">
                      Role: <strong>{u.role}</strong> • Status: <strong>{u.status}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                    </select>

                    {u.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleStatusChange(u.id, 'SUSPENDED')}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(u.id, 'ACTIVE')}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg"
                      >
                        Reinstate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
              No users found.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {loadingAudit ? (
            <LoadingSpinner message="Fetching audit trail..." />
          ) : auditLogs.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono font-bold text-brand-700">{log.action}</span>
                    <p className="text-slate-500 mt-0.5">
                      Actor: <strong>{log.actor?.name}</strong> ({log.actor?.role}) • Entity: {log.entityType} ({log.entityId})
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
              No audit logs recorded yet.
            </div>
          )}
        </div>
      )}

      {/* Resolve Report Modal */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-display font-bold text-xl text-slate-900">
              {resolutionAction === 'RESOLVED' ? 'Resolve Report' : 'Dismiss Report'}
            </h3>
            <p className="text-xs text-slate-500">Add optional moderator notes for the audit trail.</p>

            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Seller confirmed product condition, warning issued..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResolveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveReport}
                className="px-5 py-2.5 gradient-brand text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm {resolutionAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
