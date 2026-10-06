import { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate, NavLink } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import SendMoneyPage from './pages/SendMoneyPage';
import SavingsPage from './pages/SavingsPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 2 },
  },
});

/** Layout with persistent sidebar and responsive mobile header */
function DashboardLayout() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen" style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)' }}>
      {/* Mobile Top Header */}
      <header
        className="md:hidden flex items-center justify-between px-4 py-3 border-b sticky top-0 z-30 transition-colors"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <span className="font-bold text-base" style={{ color: 'var(--color-brand)' }}>NairaFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-lg border text-sm cursor-pointer transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)' }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg border text-sm cursor-pointer"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)' }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Nav */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden flex flex-col p-4 border-b space-y-2 sticky top-[53px] z-20 transition-colors"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <NavLink
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={({ isActive }) => (isActive ? { background: 'var(--color-brand-light)', color: 'var(--color-brand-dark)' } : { color: 'var(--color-text-secondary)' })}
          >
            📊 Dashboard
          </NavLink>
          <NavLink
            to="/send"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={({ isActive }) => (isActive ? { background: 'var(--color-brand-light)', color: 'var(--color-brand-dark)' } : { color: 'var(--color-text-secondary)' })}
          >
            💸 Send Money
          </NavLink>
          <NavLink
            to="/savings"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={({ isActive }) => (isActive ? { background: 'var(--color-brand-light)', color: 'var(--color-brand-dark)' } : { color: 'var(--color-text-secondary)' })}
          >
            🏦 Savings
          </NavLink>
          <NavLink
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={({ isActive }) => (isActive ? { background: 'var(--color-brand-light)', color: 'var(--color-brand-dark)' } : { color: 'var(--color-text-secondary)' })}
          >
            ⚙️ Settings
          </NavLink>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
            }}
            className="text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 cursor-pointer"
          >
            🚪 Log Out
          </button>
        </nav>
      )}

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

/** Auth guard — redirects to /login if not authenticated */
function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Interactive Login page */
function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('chinedu@email.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  // If already authenticated, redirect straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    const success = login(email, password);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('Login failed. Please check your credentials.');
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 transition-colors relative"
      style={{ background: 'var(--color-surface-alt)', color: 'var(--color-text)' }}
    >
      {/* Top right theme toggle on login page */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggle}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border p-8 w-full max-w-sm space-y-4 shadow-xl transition-colors"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="text-center mb-6">
          <span className="text-4xl inline-block mb-1">💰</span>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>NairaFlow</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in to your fintech dashboard
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-xs font-medium border border-red-300 bg-red-50 text-red-700 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Email address
          </label>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="chinedu@email.com"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)' }}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Password
          </label>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)' }}
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'var(--color-brand)' }}
        >
          Sign In
        </button>

        <p className="text-xs text-center pt-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Demo credentials ready. Click <strong>Sign In</strong> to explore.
        </p>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Protected routes with sidebar layout */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/send" element={<SendMoneyPage />} />
                    <Route path="/savings" element={<SavingsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                </Route>

                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
