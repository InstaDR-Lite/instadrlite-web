'use client';

import { useDashboard } from "@/context/DashboardContext";

interface TopNavProps {
  provider?: { name: string; slug: string | null } | null;
  waitingCount?: number;
}

export default function TopNav({ provider}: TopNavProps) {
  const displayName = provider?.name 
    ? `Dr. ${provider.name.split(' ').slice(-1)[0]}'s Room`
    : 'InstaRoom';

  const { waitingCount } = useDashboard();
  console.log('TopNav waitingCount:', waitingCount);
  
  return (
    <div className="fixed top-0 left-[0] right-0 h-[54px] z-40
                    flex items-center justify-between px-6
                    bg-[#edf1f7] border-b border-[rgba(0,80,40,0.18)]">
      
      <div className="flex items-center gap-3">
        <span className="text-sm tracking-widest uppercase text-[#1A2E1A] font-mono">
          {displayName}
        </span>
        {waitingCount > 0 && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#8B6914] text-[#edf1f7] 
                           text-[9px] font-mono tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#edf1f7] animate-pulse" />
            patient waiting
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-[#7A9A7A] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse" />
          sys:online
        </div>

        {provider?.slug && (
          <div className="flex items-center gap-2 border border-[rgba(0,80,40,0.18)] px-3 py-1">
            <span className="text-[10px] font-mono text-[#3D5C3D]">
              instaroom.link/{provider.slug}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://instaroom.link/${provider.slug}`);
              }}
              className="text-[9px] font-mono tracking-widest uppercase text-[#7A9A7A] 
                        hover:text-[#007A00] transition-all border-l border-[rgba(0,80,40,0.18)] pl-2"
            >
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}