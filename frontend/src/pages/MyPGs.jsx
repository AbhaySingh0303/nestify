import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function MyPGs() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPGs();
  }, []);

  const fetchPGs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/pg/my');
      setPgs(res.data);
      // Sync to user context
      updateUser({ pgs: res.data });
    } catch (error) {
      toast.error('Failed to load your properties');
    } finally {
      setIsLoading(false);
    }
  };

  const openDashboard = (pg) => {
    // Update user's active pg so dashboard routes work correctly
    updateUser({ pg: pg._id });
    navigate(`/dashboard/${pg._id}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-outline-variant/10 px-4 sm:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[28px] text-primary">nest_eco_leaf</span>
          <span className="font-headline font-black text-primary text-xl tracking-tight">Nestify</span>
          <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ml-1">Owner</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-primary leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500">Property Owner</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm ring-2 ring-white ring-offset-1">
            {user?.name?.charAt(0) || 'O'}
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-error transition-colors p-2 rounded-full hover:bg-surface-container" title="Sign Out">
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <h1 className="font-headline font-bold text-4xl text-primary tracking-tight mb-2">My Properties</h1>
            <p className="text-on-surface-variant">Manage all your PG properties from one place.</p>
          </div>
          <button
            onClick={() => navigate('/setup')}
            className="primary-gradient text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add New PG
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && pgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl text-primary">domain_add</span>
            </div>
            <h2 className="font-headline font-bold text-2xl text-primary mb-3">No Properties Yet</h2>
            <p className="text-on-surface-variant text-sm mb-8 max-w-sm">Create your first PG property to start managing tenants, rooms, and payments.</p>
            <button
              onClick={() => navigate('/setup')}
              className="primary-gradient text-white px-8 py-4 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Create Your First PG
            </button>
          </div>
        )}

        {/* PG Grid */}
        {!isLoading && pgs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pgs.map((pg) => (
              <div key={pg._id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                {/* Card header */}
                <div className="h-32 primary-gradient flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-white/20"></div>
                    <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/10"></div>
                  </div>
                  <span className="material-symbols-outlined text-white text-5xl relative z-10">apartment</span>
                </div>

                {/* Card body */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-headline font-bold text-lg text-primary leading-tight">{pg.name}</h3>
                    <span className="bg-primary-container text-on-primary-container text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shrink-0 ml-2">Active</span>
                  </div>

                  {pg.location && (
                    <div className="flex items-center gap-2 text-on-surface-variant text-sm mb-4">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      <span>{pg.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-6">
                    <span className="material-symbols-outlined text-[14px]">key</span>
                    <span className="font-mono font-bold tracking-widest">{pg.uniqueCode}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(pg.uniqueCode); toast.success('Code copied!'); }}
                      className="ml-auto w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center hover:bg-primary-container hover:text-primary transition-colors"
                      title="Copy join code"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </div>

                  <button
                    onClick={() => openDashboard(pg)}
                    className="mt-auto w-full primary-gradient text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:opacity-90 transition-opacity group-hover:scale-[1.02] transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Open Dashboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
