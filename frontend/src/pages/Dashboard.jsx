import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pgId } = useParams();
  const isOwner = user?.role === 'owner' || user?.role === 'admin';
  const [stats, setStats] = useState({ rooms: 0, tenants: 0, payments: 0, complaints: 0, totalRent: 0, occupants: 0, capacity: 0, occupiedRooms: 0 });
  const [recentTenants, setRecentTenants] = useState([]);
  const [kycActions, setKycActions] = useState([]);
  const [tenantRoom, setTenantRoom] = useState(null);
  const [pgDetails, setPgDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const { updateUser } = useContext(AuthContext);

  // Build query string for pgId-scoped API calls
  const q = pgId ? `?pgId=${pgId}` : '';
  // Base path for owner navigation links
  const base = pgId ? `/dashboard/${pgId}` : '';

  useEffect(() => {
    if (isOwner) {
      const fetchStats = async () => {
        try {
          const [roomsRes, tenantsRes, paymentsRes, complaintsRes, pgRes] = await Promise.all([
            api.get(`/rooms${q}`),
            api.get(`/tenants${q}`),
            api.get(`/payments${q}`),
            api.get(`/complaints${q}`),
            // Fetch PG by specific pgId if available, else fall back to /pg/me
            pgId ? api.get(`/pg/${pgId}`) : api.get('/pg/me')
          ]);
          
          const rooms = roomsRes.data || [];
          const allTenants = tenantsRes.data || [];
          const tenants = allTenants.filter(t => t.status !== 'left');
          const payments = paymentsRes.data || [];
          const complaints = complaintsRes.data || [];

          const totalRent = rooms.reduce((acc, r) => acc + (r.rent * Math.min(r.occupied, r.capacity)), 0);
          const totalOcc = rooms.reduce((acc, r) => acc + r.occupied, 0);
          const totalCap = rooms.reduce((acc, r) => acc + r.capacity, 0);
          const occupiedRooms = rooms.filter(r => r.occupied > 0).length;
          
          setStats({
            rooms: rooms.length,
            tenants: tenants.length,
            payments: payments.filter(p => p.status === 'Pending').length,
            complaints: complaints.filter(c => c.status === 'Open').length,
            totalRent,
            occupants: totalOcc,
            capacity: totalCap,
            occupiedRooms
          });
          
          setPgDetails(pgRes.data || null);
          setRecentTenants(tenants.slice(0, 5));
          
          const actions = [];
          tenants.forEach(t => {
            const kyc = t.kyc;
            if (!kyc) {
              actions.push({ tenant: t, type: 'Missing KYC', status: 'missing' });
            } else if (kyc.status === 'Pending') {
              actions.push({ tenant: t, type: 'Pending Approval', status: 'pending' });
            }
          });
          setKycActions(actions);

        } catch (error) {
          console.error('Failed to fetch stats', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchStats();
    } else {
      const fetchRoom = async () => {
        try {
          const [res, pgRes] = await Promise.all([
            api.get('/tenants/me'),
            api.get('/pg/me').catch(err => {
              // PG deleted — clear user pg context
              if (err.response?.status === 404) {
                updateUser({ pg: null });
                navigate('/setup');
              }
              return { data: null };
            })
          ]);
          setTenantRoom(res.data?.room || null);
          setPgDetails(pgRes.data || null);
        } catch (error) {
          console.error('Failed to fetch tenant room', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRoom();
    }
  }, [pgId, user]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (isOwner) {
    const occupancyRate = stats.capacity ? Math.round((stats.occupants / stats.capacity) * 100) : 0;
    
    return (
      <div className="space-y-12">
        <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-headline font-bold text-4xl text-primary tracking-tight mb-2">Morning, {user.name.split(' ')[0]}.</h2>
            <p className="font-body text-on-surface-variant">Here is what's happening at {pgDetails?.name || 'The Sanctuary'} today.</p>
          </div>
          {pgDetails?.uniqueCode && (
            <div className="bg-surface-container-lowest border border-outline-variant/20 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">PG Join Code</span>
                <span className="font-headline font-bold text-lg text-primary">{pgDetails.uniqueCode}</span>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(pgDetails.uniqueCode); alert('Code copied maps!'); }} 
                className="w-8 h-8 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center hover:opacity-90 transition-opacity" 
                title="Copy Code"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
              </button>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => navigate(`${base}/tenants`)} className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-sm border border-outline-variant/10 cursor-pointer hover:shadow-md transition-shadow group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-2 transition-all"></div>
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant font-label text-sm uppercase tracking-wider">Total Tenants</span>
              <span className="material-symbols-outlined text-primary">group</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-4xl font-extrabold text-primary">{stats.tenants}</span>
              <span className="text-primary font-label text-sm mt-2 flex items-center gap-1">
                Active in system
              </span>
            </div>
          </div>

          <div onClick={() => navigate(`${base}/rooms`)} className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-sm border border-outline-variant/10 cursor-pointer hover:shadow-md transition-shadow group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary group-hover:w-2 transition-all"></div>
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant font-label text-sm uppercase tracking-wider">Occupied Rooms</span>
              <span className="material-symbols-outlined text-primary">bed</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-4xl font-extrabold text-primary">{stats.occupiedRooms} / {stats.rooms}</span>
              <span className="text-slate-400 font-label text-sm mt-2">Beds: {stats.occupants} / {stats.capacity}</span>
            </div>
          </div>
          
          <div onClick={() => navigate(`${base}/payments`)} className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-sm border border-outline-variant/10 cursor-pointer hover:shadow-md transition-shadow group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary group-hover:w-2 transition-all"></div>
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant font-label text-sm uppercase tracking-wider">Pending Dues</span>
              <span className="material-symbols-outlined text-tertiary">payments</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-4xl font-extrabold text-tertiary">{stats.payments}</span>
              <span className="text-tertiary font-label text-sm mt-2">Unpaid payments</span>
            </div>
          </div>

          <div onClick={() => navigate(`${base}/complaints`)} className="bg-surface-container-lowest rounded-xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-sm border border-outline-variant/10 cursor-pointer hover:shadow-md transition-shadow group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-error group-hover:w-2 transition-all"></div>
            <div className="flex justify-between items-start">
              <span className="text-on-surface-variant font-label text-sm uppercase tracking-wider">Pending Complaints</span>
              <span className="material-symbols-outlined text-error">assignment_late</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-4xl font-extrabold text-error">{stats.complaints}</span>
              <span className="text-error font-label text-sm mt-2">Needs attention</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="font-headline font-bold text-xl text-primary">Revenue Trends</h3>
                <p className="text-on-surface-variant text-sm">Historical data for the past 30 days</p>
              </div>
              <button className="bg-surface-container-lowest text-primary text-xs font-bold px-4 py-2 rounded-lg border border-outline-variant/15 hover:bg-slate-100 transition-colors">
                 Last 30 Days
              </button>
            </div>
            <div className="w-full h-64 relative mt-4">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 200">
                <line x1="0" y1="50" x2="800" y2="50" stroke="#bfc8cc" strokeOpacity="0.3" strokeDasharray="4"></line>
                <line x1="0" y1="100" x2="800" y2="100" stroke="#bfc8cc" strokeOpacity="0.3" strokeDasharray="4"></line>
                <line x1="0" y1="150" x2="800" y2="150" stroke="#bfc8cc" strokeOpacity="0.3" strokeDasharray="4"></line>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#004253" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#004253" stopOpacity="0"></stop>
                </linearGradient>
                <path d="M0,160 Q100,120 200,140 T400,80 T600,100 T800,40 L800,200 L0,200 Z" fill="url(#chartGradient)"></path>
                <path d="M0,160 Q100,120 200,140 T400,80 T600,100 T800,40" fill="none" stroke="#004253" strokeWidth="3"></path>
                <circle cx="200" cy="140" r="4" fill="#004253"></circle>
                <circle cx="400" cy="80" r="4" fill="#004253"></circle>
                <circle cx="600" cy="100" r="4" fill="#004253"></circle>
                <circle cx="800" cy="40" r="4" fill="#004253"></circle>
              </svg>
              <div className="flex justify-between mt-4 text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/10 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">New Residents</h3>
              <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold px-2 py-1 rounded">THIS WEEK</span>
            </div>
            <div className="space-y-6">
              {recentTenants.length > 0 ? recentTenants.map((t) => (
                <div key={t._id} className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold shrink-0">
                    {t.user?.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{t.user?.name}</p>
                    <p className="text-xs text-on-surface-variant">Room {t.room?.roomNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-tertiary font-bold px-2 py-1 bg-tertiary-fixed rounded-full">ACTIVE</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-on-surface-variant">No recent residents.</p>
              )}
            </div>
            <button onClick={() => navigate(`${base}/tenants`)} className="w-full mt-8 py-3 rounded-lg border border-outline text-primary text-sm font-bold hover:bg-surface-container-high transition-colors">
               View Directory
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10 flex flex-col">
            <div className="px-6 py-5 border-b border-surface-container flex justify-between items-center bg-error-container/10">
              <h3 className="font-headline font-bold text-lg text-primary cursor-pointer hover:underline" onClick={() => navigate(`${base}/tenants`)}>Pending KYC Actions</h3>
              <span className="bg-error-container text-on-error-container text-[10px] font-bold px-2 py-1 rounded cursor-pointer" onClick={() => navigate(`${base}/tenants`)}>{kycActions.length} Actions</span>
            </div>
            <div className="overflow-y-auto max-h-80">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-surface-container">
                  {kycActions.map((action, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">{action.tenant.user?.name}</span>
                          <span className="text-xs text-on-surface-variant">Room {action.tenant.room?.roomNumber || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${action.status === 'pending' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-error-container text-on-error-container'}`}>
                          {action.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors cursor-pointer text-sm">visibility</span>
                      </td>
                    </tr>
                  ))}
                  {kycActions.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-6 py-12 text-center text-sm text-slate-500">
                        <span className="material-symbols-outlined text-4xl mb-4 text-[#10b981]/50">verified_user</span>
                        <p className="font-medium text-primary">All KYC up to date!</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10 flex flex-col">
            <div className="px-6 py-5 border-b border-surface-container flex justify-between items-center">
              <h3 className="font-headline font-bold text-lg text-primary cursor-pointer hover:underline" onClick={() => navigate(`${base}/tenants`)}>Recent Bookings</h3>
              <button onClick={() => navigate(`${base}/tenants`, { state: { openAddModal: true } })} className="primary-gradient text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm hover:opacity-90">
                 <span className="material-symbols-outlined text-[14px]">add</span>
                 New
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-surface-container">
                  {recentTenants.map(t => (
                    <tr key={t._id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-primary">{t.user?.name}</span>
                          <span className="text-xs font-medium text-on-surface-variant">Room {t.room?.roomNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-primary-fixed text-on-primary-fixed text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Confirmed</span>
                      </td>
                      <td className="px-6 py-4 text-right hidden sm:table-cell">
                        <span className="text-xs text-on-surface-variant font-medium">{t.contactNumber || 'No Contact'}</span>
                      </td>
                    </tr>
                  ))}
                  {recentTenants.length === 0 && (
                     <tr>
                       <td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-500">No recent bookings.</td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline font-bold text-4xl text-primary tracking-tight mb-2">Welcome, {user.name.split(' ')[0]}.</h2>
          <p className="font-body text-on-surface-variant">Your resident portal at {pgDetails?.name || 'The Sanctuary'}.</p>
        </div>
        {pgDetails?.uniqueCode && (
          <div className="bg-surface-container-lowest border border-outline-variant/20 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">PG Join Code</span>
              <span className="font-headline font-bold text-lg text-primary">{pgDetails.uniqueCode}</span>
            </div>
          </div>
        )}
      </section>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-container bg-surface-container-low flex justify-between items-center">
          <h3 className="font-headline font-bold text-primary">My Assigned Unit</h3>
          <button
            disabled={isLeaving}
            onClick={async () => {
              if (!window.confirm('Are you sure you want to leave this PG? You will lose access to the dashboard.')) return;
              try {
                setIsLeaving(true);
                await api.post('/pg/leave');
                updateUser({ pg: null });
                navigate('/setup');
              } catch (error) {
                alert(error.response?.data?.message || 'Failed to leave PG');
                setIsLeaving(false);
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-error border border-error/30 px-3 py-1.5 rounded-lg hover:bg-error hover:text-white transition-colors disabled:opacity-50"
          >
            {isLeaving
              ? <span className="material-symbols-outlined animate-spin text-[14px]">sync</span>
              : <span className="material-symbols-outlined text-[14px]">logout</span>}
            Leave PG
          </button>
        </div>
        <div className="p-8">
          {tenantRoom ? (
             <div className="grid grid-cols-2 gap-6">
              <div className="bg-surface p-5 rounded-2xl border border-surface-container">
                <div className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-2">Room Number</div>
                <div className="font-headline text-3xl font-extrabold text-primary">{tenantRoom.roomNumber}</div>
              </div>
              <div className="bg-surface p-5 rounded-2xl border border-surface-container">
                <div className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-2">Monthly Rent</div>
                <div className="font-headline text-3xl font-extrabold text-primary">₹{tenantRoom.rent?.toLocaleString()}</div>
              </div>
              <div className="col-span-2 bg-surface p-5 rounded-2xl border border-surface-container">
                <div className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-3">Amenities Included</div>
                <div className="flex flex-wrap gap-2">
                  {(tenantRoom.amenities || []).map((amenity, idx) => (
                    <span key={idx} className="bg-secondary-container text-on-secondary-container px-4 py-1.5 text-xs font-bold rounded-lg tracking-wider">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
             </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">bed</span>
              <p className="text-sm font-medium">You have not been assigned to a unit yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
