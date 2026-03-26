import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [newComplaint, setNewComplaint] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints/my');
      setComplaints(res.data || []);
    } catch (error) {
       if(error.response?.status !== 404) {
         toast.error('Failed to fetch your complaints');
       }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/complaints', newComplaint);
      toast.success('Complaint submitted successfully');
      setNewComplaint({ title: '', description: '' });
      fetchComplaints();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline font-bold text-4xl text-primary tracking-tight mb-2">My Service Requests</h2>
          <p className="font-body text-on-surface-variant">Track your maintenance issues and raise new requests.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest shadow-sm rounded-2xl border border-outline-variant/15 p-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6 border-b border-surface-container pb-4">
          <span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
          <h2 className="font-headline font-bold text-xl text-primary">Submit a Request</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Issue Subject</label>
            <input 
              required 
              type="text" 
              value={newComplaint.title} 
              onChange={e => setNewComplaint({...newComplaint, title: e.target.value})} 
              className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all shadow-sm" 
              placeholder="Brief summary of the issue..." 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1.5">Detailed Description</label>
            <textarea 
              required 
              rows={4} 
              value={newComplaint.description} 
              onChange={e => setNewComplaint({...newComplaint, description: e.target.value})} 
              className="w-full bg-surface-container-high border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none focus:bg-white transition-all shadow-sm resize-none" 
              placeholder="Please provide specific details so our team can assist you efficiently..." 
            />
          </div>
          <div className="pt-2">
            <button type="submit" className="primary-gradient w-full md:w-auto px-8 py-3 rounded-xl shadow-md shadow-primary/20 text-sm font-bold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">send</span>
              Submit Request
            </button>
          </div>
        </form>
      </div>

      <div className="pt-4 border-t border-surface-container">
        <h3 className="font-headline font-bold text-xl text-primary mb-6">Recent Requests</h3>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {complaints.map((c) => {
            const isResolved = c.status === 'Resolved';
            return (
              <div key={c._id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 flex flex-col transition-shadow hover:shadow-md h-full relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${isResolved ? 'bg-secondary' : 'bg-tertiary'}`}></div>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 ${
                    isResolved 
                      ? 'bg-secondary-container text-on-secondary-container' 
                      : 'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {isResolved ? (
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                    )}
                    {c.status}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">
                     {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-headline font-extrabold text-primary mb-2 line-clamp-1">{c.title}</h3>
                <p className="text-sm text-on-surface-variant mb-6 flex-1 line-clamp-3 leading-relaxed">{c.description}</p>
                
                {c.status === 'Resolved' && (
                  <div className="w-full flex items-center py-2.5 px-3 rounded-lg bg-surface-container-low text-xs font-bold text-on-surface-variant border border-outline-variant/20 mt-auto">
                    <span className="material-symbols-outlined text-[16px] text-secondary mr-2">verified</span>
                    Resolved on {new Date(c.resolvedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
          {complaints.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">chat_bubble_outline</span>
              <p className="text-sm font-medium">No service requests found.</p>
              <p className="text-xs text-on-surface-variant mt-1">Submit a request above if you need assistance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
