'use client';

import { useState } from 'react';
import ProfileTab      from './ProfileTab';
import VideoTab        from './VideoTab';
import PaymentsTab     from './PaymentsTab';
import SubscriptionTab from './SubscriptionTab';
import IntegrationsTab from './IntegrationsTab';

type Tab = 'profile' | 'video' | 'payments' | 'subscription' | 'integrations';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile',      label: 'Profile' },
  { id: 'video',        label: 'Video & Hardware' },
  { id: 'payments',     label: 'Payment & Payouts' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'integrations', label: 'Integrations' },
];

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div className="fixed inset-0 z-[150] flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1A2E1A] opacity-30 animate-fadeIn" onClick={onClose}  />

      {/* Modal */}
      <div className="relative z-10 flex w-full max-w-[900px] mx-auto my-8 bg-[#F5F0E8] border border-[rgba(0,80,40,0.18)] animate-slideUp">

        {/* Left nav */}
        <div className="w-[200px] flex-shrink-0 border-r border-[rgba(0,80,40,0.18)] flex flex-col">
          <div className="px-5 py-3 border-b border-[rgba(0,80,40,0.18)] flex items-center justify-between">
            <span className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">// settings</span>
            <button
              onClick={onClose}
              className="text-[#7A9A7A] hover:text-[#1A2E1A] text-sm transition-all"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col flex-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-left text-[11px] tracking-widest uppercase border-b border-[rgba(0,80,40,0.12)] transition-all ${
                  activeTab === tab.id
                    ? 'bg-[rgba(0,122,64,0.08)] text-[#007A40] border-l-2 border-l-[#007A40]'
                    : 'text-[#7A9A7A] hover:text-[#1A2E1A] hover:bg-[rgba(0,122,64,0.04)]'
                }`}
              >
                {activeTab === tab.id ? '(*) ' : '( ) '}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-[rgba(0,80,40,0.18)]">
            <button
              onClick={async () => {
                await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
                  method: 'POST', credentials: 'include'
                });
                window.location.href = '/login';
              }}
              className="w-full py-2 border border-[rgba(0,80,40,0.18)] text-[10px] tracking-widest uppercase text-[#7A9A7A] hover:border-[#CC2200] hover:text-[#CC2200] transition-all"
            >
              logout
            </button>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'profile'      && <ProfileTab />}
          {activeTab === 'video'        && <VideoTab />}
          {activeTab === 'payments'     && <PaymentsTab />}
          {activeTab === 'subscription' && <SubscriptionTab />}
          {activeTab === 'integrations' && <IntegrationsTab />}
        </div>
      </div>
    </div>
  );
}