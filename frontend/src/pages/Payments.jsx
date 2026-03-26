import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Payments() {
  const { pgId } = useParams();
  const q = pgId ? `?pgId=${pgId}` : '';
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [pgId]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/payments${q}`);
      setPayments(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch payments');
      console.error('Fetch payments error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPaid = async (id) => {
    try {
      setIsSubmitting(true);
      await api.put(`/payments/${id}`, { status: 'paid' });
      toast.success('Payment marked as paid');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to update payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const safePayments = Array.isArray(payments) ? payments : [];
  const totalCollected = safePayments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = safePayments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline font-bold text-4xl text-primary tracking-tight mb-2">Financial Ledger</h2>
          <p className="font-body text-on-surface-variant">Monitor rent collections, pending dues, and payment history.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => toast('Export feature coming soon!', { icon: '🏗️' })} className="bg-surface-container-lowest text-primary px-5 py-2.5 rounded-xl border border-outline-variant/20 text-sm font-bold shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Ledger
          </button>
          <button onClick={() => toast('Invoice generation coming soon!', { icon: '🏗️' })} className="primary-gradient text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            Generate Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex items-center px-8 relative overflow-hidden group">
          <div className="absolute inset-y-0 left-0 w-2 bg-primary"></div>
          <div className="w-14 h-14 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mr-6">
            <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Total Collected</div>
            <div className="font-headline text-4xl font-extrabold text-primary">₹{totalCollected.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex items-center px-8 relative overflow-hidden group">
          <div className="absolute inset-y-0 left-0 w-2 bg-tertiary"></div>
          <div className="w-14 h-14 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center mr-6">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-1">Pending Dues</div>
            <div className="font-headline text-4xl font-extrabold text-tertiary">₹{pendingAmount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container flex justify-between items-center bg-surface-container-low/30">
          <h3 className="font-headline font-bold text-lg text-primary">Payment Records</h3>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant pointer-events-none">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input 
              type="text" 
              placeholder="Search by tenant..." 
              className="bg-white border border-outline-variant/30 rounded-lg py-2 pl-10 pr-4 text-xs w-64 focus:ring-2 focus:ring-primary outline-none transition-shadow"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
        ) : (
          <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50 border-b border-surface-container">
                <th className="px-6 py-4 font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Resident</th>
                <th className="px-6 py-4 font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Amount Details</th>
                <th className="px-6 py-4 font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Billing Cycle</th>
                <th className="px-6 py-4 font-label text-[10px] font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container bg-surface-container-lowest">
              {safePayments.map((p) => (
                <tr key={p._id} className="hover:bg-surface-container-low/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                        {(p.user?.name || p.tenant?.user?.name || 'U').charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-primary truncate">{p.user?.name || p.tenant?.user?.name || 'Unknown User'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-extrabold text-primary">₹{p.amount.toLocaleString()}</span>
                      <span className="text-xs text-on-surface-variant">Rent Fee</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-slate-400">calendar_month</span>
                      <span className="text-sm text-on-surface-variant font-medium">{p.month}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 font-label text-[10px] font-bold uppercase tracking-widest rounded-full flex w-fit items-center gap-1 ${
                      p.status === 'paid' 
                        ? 'bg-primary-fixed/50 border border-primary-fixed text-on-primary-fixed' 
                        : 'bg-tertiary-fixed/50 border border-tertiary-fixed text-on-tertiary-fixed'
                    }`}>
                      {p.status === 'paid' && <span className="material-symbols-outlined text-[12px]">check_circle</span>}
                      {p.status === 'pending' && <span className="material-symbols-outlined text-[12px]">schedule</span>}
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === 'pending' ? (
                      <button 
                        disabled={isSubmitting}
                        onClick={() => markAsPaid(p._id)} 
                        className="text-xs font-bold text-tertiary hover:text-white hover:bg-tertiary px-4 py-2 rounded-lg transition-all border border-tertiary/30 disabled:opacity-50 flex items-center gap-2"
                      >
                         {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[14px]">sync</span> : null}
                         Mark as Paid
                      </button>
                    ) : (
                      <button onClick={() => toast('Receipts module coming soon!', { icon: '🏗️' })} className="text-slate-400 hover:text-primary transition-colors p-2" title="View Receipt">
                        <span className="material-symbols-outlined text-[20px]">receipt</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {safePayments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">receipt_long</span>
                    <p className="text-sm font-medium text-on-surface-variant">No payment records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
