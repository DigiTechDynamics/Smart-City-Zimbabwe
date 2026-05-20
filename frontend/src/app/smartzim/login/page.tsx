"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToSmartCityZimLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/smartcityzim/login');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top right, #1a1a2e, #0a0c10)', color: '#fff' }}>
      <p>Redirecting to the new admin login page...</p>
    </div>
  );
}
