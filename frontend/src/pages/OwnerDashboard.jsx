import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function OwnerDashboard() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pgs, setPgs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create PG modal state
  const [showCreate, setShowCreate] = useState(false);
  const [pgName, setPgName] = useState('');
  const [pgLocation, setPgLocation] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPGs();
  }, []);

  const fetchPGs = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/pg/my');
      setPgs(res.data);
    } catch (error) {
      toast.error('Failed to load your properties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePG = async (e) => {
    e.preventDefault();
    if (!pgName.trim()) return;
    try {
      setIsCreating(true);
      const res = await api.post('/pg/create', {
        name: pgName.trim(),
        location: pgLocation.trim()
      });
      toast.success(`"${pgName}" created successfully!`);
      setPgName('');
      setPgLocation('');
      setShowCreate(false);
      // Refresh PG list
      await fetchPGs();
      // Update user context role to 'owner' if it was unset
      updateUser({ role: 'owner' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create PG');
    } finally {
      setIsCreating(false);
    }
  };

  const openPGDashboard = (pg) => {
    updateUser({ pg: pg._id });
    navigate(`/dashboard/${pg._id}`);
  };

  const handleDeletePG = async (pg) => {
    if (!window.confirm(`Delete "${pg.name}"? This will remove it from your dashboard. Historical data is kept in the database.`)) return;
    try {
      await api.delete(`/pg/${pg._id}`);
      const updated = pgs.filter(p => p._id !== pg._id);
      setPgs(updated);
      if (updated.length === 0) navigate('/setup');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete PG');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top nav */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-outline-variant/10 px-4 sm:px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Nestify" className="h-9 w-9 object-contain" style={{mixBlendMode:'multiply'}} />
          <span className="font-headline font-black text-primary text-xl tracking-tight">Nestify</span>
          <span className="bg-primary-container text-on-primary-container text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ml-1">Owner</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-primary leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500">Property Owner</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm ring-2 ring-white ring-offset-1">
            {user?.name?.charAt(0) || 'O'}
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-error transition-colors p-2 rounded-full hover:bg-surface-container"
            title="Sign Out"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="font-headline font-bold text-4xl text-primary tracking-tight mb-1">
              Good day, {user?.name?.split(' ')[0]}.
            </h1>
            <p className="text-on-surface-variant text-sm">
              {pgs.length === 0
                ? 'Create your first property to get started.'
                : `You own ${pgs.length} ${pgs.length === 1 ? 'property' : 'properties'}.`}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="primary-gradient text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create New PG
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
            <div className="w-24 h-24 primary-gradient rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20 rotate-3">
              <span className="material-symbols-outlined text-5xl text-white">apartment</span>
            </div>
            <h2 className="font-headline font-bold text-2xl text-primary mb-3">No Properties Yet</h2>
            <p className="text-on-surface-variant text-sm mb-8 max-w-sm leading-relaxed">
              You haven't created any PG properties yet. Create your first one to start managing tenants, rooms, and payments.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="primary-gradient text-white px-8 py-4 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Your First PG
            </button>
          </div>
        )}

        {/* PG Grid */}
        {!isLoading && pgs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pgs.map((pg) => (
              <div key={pg._id} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col">
                {/* Card Header */}
                <div className="h-36 primary-gradient relative overflow-hidden">
                  <div className="absolute inset-0">
                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/5"></div>
                  </div>
                  <div className="absolute bottom-4 left-5">
                    <span className="material-symbols-outlined text-white/80 text-4xl">apartment</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                      Active
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-primary leading-snug">{pg.name}</h3>
                    {pg.location ? (
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-xs mt-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span>{pg.location}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-300 mt-1 italic">No location set</div>
                    )}
                  </div>

                  {/* Join code row */}
                  <div className="flex items-center gap-2 bg-surface-container rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">key</span>
                    <span className="font-mono font-bold text-sm tracking-widest text-primary flex-1">{pg.uniqueCode}</span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(pg.uniqueCode); toast.success('Join code copied!'); }}
                      className="w-7 h-7 rounded-md bg-surface-container-high flex items-center justify-center hover:bg-primary-container hover:text-primary transition-colors"
                      title="Copy join code"
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => openPGDashboard(pg)}
                      className="flex-1 primary-gradient text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:opacity-95 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Open PG
                    </button>
                    <button
                      onClick={() => handleDeletePG(pg)}
                      className="w-11 h-11 rounded-xl border border-error/30 text-error flex items-center justify-center hover:bg-error hover:text-white transition-colors shrink-0"
                      title="Delete PG"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add PG card */}
            <button
              onClick={() => setShowCreate(true)}
              className="bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-3 p-8 min-h-[16rem] hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl text-primary">add</span>
              </div>
              <span className="font-bold text-sm text-on-surface-variant group-hover:text-primary transition-colors">Add New Property</span>
            </button>
          </div>
        )}
      </main>

      {/* Create PG Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !isCreating && setShowCreate(false)}
          />
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 primary-gradient rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[18px]">domain_add</span>
                </div>
                <h3 className="font-headline font-bold text-lg text-primary">Create New PG</h3>
              </div>
              <button
                onClick={() => !isCreating && setShowCreate(false)}
                className="text-on-surface-variant hover:text-primary transition-colors"
                disabled={isCreating}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreatePG} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Property Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pgName}
                  onChange={(e) => setPgName(e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. Green Valley PG"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                  Location <span className="text-slate-400 normal-case font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={pgLocation}
                  onChange={(e) => setPgLocation(e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-xl py-3.5 px-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-400"
                  placeholder="e.g. Koramangala, Bangalore"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={isCreating}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors border border-outline-variant/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !pgName.trim()}
                  className="flex-1 primary-gradient text-white py-3 rounded-xl text-sm font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  )}
                  {isCreating ? 'Creating...' : 'Create PG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
