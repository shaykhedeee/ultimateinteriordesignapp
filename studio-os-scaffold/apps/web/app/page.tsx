import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 40 }}>
      <h1>StudioOS Scaffold</h1>
      <p>Open the primary workspace:</p>
      <Link href="/command-center">Go to Command Center</Link>
    </main>
  );
}
