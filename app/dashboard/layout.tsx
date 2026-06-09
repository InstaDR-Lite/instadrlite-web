'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopNav from '@/components/layout/TopNav';
import SettingsModal from '@/components/settings/SettingsModal';
import { Suspense } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  return (
    <Suspense fallback={null}>

      <DashboardLayoutInner>
        {children}
      </DashboardLayoutInner>
    </Suspense>
  )
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [showSettings, setShowSettings] = useState(false);
  const [defaultTab, setDefaultTab] = useState<string>('profile');
  const searchParams = useSearchParams();

  const router = useRouter();


  useEffect(() => {
    const settings = searchParams.get('settings');
    const sessionId = searchParams.get('session_id');
    const error = searchParams.get('error');

    setTimeout(async () => {
      // Check subscription status if session_id present
      if (sessionId) {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/subscription/status?session_id=${sessionId}`,
          { credentials: 'include' }
        );
      }

      if (settings) {
        setDefaultTab(settings);
        setShowSettings(true);
      }

      if (error === 'connect_failed') {
        setDefaultTab('payments');
        setShowSettings(true);
      }

      if (settings || error) router.replace('/dashboard');
    }, 0);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#edf1f7]">
      <TopNav onSettingsOpen={() => setShowSettings(true)} />
      <main className="pt-[88px] h-screen">{children}</main>
      {showSettings && (
        <SettingsModal
          defaultTab={defaultTab as any}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}