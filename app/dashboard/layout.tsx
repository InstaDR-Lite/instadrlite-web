'use client';
import { useState } from 'react';
import TopNav from '@/components/layout/TopNav';
import SettingsModal from '@/components/settings/SettingsModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-[#edf1f7]">
      <TopNav onSettingsOpen={() => setShowSettings(true)} />
      <main className="pt-[88px] h-screen">{children}</main>
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}