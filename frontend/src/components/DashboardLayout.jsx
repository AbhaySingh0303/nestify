import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';

export default function DashboardLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { pgId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isOwner = user?.role === 'owner' || user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Build base path for owner routes (includes pgId if present)
  const base = pgId ? `/dashboard/${pgId}` : '';

  const ownerNavigation = pgId ? [
    { name: 'Overview',   href: `/dashboard/${pgId}`,           icon: 'dashboard' },
    { name: 'Rooms',      href: `/dashboard/${pgId}/rooms`,     icon: 'bed' },
    { name: 'Residents',  href: `/dashboard/${pgId}/tenants`,   icon: 'group' },
    { name: 'Payments',   href: `/dashboard/${pgId}/payments`,  icon: 'payments' },
    { name: 'Complaints', href: `/dashboard/${pgId}/complaints`,icon: 'support_agent' },
  ] : [
    { name: 'Overview',   href: '/',           icon: 'dashboard' },
    { name: 'Rooms',      href: '/rooms',      icon: 'bed' },
    { name: 'Residents',  href: '/tenants',    icon: 'group' },
    { name: 'Payments',   href: '/payments',   icon: 'payments' },
    { name: 'Complaints', href: '/complaints', icon: 'support_agent' },
  ];

  const tenantNavigation = [
    { name: 'My Room', href: '/', icon: 'home' },
    { name: 'My Payments', href: '/my-payments', icon: 'payments' },
    { name: 'My Complaints', href: '/my-complaints', icon: 'support_agent' },
  ];

  const navigation = isOwner ? ownerNavigation : tenantNavigation;

  return (
    <div className="bg-surface font-body text-on-surface antialiased flex min-h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SideNavBar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-slate-100 flex flex-col h-full py-6 pl-4 transition-transform duration-300 ease-in-out md:translate-x-0`}>
        <div className="mb-10 pl-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Nestify" className="h-9 w-9 object-contain" style={{mixBlendMode:'multiply'}} />
              <h1 className="font-manrope font-extrabold text-primary text-2xl tracking-tight">Nestify</h1>
            </div>
            <p className="text-slate-500 font-inter text-xs font-medium uppercase tracking-widest mt-1">
              {isOwner ? 'Owner Portal' : 'Resident Portal'}
            </p>
          </div>
          <button className="md:hidden pr-4 text-slate-500 hover:text-primary" onClick={() => setSidebarOpen(false)}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {/* Back to My PGs for owners */}
        {isOwner && (
          <div className="pl-4 pr-4 mb-4">
            <button
              onClick={() => navigate('/owner-dashboard')}
              className="w-full flex items-center gap-2 text-xs font-bold text-primary bg-primary-container/30 hover:bg-primary-container/50 py-2 px-3 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              All Properties
            </button>
          </div>
        )}
        
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const active = location.pathname === item.href ||
              location.pathname.startsWith(item.href + '/') ||
              (item.href.startsWith('/dashboard/') && location.pathname === item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={
                  active 
                    ? "bg-white text-primary rounded-l-xl shadow-sm flex items-center px-4 py-3 group transition-all ease-in-out"
                    : "text-slate-600 hover:text-primary flex items-center px-4 py-3 group transition-transform duration-200 hover:translate-x-1"
                }
                onClick={() => setSidebarOpen(false)}
              >
                <span className="material-symbols-outlined mr-3" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
                <span className="font-inter text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-auto border-t border-slate-200 pt-6 pr-4 flex flex-col gap-1">
          <button onClick={handleLogout} className="text-slate-600 hover:text-error flex items-center px-4 py-2 transition-transform duration-200 hover:translate-x-1 w-full text-left">
            <span className="material-symbols-outlined mr-3">logout</span>
            <span className="font-inter text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
        {/* TopAppBar */}
        <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md flex justify-between items-center w-full px-4 sm:px-8 py-4">
          <div className="flex items-center gap-4 sm:gap-8">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-primary">
               <span className="material-symbols-outlined">menu</span>
            </button>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Nestify" className="h-7 w-7 object-contain" style={{mixBlendMode:'multiply'}} />
                <span className="font-headline font-bold text-primary text-xl hidden sm:block">
                  {isOwner ? 'Owner Portal' : 'Nestify'}
                </span>
              </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-primary leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{isOwner ? 'Property Owner' : 'Resident'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary overflow-hidden ring-2 ring-white ring-offset-2 ring-offset-slate-100 flex items-center justify-center text-white font-bold">
                 {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-4 sm:p-8 md:p-12 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
