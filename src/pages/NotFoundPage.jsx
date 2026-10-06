import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <>
      <title>404 — NairaFlow</title>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-6xl mb-4">🔍</span>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: 'var(--color-brand)' }}
        >
          Back to Dashboard
        </Link>
      </div>
    </>
  );
}
