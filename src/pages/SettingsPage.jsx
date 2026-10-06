import { useTheme } from '../contexts/ThemeContext';

export default function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <>
      <title>Settings — NairaFlow</title>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="space-y-6 max-w-lg">
        {/* Profile */}
        <section className="rounded-xl border p-6 transition-colors" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ background: 'var(--color-brand)' }}>
              CO
            </div>
            <div>
              <p className="font-semibold">Chinedu Okafor</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>chinedu@email.com</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-brand)' }}>Verified Tier 3 Account</p>
            </div>
          </div>
        </section>

        {/* Appearance / Theme Settings */}
        <section className="rounded-xl border p-6 transition-colors" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold mb-2">Appearance</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Switch between light and dark visual themes.
          </p>
          <div className="flex items-center justify-between p-3 rounded-lg border" style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
              <div>
                <p className="text-sm font-semibold">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Active theme is {theme}
                </p>
              </div>
            </div>
            <button
              onClick={toggle}
              id="settings-theme-toggle-btn"
              className="px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors shadow-sm hover:opacity-90"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            >
              Toggle to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-xl border p-6 transition-colors" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          <h2 className="font-semibold mb-4">Notifications</h2>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm">Email notifications</span>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm">Push notifications</span>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm">Transaction alerts</span>
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </label>
        </section>

        {/* Danger Zone */}
        <section className="rounded-xl border p-6 transition-colors" style={{ borderColor: 'var(--color-error)' }}>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--color-error)' }}>Danger Zone</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            This will clear all local cache, auth session, and reset the app state.
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/login';
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
            style={{ background: 'var(--color-error)' }}
          >
            Reset App Data & Log Out
          </button>
        </section>
      </div>
    </>
  );
}
