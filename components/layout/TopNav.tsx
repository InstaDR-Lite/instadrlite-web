'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function TopNav() {
  const pathname = usePathname();
  const isDash   = pathname === '/dashboard';
  const router = useRouter();
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 font-mono">

      {/* Level 1 — Identity + Status */}
      <div className="h-[48px] flex items-center justify-between px-6 border-b border-[rgba(0,80,40,0.18)] bg-[#edf1f7]">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="border border-[rgba(0,80,40,0.30)] px-2 py-0.5 text-[#007A40] text-xs font-bold tracking-wider">
            iD
          </span>
          <span className="text-sm tracking-widest uppercase text-[#1A2E1A]">
            InstaDR<span className="text-[#7A9A7A]">-Lite</span>
          </span>
        </div>

        {/* Status + Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase text-[#7A9A7A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#007A40] animate-pulse" />
            sys:online
          </div>
          <button className="w-7 h-7 border border-[rgba(0,80,40,0.18)] flex items-center justify-center text-[#7A9A7A] hover:border-[#007A40] hover:text-[#007A40] transition-all text-xs">
            ⚙
          </button>
        </div>
      </div>


      {/* Level 2 — Navigation + Actions */}
      <div className="h-[40px] grid grid-cols-3 items-center px-6 border-b border-[rgba(0,80,40,0.18)] bg-[#e4eaf4]">
        
        {/* Left — empty spacer */}
        <div />

        {/* Center — Pills */}
        <div className="flex items-center  justify-center">
          <div className="flex items-center gap-2  border border-[rgba(0,80,40,0.18)]">
            <button
              onClick={() => router.push('/dashboard')}
              className={`px-5 h-[28px] text-[10px] tracking-widest uppercase transition-all border-r border-[rgba(0,80,40,0.18)] ${
                isDash
                  ? 'bg-[rgba(0,122,64,0.10)] text-[#007A40]'
                  : 'text-[#7A9A7A] hover:text-[#007A40]'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push('/calendar')}
              className={`px-5 h-[28px] text-[10px] tracking-widest uppercase transition-all ${
                !isDash
                  ? 'bg-[rgba(0,122,64,0.10)] text-[#007A40]'
                  : 'text-[#7A9A7A] hover:text-[#007A40]'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>

        {/* Right — New Appt */}
        {/* <div className="flex justify-end">
          <button className="hidden md:block border border-[#007A40] px-3 h-[28px] text-[10px] tracking-widest uppercase text-[#007A40] hover:bg-[#007A40] hover:text-[#edf1f7] transition-all">
            + new appt
          </button>
        </div> */}
      </div>    
    </div>
  );
}