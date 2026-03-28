import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useState } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            <span className="text-xl font-bold text-foreground">DoR-DoD</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {!isAuthenticated ? (
              <>
                <Link to="/pricing" className="text-foreground-muted hover:text-foreground transition-colors">Pricing</Link>
                <Link to="/login" className="text-foreground-muted hover:text-foreground transition-colors">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4 inline-block">Get Started</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="text-foreground-muted hover:text-foreground transition-colors">Dashboard</Link>
                <span className="text-sm text-foreground-muted">Hi, {user?.name?.split(' ')[0]}</span>
                <button onClick={handleLogout} className="btn-outline text-sm py-2 px-4">Logout</button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-foreground p-2">
            {mobileOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3 animate-fade-in">
          {!isAuthenticated ? (
            <>
              <Link to="/pricing" onClick={() => setMobileOpen(false)} className="block text-foreground-muted">Pricing</Link>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-foreground-muted">Login</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block btn-primary text-sm py-2 px-4 text-center">Get Started</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block text-foreground-muted">Dashboard</Link>
              <Link to="/skills" onClick={() => setMobileOpen(false)} className="block text-foreground-muted">Skills</Link>
              <Link to="/goals" onClick={() => setMobileOpen(false)} className="block text-foreground-muted">Goals</Link>
              <Link to="/habits" onClick={() => setMobileOpen(false)} className="block text-foreground-muted">Habits</Link>
              <Link to="/analytics" onClick={() => setMobileOpen(false)} className="block text-foreground-muted">Analytics</Link>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block text-destructive">Logout</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
