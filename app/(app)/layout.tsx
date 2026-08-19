'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Video, CalendarDays, ScrollText, Settings, LogOut } from 'lucide-react';
import SettingsModal from '@/components/settings/SettingsModal';
import { Suspense } from 'react';
import TopNav from '@/components/layout/TopNav';
import { DashboardProvider } from '@/context/DashboardContext';
import MobileNav from '@/components/MobileNav';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

// ─── NAV ITEMS ──────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  { icon: <Video size={18} />,        label: 'Room',     href: '/dashboard' },
  { icon: <CalendarDays size={18} />, label: 'Calendar', href: '/calendar'  },
  { icon: <ScrollText size={18} />,   label: 'EMRLite',  href: '/emr'   },
];

// ─── TOOLTIP ────────────────────────────────────────────────────────────────

function Tooltip({ label }: { label: string }) {
  return (
    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50
                    px-2 py-1 bg-[#1A2E1A] text-[#edf1f7] text-[10px]
                    tracking-widest uppercase whitespace-nowrap pointer-events-none
                    opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {label}
    </div>
  );
}

// ─── ACCOUNT POPUP ──────────────────────────────────────────────────────────

function AccountPopup({
  provider,
  onSettings,
  onClose,
}: {
  provider: any;
  onSettings: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleLogout = async () => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  };


  return (
    <div
      ref={ref}
      className="absolute bottom-full left-full mb-2 ml-2 z-50
                 w-[220px] bg-[#F5F0E8] border border-[rgba(0,80,40,0.18)]
                 shadow-lg"
    >
      {/* Provider info */}
      <div className="px-4 py-3 border-b border-[rgba(0,80,40,0.12)]">
        <div className="font-mono text-[13px] font-semibold text-[#1A2E1A]">
          {provider?.name ?? 'Provider'}
        </div>
        <div className="font-mono text-[10px] text-[#7A9A7A] mt-0.5 truncate">
          {provider?.email}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => { onSettings(); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px]
                   tracking-widest uppercase font-mono text-[#3D5C3D]
                   hover:bg-[rgba(0,122,64,0.06)] transition-all text-left"
      >
        <Settings size={13} />
        Settings
      </button>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-[10px]
                   tracking-widest uppercase font-mono text-[#CC2200]
                   hover:bg-[rgba(204,34,0,0.06)] transition-all text-left
                   border-t border-[rgba(0,80,40,0.08)]"
      >
        <LogOut size={13} />
        Log out
      </button>
    </div>
  );
}

// ─── SIDEBAR ────────────────────────────────────────────────────────────────

function Sidebar({
  onSettingsOpen,
}: {
  onSettingsOpen: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(({ provider }) => setProvider(provider))
      .catch(() => {});
  }, []);

  const initial = provider?.name?.[0]?.toUpperCase() ?? 'P';

  return (
    <>
      <TopNav provider={provider}/>
      <aside className=" hidden md:flex fixed top-[54px] left-0 h-[calc(100vh-54px)] w-[56px] z-50
                    flex-col items-center py-4 gap-2
                    bg-[#edf1f7] border-r border-[rgba(0,80,40,0.18)]">


        {/* Nav items */}
        <nav className="flex flex-col items-center gap-4 flex-1">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <div key={item.href} className="relative group">
                <button
                  onClick={() => router.push(item.href)}
                  className={`w-9 h-9 flex items-center justify-center
                              border transition-all
                              ${isActive
                                ? 'border-[#007A40] text-[#007A40] bg-[rgba(0,122,64,0.08)]'
                                : 'border-transparent text-[#7A9A7A] hover:border-[rgba(0,80,40,0.18)] hover:text-[#007A40]'
                              }`}
                >
                  {item.icon}
                </button>
                <Tooltip label={item.label} />
              </div>
            );
          })}
        </nav>

        {/* Account avatar — bottom */}
        <div className="hidden md:flex relative">
          <button
            onClick={() => setShowPopup(p => !p)}
            className="w-9 h-9 flex items-center justify-center
                      border border-[rgba(0,80,40,0.18)] text-[#007A40]
                      text-[11px] font-bold font-mono
                      hover:border-[#007A40] transition-all bg-[rgba(0,122,64,0.06)]"
          >
            {initial}
          </button>

          {showPopup && (
            <AccountPopup
              provider={provider}
              onSettings={onSettingsOpen}
              onClose={() => setShowPopup(false)}
            />
          )}
        </div>
      </aside>
    </>
  );
}

// ─── LAYOUT ─────────────────────────────────────────────────────────────────

export default function DashboardLayoutSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <DashboardProvider>
        <DashboardLayoutSidebarInner>
          {children}
        </DashboardLayoutSidebarInner>
      </DashboardProvider>
    </Suspense>
  );
}

function DashboardLayoutSidebarInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [defaultTab, setDefaultTab] = useState<string>('room');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const settings = searchParams.get('settings');
    const sessionId = searchParams.get('session_id');
    const error = searchParams.get('error');

    if (!settings && !sessionId && !error) return;

    const handleParams = async () => {
      if (sessionId) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/stripe/subscription/status?session_id=${sessionId}`,
            { credentials: 'include' }
          );
        } catch (err) {
          console.error('Failed to verify subscription:', err);
        }
      }

      if (settings) {
        setDefaultTab(settings);
        setShowSettings(true);
      }

      if (error === 'connect_failed') {
        setDefaultTab('payments');
        setShowSettings(true);
      }

      router.replace('/dashboard');
    };

    handleParams();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#edf1f7]">
    <Sidebar onSettingsOpen={() => setShowSettings(true)} />
    
    <MobileNav onSettingsOpen={() => setShowSettings(true)} />

    <main className="md:pl-[56px] pt-[54px] h-screen pb-24 md:pb-0">
      {children}
    </main>

    {showSettings && (
      <SettingsModal
        defaultTab={defaultTab as any}
        onClose={() => setShowSettings(false)}
      />
    )}
  </div>
  );
}




