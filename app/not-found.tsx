import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="glass-card empty-state" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <h1 className="page-title" style={{ marginBottom: 12 }}>Page Not Found</h1>
      <p className="muted" style={{ marginBottom: 24 }}>The battle or page you are looking for does not exist.</p>
      <Link href="/" className="glass-button primary-button" style={{ display: 'inline-block', padding: '10px 20px' }}>
        Back to Battles
      </Link>
    </div>
  );
}
