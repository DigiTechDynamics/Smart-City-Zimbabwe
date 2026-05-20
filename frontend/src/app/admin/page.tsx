"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToSmartZim() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/smartzim');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top right, #1a1a2e, #0a0c10)', color: '#fff' }}>
      <p>Redirecting to the new dashboard page...</p>
    </div>
  );
}
