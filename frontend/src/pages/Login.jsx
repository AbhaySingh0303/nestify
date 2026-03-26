import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(email, password);
      toast.success('Logged in successfully');

      // Role-based routing
      if (userData.role === 'owner' || userData.role === 'admin') {
        if (userData.pgs && userData.pgs.length > 0) {
          navigate('/owner-dashboard');
        } else if (userData.pg) {
          navigate('/owner-dashboard'); // Will refetch from backend
        } else {
          navigate('/setup');
        }
      } else {
        // tenant
        if (userData.pg) {
          navigate('/');
        } else {
          navigate('/setup');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <img src="/logo.png" alt="Nestify" className="h-20 w-20 object-contain mb-4" style={{mixBlendMode:'multiply'}} />
          <h2 className="text-center text-3xl font-headline font-extrabold text-primary tracking-tight">
            Welcome to Nestify
          </h2>
          <p className="mt-3 text-center text-sm font-medium text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-secondary hover:text-secondary-fixed transition-colors underline-offset-4 hover:underline">
              Create one now
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md z-10 relative px-4 sm:px-0">
        <div className="glass-panel py-10 px-6 sm:px-12 rounded-[2rem] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-surface-container/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant tracking-widest uppercase mb-2 ml-1">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest/80 border border-outline-variant/30 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">Password</label>
                <a href="#" className="text-xs font-bold text-secondary hover:text-secondary-fixed transition-colors">Forgot?</a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-surface-container-lowest/80 border border-outline-variant/30 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm font-medium"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full primary-gradient flex justify-center items-center py-4 px-4 border border-transparent rounded-xl shadow-md shadow-primary/20 text-sm font-bold text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all group"
              >
                Sign In To Dashboard
                <span className="material-symbols-outlined ml-2 text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-surface-container relative">
              <div className="bg-surface-container-low text-on-surface-variant rounded-lg p-4 text-xs font-medium flex gap-3 text-left">
                <span className="material-symbols-outlined text-tertiary">info</span>
                <p>
                  <strong>Seed Admin:</strong> admin@nestify.com <br/>
                  <strong>Password:</strong> 123456
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
