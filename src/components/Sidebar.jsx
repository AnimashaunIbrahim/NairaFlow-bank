import { NavLink } from 'react-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/send', label: 'Send Money', icon: '💸' },
  { to: '/savings', label: 'Savings', icon: '🏦' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();

  return (
    <aside
      className="hidden md:flex flex-col gap-1 p-4 border-r min-h-screen w-[260px] shrink-0 transition-colors"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 py-4 mb-4">
        <span className="text-2xl">💰</span>
        <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-brand)' }}>
          NairaFlow
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                isActive ? 'font-semibold' : ''
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { background: 'var(--color-brand-light)', color: 'var(--color-brand-dark)' }
                : { color: 'var(--color-text-secondary)' }
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="mt-auto flex flex-col gap-2 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {/* Interactive Theme Toggle Button */}
        <button
          onClick={toggle}
          id="theme-toggle-btn"
          className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm w-full cursor-pointer transition-colors hover:opacity-85 border"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)', color: 'var(--color-text)' }}
          title={`Click to switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="flex items-center gap-2.5">
            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </span>
          <span
            className="text-[11px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
          >
            {theme}
          </span>
        </button>

        {/* Logout button */}
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-left cursor-pointer transition-colors hover:opacity-85 text-red-500 font-medium"
        >
          <span className="text-lg">🚪</span>
          Log Out
        </button>
      </div>
    </aside>
  );
}
