'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopNav from '@/components/layout/TopNav';
import SettingsModal from '@/components/settings/SettingsModal';
import { Suspense } from 'react';
import CallLogDrawer from '@/components/callLogDrawer/CallLogDrawer';

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
  const [showCallLog, setShowCallLog] = useState(false);
  const [defaultTab, setDefaultTab] = useState<string>('room');
  const searchParams = useSearchParams();

  const router = useRouter();

  useEffect(() => {
    const settings = searchParams.get('settings');
    const sessionId = searchParams.get('session_id');
    const error = searchParams.get('error');

    // GUARD: If none of our target parameters are in the URL, stop immediately.
    // This prevents the infinite loop after router.replace('/dashboard') runs.
    if (!settings && !sessionId && !error) return;

    const handleDashboardParams = async () => {
      // 1. Handle Stripe verification if a session exists
      if (sessionId) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/subscription/status?session_id=${sessionId}`,
            { credentials: 'include' }
          );
        } catch (err) {
          console.error("Failed to verify subscription status:", err);
        }
      }

      // 2. Handle UI View states synchronously 
      if (settings) {
        setDefaultTab(settings);
        setShowSettings(true);
      }

      if (error === 'connect_failed') {
        setDefaultTab('payments');
        setShowSettings(true);
      }

      // 3. Clean the URL bar completely
      router.replace('/dashboard');
    };

    handleDashboardParams();
  }, [searchParams, router, setDefaultTab, setShowSettings]);

  return (
    <div className="min-h-screen bg-[#edf1f7]">
      <TopNav
        onSettingsOpen={() => setShowSettings(true)}
        onShowCallLogDrawer={() => setShowCallLog(true) }
      />
      <main className="pt-[88px] h-screen">{children}</main>
      {showSettings && (
        <SettingsModal
          defaultTab={defaultTab as any}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showCallLog && (
        <CallLogDrawer
          onClose={() => setShowCallLog(false)}
        />
      )}
    </div>
  );
}