import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function SetupPG() {
  const { user, updateUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const isTenant = user?.role === 'tenant';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleJoinPG = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.post('/pg/join', { uniqueCode: joinCode });
      toast.success('Successfully joined the PG!');
      updateUser({ pg: res.data._id, role: 'tenant' });
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid PG Code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 relative">
      {/* Back to login */}
      <button
        onClick={handleLogout}
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-bold text-sm bg-surface-container py-2 px-4 rounded-full shadow-sm"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Login
      </button>

      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 primary-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 rotate-3">
              <span className="material-symbols-outlined text-white text-[32px]">nest_eco_leaf</span>
            </div>
          </div>
          <h1 className="font-headline font-bold text-3xl text-primary tracking-tight mb-2">Join Your PG</h1>
          <p className="font-body text-on-surface-variant">Enter the join code provided by your PG owner to connect to your property.</p>
        </div>

        {/* Form */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-xl border border-outline-variant/10">
          <form onSubmit={handleJoinPG} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                PG Join Code
              </label>
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full bg-surface-container-high border-none rounded-xl py-5 px-5 text-xl uppercase tracking-[0.3em] text-center font-headline font-bold text-primary focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-slate-300 placeholder:font-normal placeholder:text-lg placeholder:tracking-normal"
                placeholder="XXXXXX"
                maxLength={6}
              />
              <p className="text-xs text-on-surface-variant text-center mt-2">6-character alphanumeric code from your owner</p>
            </div>

            <button
              disabled={isSubmitting || joinCode.length < 6}
              type="submit"
              className="primary-gradient w-full py-4 rounded-xl text-white font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting
                ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                : <span className="material-symbols-outlined text-[18px]">login</span>
              }
              {isSubmitting ? 'Joining...' : 'Join PG'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-surface-container text-center">
            <p className="text-xs text-on-surface-variant">
              Are you a property owner?{' '}
              <a href="/register" className="font-bold text-secondary hover:underline">
                Create an owner account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
