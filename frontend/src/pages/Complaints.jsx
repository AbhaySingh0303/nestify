import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Complaints() {
  const { user } = useContext(AuthContext);
  const { pgId } = useParams();
  const q = pgId ? `?pgId=${pgId}` : '';
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add Complaint Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [complaintForm, setComplaintForm] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchComplaints();
  }, [pgId]);

  const fetchComplaints = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/complaints${q}`);
      setComplaints(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch complaints');
      console.error('Fetch complaints error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markResolved = async (id) => {
    try {
      setIsSubmitting(true);
      await api.put(`/complaints/${id}/resolve`);
      toast.success('Complaint resolved');
      fetchComplaints();
    } catch (error) {
      toast.error('Failed to mark resolved');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComplaint = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/complaints', complaintForm);
      toast.success('Complaint registered successfully');
      setIsAddModalOpen(false);
      setComplaintForm({ title: '', description: '' });
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeComplaints = Array.isArray(complaints) ? complaints : [];
  const openTickets = safeComplaints.filter(c => c.status === 'Open').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline font-bold text-4xl text-primary tracking-tight mb-2">Support Desk</h2>
          <p className="font-body text-on-surface-variant">Review and resolve resident maintenance and service requests.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-error-container text-on-error-container px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm font-bold text-sm">
            <span className="material-symbols-outlined text-lg">error</span>
            {openTickets} Open Tickets
          </div>
          {user.role !== 'owner' && (
            <button onClick={() => setIsAddModalOpen(true)} className="primary-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add_circle</span>
              New Request
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {safeComplaints.map((c) => {
          const isResolved = c.status === 'Resolved';
          return (
            <div key={c._id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 flex flex-col transition-shadow hover:shadow-md h-full relative overflow-hidden group">
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${isResolved ? 'bg-secondary' : 'bg-error'}`}></div>
              <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 ${
                  isResolved 
                    ? 'bg-secondary-container text-on-secondary-container' 
                    : 'bg-error-container text-on-error-container'
                }`}>
                  {isResolved ? (
                    <span className="material-symbols-outlined text-[12px]">check_circle</span>
                  ) : (
                    <span className="material-symbols-outlined text-[12px]">radio_button_unchecked</span>
                  )}
                  {c.status}
                </span>
                <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">
                   {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <h3 className="text-lg font-headline font-extrabold text-primary mb-3 leading-tight group-hover:text-primary transition-colors">{c.title}</h3>
              <p className="text-sm text-on-surface-variant mb-6 flex-1 line-clamp-3 leading-relaxed">{c.description}</p>
              
              <div className="flex items-center gap-3 mb-6 p-3 bg-surface-container-low rounded-xl border border-surface-container">
                {(() => {
                  const name = c.tenantId?.user?.name || c.user?.name || 'Unknown Resident';
                  const roomNo = c.tenantId?.room?.roomNumber || c.room?.roomNumber;
                  return (
                    <>
                      <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-[9px] mb-0.5">Reported By</div>
                        <div className="text-sm font-bold text-primary truncate">
                          {name}
                          {roomNo && <span className="font-normal text-on-surface-variant ml-2">· Room {roomNo}</span>}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              {c.status === 'Open' ? (
                user.role === 'owner' ? (
                  <button disabled={isSubmitting} onClick={() => markResolved(c._id)} className="w-full primary-gradient flex justify-center items-center py-3 rounded-xl shadow-sm text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                    {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[18px] mr-2">sync</span> : <span className="material-symbols-outlined text-[18px] mr-2">task_alt</span>}
                    Mark as Resolved
                  </button>
                ) : (
                  <div className="w-full flex justify-center items-center py-3 rounded-xl bg-tertiary/10 text-sm font-bold text-tertiary">
                     Pending Review
                  </div>
                )
              ) : (
                <div className="w-full flex justify-center items-center py-3 rounded-xl bg-surface-container-high text-sm font-bold text-on-surface-variant border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[18px] mr-2">done_all</span>
                  Resolved {new Date(c.resolvedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
        {safeComplaints.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30">
            <span className="material-symbols-outlined text-5xl mb-4 text-slate-300">sentiment_satisfied</span>
            <p className="text-sm font-bold text-primary">All caught up!</p>
            <p className="text-xs text-on-surface-variant mt-1">No active complaints found in the system at this time.</p>
          </div>
        )}
      </div>
      )}

      {/* Add Complaint Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !isSubmitting && setIsAddModalOpen(false)}></div>
          <div className="bg-surface-container-lowest rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
              <h3 className="font-headline font-bold text-xl text-primary">New Service Request</h3>
              <button disabled={isSubmitting} onClick={() => setIsAddModalOpen(false)} className="text-on-surface-variant hover:text-primary disabled:opacity-50">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto w-full">
              <form id="complaint-form" onSubmit={handleAddComplaint} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Issue Title</label>
                  <input required type="text" value={complaintForm.title} onChange={e => setComplaintForm({...complaintForm, title: e.target.value})} className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all" placeholder="e.g. AC Not Cooling" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Details</label>
                  <textarea required value={complaintForm.description} onChange={e => setComplaintForm({...complaintForm, description: e.target.value})} rows="4" className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all resize-none" placeholder="Describe your issue..."></textarea>
                </div>
              </form>
            </div>
            <div className="px-6 py-5 border-t border-outline-variant/10 flex justify-end gap-3 bg-surface-container-low/50">
              <button disabled={isSubmitting} type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50">Cancel</button>
              <button disabled={isSubmitting} type="submit" form="complaint-form" className="primary-gradient text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
