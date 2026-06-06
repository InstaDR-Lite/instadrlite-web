'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TopNav from '@/components/layout/TopNav';
import SettingsModal from '@/components/settings/SettingsModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showSettings, setShowSettings] = useState(false);
  const [defaultTab,   setDefaultTab]   = useState<string>('profile');
  const searchParams = useSearchParams();

  const router = useRouter();


  useEffect(() => {
    const settings   = searchParams.get('settings');
    const error      = searchParams.get('error');

    setTimeout(() => {
      if (settings) {
        setDefaultTab(settings);
        setShowSettings(true);
        router.replace('/dashboard');
      }

      if (error === 'connect_failed') {
        setDefaultTab('payments');
        setShowSettings(true);
        router.replace('/dashboard');
      }
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