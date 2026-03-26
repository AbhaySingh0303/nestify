import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Tenants() {
  const location = useLocation();
  const { pgId } = useParams(); // present when routed via /dashboard/:pgId/tenants
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // KYC Modal State
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [kycForm, setKycForm] = useState({ idType: 'Aadhar', idNumber: '', documentUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tenant Modal State
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isEditingTenant, setIsEditingTenant] = useState(false);
  const [tenantForm, setTenantForm] = useState({ userId: '', roomId: '', contactNumber: '', emergencyContact: '' });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);

  // KYC Review Modal
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewKycId, setReviewKycId] = useState(null);
  const [reviewTenantName, setReviewTenantName] = useState('');

  useEffect(() => {
    fetchData().then(() => {
      // Auto open add-tenant modal if navigated from Dashboard
      if (location.state?.openAddModal) {
        openAddTenantModal();
      }
    });
  }, [location.state]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const query = pgId ? `?pgId=${pgId}` : '';
      const res = await api.get(`/tenants${query}`);
      setTenants(res.data);
      
      // Fetch users and rooms for the Add Tenant form
      const roomQuery = pgId ? `?pgId=${pgId}` : '';
      const [usersRes, roomsRes] = await Promise.all([
        api.get('/users').catch(() => ({ data: [] })),
        api.get(`/rooms${roomQuery}`)
      ]);
      setAvailableUsers(usersRes.data);
      setAvailableRooms(roomsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch directory data');
      console.error('Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Remove this tenant from the directory?')) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/tenants/${id}`);
      toast.success('Tenant removed');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove tenant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddTenantModal = () => {
    setIsEditingTenant(false);
    setTenantForm({ userId: '', roomId: '', contactNumber: '', emergencyContact: '' });
    setIsTenantModalOpen(true);
  };

  const openEditTenantModal = (tenant) => {
    setIsEditingTenant(true);
    setTenantForm({
      id: tenant._id,
      userId: tenant.user?._id || '',
      roomId: tenant.room?._id || '',
      contactNumber: tenant.contactNumber || '',
      emergencyContact: tenant.emergencyContact || ''
    });
    setIsTenantModalOpen(true);
  };

  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isEditingTenant) {
        await api.put(`/tenants/${tenantForm.id}`, tenantForm);
        toast.success('Tenant updated successfully');
      } else {
        await api.post('/tenants', tenantForm);
        toast.success('Tenant added successfully');
      }
      setIsTenantModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/kyc', {
        tenantId: selectedTenant,
        ...kycForm
      });
      toast.success('KYC submitted successfully');
      setIsKycModalOpen(false);
      setKycForm({ idType: 'Aadhar', idNumber: '', documentUrl: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'KYC submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKycUpdate = async (status) => {
    try {
      setIsSubmitting(true);
      await api.put(`/kyc/${reviewKycId}`, { status });
      toast.success(`KYC marked as ${status}`);
      setIsReviewOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'KYC update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTenants = tenants.filter(t => t.status !== 'left');
  const newThisMonth = activeTenants.filter(t => new Date(t.joiningDate).getMonth() === new Date().getMonth()).length;
  const pendingKycCount = activeTenants.filter(t => t.kyc?.status === 'Pending').length;
  const tenantsWithoutKyc = activeTenants.filter(t => !t.kyc).length;

  const handleExport = () => {
    try {
      if (tenants.length === 0) return toast.error('No tenants to export');

      const headers = ['Name', 'Email', 'Contact Number', 'Emergency Contact', 'Assigned Room', 'Joining Date', 'KYC Status'];
      const rows = tenants.map(t => [
        t.user?.name || 'N/A',
        t.user?.email || 'N/A',
        t.contactNumber || 'N/A',
        t.emergencyContact || 'N/A',
        t.room?.roomNumber ? `Room ${t.room.roomNumber}` : 'Unassigned',
        new Date(t.joiningDate).toLocaleDateString(),
        t.kyc?.status || 'Missing'
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(',') + '\n'
        + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Nestify_Residents_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Export downloaded successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline font-bold text-4xl text-primary tracking-tight mb-2">Resident Directory</h2>
          <p className="font-body text-on-surface-variant">Manage your community members, their details, and stay status.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="bg-surface-container-lowest text-primary px-5 py-2.5 rounded-xl border border-outline-variant/20 text-sm font-bold shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export List
          </button>
          <button onClick={openAddTenantModal} className="primary-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50" disabled={isLoading}>
            <span className="material-symbols-outlined text-sm">person_add</span>
            Add Resident
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex items-center px-8">
          <div className="w-14 h-14 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mr-6">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Active Residents</div>
            <div className="font-headline text-3xl font-extrabold text-primary">{activeTenants.length}</div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex items-center px-8">
          <div className="w-14 h-14 rounded-full bg-secondary-container/30 text-secondary flex items-center justify-center mr-6">
            <span className="material-symbols-outlined text-2xl">person_add</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">New This Month</div>
            <div className="font-headline text-3xl font-extrabold text-primary">{newThisMonth}</div>
          </div>
        </div>
        <div className={`${pendingKycCount + tenantsWithoutKyc > 0 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-lowest border border-outline-variant/10 text-primary'} rounded-2xl p-6 flex items-center justify-between shadow-sm relative overflow-hidden`}>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined text-9xl">badge</span>
          </div>
          <div className="relative z-10">
            <div className="text-[10px] font-bold tracking-widest uppercase mb-1 opacity-80">KYC Status</div>
            <div className="font-headline text-xl font-bold mb-1">Needs Action</div>
            <p className="text-xs opacity-80">{pendingKycCount} pending approvals, {tenantsWithoutKyc} missing.</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container flex justify-between items-center bg-surface-container-low/30">
          <h3 className="font-headline font-bold text-lg text-primary">All Residents</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-surface-container">
                <th className="px-6 py-4 font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Resident Details</th>
                <th className="px-6 py-4 font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Contact Info</th>
                <th className="px-6 py-4 font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Assigned Room</th>
                <th className="px-6 py-4 font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">KYC Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container bg-surface-container-lowest">
              {tenants.map((tenant) => {
                const kyc = tenant.kyc;
                return (
                <tr key={tenant._id} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                        {tenant.user?.name.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary truncate">{tenant.user?.name}</span>
                          {tenant.status === 'left' ? (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[9px] uppercase tracking-widest font-bold rounded-full flex items-center gap-0.5 shrink-0">
                              <span className="material-symbols-outlined text-[10px]">logout</span>
                              Left
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 text-[9px] uppercase tracking-widest font-bold rounded-full shrink-0">Active</span>
                          )}
                        </div>
                        <span className="text-xs text-on-surface-variant truncate">{tenant.user?.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{tenant.contactNumber || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-primary-fixed/50 border border-primary-fixed text-on-primary-fixed text-xs font-bold px-3 py-1 rounded-md inline-block">
                      Room {tenant.room?.roomNumber || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!kyc && (
                      <button onClick={() => { setSelectedTenant(tenant._id); setIsKycModalOpen(true); }} className="px-3 py-1 border border-outline-variant text-[10px] uppercase tracking-widest font-bold rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors">
                        Submit KYC
                      </button>
                    )}
                    {kyc && kyc.status === 'Approved' && (
                      <span className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 text-[10px] uppercase tracking-widest font-bold rounded-full flex items-center gap-1 w-fit">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Approved
                      </span>
                    )}
                    {kyc && kyc.status === 'Pending' && (
                      <button onClick={() => { setReviewKycId(kyc._id); setReviewTenantName(tenant.user?.name); setIsReviewOpen(true); }} className="px-3 py-1 bg-tertiary-fixed/50 text-tertiary border border-tertiary/20 text-[10px] uppercase tracking-widest font-bold rounded-full flex items-center gap-1 w-fit hover:bg-tertiary hover:text-white transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[12px]">schedule</span>
                        Pending Review
                      </button>
                    )}
                    {kyc && kyc.status === 'Rejected' && (
                      <button onClick={() => { setSelectedTenant(tenant._id); setIsKycModalOpen(true); }} className="px-3 py-1 bg-error-container text-on-error-container border border-error/20 text-[10px] uppercase tracking-widest font-bold rounded-full flex items-center gap-1 w-fit hover:bg-error hover:text-white transition-colors cursor-pointer" title="Resubmit KYC">
                        <span className="material-symbols-outlined text-[12px]">cancel</span>
                        Rejected
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditTenantModal(tenant)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-container transition-all" title="Edit Resident" disabled={isSubmitting}>
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleDelete(tenant._id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-error hover:bg-error-container transition-all" title="Remove Resident" disabled={isSubmitting}>
                        <span className="material-symbols-outlined text-sm">person_remove</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">group_off</span>
                    <p className="text-sm font-medium text-on-surface-variant">No residents found in the directory.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Submit KYC Modal */}
      {isKycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSubmitting && setIsKycModalOpen(false)}></div>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="font-headline font-bold text-xl text-primary">Submit KYC Document</h3>
              <button onClick={() => !isSubmitting && setIsKycModalOpen(false)} className="text-on-surface-variant hover:text-primary disabled:opacity-50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto w-full">
              <form id="kyc-form" onSubmit={handleKycSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">ID Type</label>
                  <select value={kycForm.idType} onChange={e => setKycForm({...kycForm, idType: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all">
                    <option value="Aadhar">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">ID Number</label>
                  <input required type="text" value={kycForm.idNumber} onChange={e => setKycForm({...kycForm, idNumber: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" placeholder="Enter document number" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Document File/URL</label>
                  <input required type="text" value={kycForm.documentUrl} onChange={e => setKycForm({...kycForm, documentUrl: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" placeholder="https://example.com/doc.pdf or 'Attached'" />
                </div>
              </form>
            </div>
            <div className="px-6 py-5 border-t border-outline-variant/10 flex justify-end gap-3 bg-surface-container-low/50">
              <button disabled={isSubmitting} type="button" onClick={() => setIsKycModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50">Cancel</button>
              <button disabled={isSubmitting} type="submit" form="kyc-form" className="primary-gradient text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
                Submit Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review KYC Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSubmitting && setIsReviewOpen(false)}></div>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="font-headline font-bold text-lg text-primary">Review KYC</h3>
            </div>
            <div className="p-6 text-center">
              <span className="material-symbols-outlined text-5xl text-tertiary mb-3">fact_check</span>
              <p className="text-sm font-medium text-on-surface-variant mb-6">Review KYC document submitted by <span className="font-bold text-primary">{reviewTenantName}</span>.</p>
              <div className="flex gap-3 justify-center">
                <button disabled={isSubmitting} onClick={() => handleKycUpdate('Rejected')} className="px-5 py-2.5 rounded-lg border border-error text-error text-sm font-bold hover:bg-error hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1">
                 Reject
                </button>
                <button disabled={isSubmitting} onClick={() => handleKycUpdate('Approved')} className="bg-[#10b981] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1">
                  {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">verified</span>}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Tenant Modal */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSubmitting && setIsTenantModalOpen(false)}></div>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="font-headline font-bold text-xl text-primary">{isEditingTenant ? 'Edit Resident' : 'Add New Resident'}</h3>
              <button onClick={() => !isSubmitting && setIsTenantModalOpen(false)} className="text-on-surface-variant hover:text-primary disabled:opacity-50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto w-full">
              <form id="tenant-form" onSubmit={handleTenantSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">User Account Name</label>
                  <select required disabled={isEditingTenant} value={tenantForm.userId} onChange={e => setTenantForm({...tenantForm, userId: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all">
                    <option value="">Select a User Account</option>
                    {availableUsers.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Assigned Room</label>
                  <select required value={tenantForm.roomId} onChange={e => setTenantForm({...tenantForm, roomId: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all">
                    <option value="">Select a Room</option>
                    {availableRooms.map(room => (
                      <option key={room._id} value={room._id}>Room {room.roomNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Contact Number</label>
                  <input required type="text" value={tenantForm.contactNumber} onChange={e => setTenantForm({...tenantForm, contactNumber: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" placeholder="e.g. 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Emergency Contact</label>
                  <input type="text" value={tenantForm.emergencyContact} onChange={e => setTenantForm({...tenantForm, emergencyContact: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" placeholder="e.g. 9876543211" />
                </div>
              </form>
            </div>
            <div className="px-6 py-5 border-t border-outline-variant/10 flex justify-end gap-3 bg-surface-container-low/50">
              <button disabled={isSubmitting} type="button" onClick={() => setIsTenantModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50">Cancel</button>
              <button disabled={isSubmitting} type="submit" form="tenant-form" className="primary-gradient text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
                {isEditingTenant ? 'Save Changes' : 'Add Resident'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
