import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function MyPayments() {
  const [payments, setPayments] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [payRes, tenantRes] = await Promise.all([
        api.get('/payments/my').catch(() => ({ data: [] })),
        api.get('/tenants/me').catch(() => ({ data: null }))
      ]);
      setPayments(payRes.data || []);
      setTenant(tenantRes.data || null);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const payRent = async (month) => {
    try {
      setIsPaying(true);
      await api.post('/payments/simulate', { month });
      toast.success('Payment successful!');
      fetchData(); // Refresh the payments list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setIsPaying(false);
    }
  };

  const isCurrentMonthPaid = payments.some(p => p.month === currentMonth && p.status === 'paid');

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline font-bold text-4xl text-primary tracking-tight mb-2">My Payments</h2>
          <p className="font-body text-on-surface-variant">View your payment history and settle open balances.</p>
        </div>
      </div>

      {/* Rent Due Card */}
      {tenant?.room ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 flex flex-col md:flex-row justify-between items-center shadow-sm relative overflow-hidden group">
          <div className={`absolute left-0 top-0 bottom-0 w-2 ${isCurrentMonthPaid ? 'bg-secondary' : 'bg-primary'}`}></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center w-full">
            <div>
              <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">Room Number</div>
              <div className="text-xl font-headline font-bold text-primary">{tenant.room.roomNumber}</div>
            </div>
            
            <div>
              <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">Monthly Rent</div>
              <div className="text-xl font-headline font-bold text-primary">₹{tenant.room.rent}</div>
            </div>

            <div>
              <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">Amount Due</div>
              <div className="text-3xl font-headline font-extrabold text-primary">₹{tenant.room.rent}</div>
            </div>

            <div className="ml-auto w-full md:w-auto mt-4 md:mt-0">
              {isCurrentMonthPaid ? (
                <div className="flex items-center justify-center gap-2 text-secondary font-bold bg-secondary-container px-6 py-3 rounded-xl border border-secondary/20">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  Rent Paid
                </div>
              ) : (
                <button 
                  disabled={isPaying}
                  onClick={() => payRent(currentMonth)}
                  className="w-full md:w-auto primary-gradient flex justify-center items-center px-8 py-3 rounded-xl shadow-sm shadow-primary/20 text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isPaying ? <span className="material-symbols-outlined animate-spin text-[18px] mr-2">sync</span> : <span className="material-symbols-outlined text-[18px] mr-2">payment</span>}
                  Pay ₹{tenant.room.rent}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-10 text-center text-slate-500 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30">
          <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">room_preferences</span>
          <p className="text-sm font-bold text-primary">No Room Assigned</p>
          <p className="text-xs text-on-surface-variant mt-1">You will see your rent details here once a room is assigned to you.</p>
        </div>
      )}

      {/* Payment History */}
      <div>
        <h3 className="font-headline font-bold text-2xl text-primary tracking-tight mb-4 mt-8">Payment History</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {payments.map((p) => {
            const isPaid = p.status === 'paid';
            return (
              <div key={p._id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 p-6 flex flex-col transition-shadow hover:shadow-md h-full relative overflow-hidden group">
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${isPaid ? 'bg-secondary' : 'bg-tertiary'}`}></div>
                
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 ${
                    isPaid 
                      ? 'bg-secondary-container text-on-secondary-container' 
                      : 'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {isPaid ? (
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                    )}
                    {p.status}
                  </span>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                     {p.month}
                  </span>
                </div>
                
                <div className="mb-8 mt-2">
                  <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest text-[10px] mb-1">Rent Amount</div>
                  <div className="text-4xl font-headline font-extrabold text-primary">₹{p.amount.toLocaleString()}</div>
                </div>
                
                <div className="mt-auto">
                  <div className="w-full flex justify-between items-center py-3 px-4 rounded-xl bg-surface-container-low text-sm font-bold text-on-surface-variant border border-outline-variant/20">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
                      Paid On
                    </span>
                    <span>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {payments.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">history</span>
              <p className="text-sm font-bold text-primary">No previous payments found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
