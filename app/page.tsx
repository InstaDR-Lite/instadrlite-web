'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      credentials: 'include'
    })
      .then(r => r.json())
      .then(({ provider }) => {
        console.log('Provider', provider);
        if (!provider) {
          router.push('/login');
        } else if (!provider.onboarding_complete) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  return null;
}