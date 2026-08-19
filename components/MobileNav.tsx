'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Video, Calendar, FileText, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard',  icon: <Video size={20} />,     label: 'Room' },
  { href: '/calendar',   icon: <Calendar size={20} />,  label: 'Calendar' },
  { href: '/emr',    icon: <FileText size={20} />,  label: 'Records' },
];

interface Props {
  onSettingsOpen: () => void;
}

export default function MobileNav({ onSettingsOpen }: Props) {
  const pathname = usePathname();
  const router   = useRouter();

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90vw]">
      <div className="flex items-center gap-1 px-3 py-2
                      bg-[rgba(237,241,247,0.85)] backdrop-blur-md
                      border border-[rgba(0,80,40,0.15)]
                      rounded-full shadow-lg justify-between">

        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
           <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={`w-11 h-11 flex flex-col items-center justify-center gap-0.5
                        rounded-full transition-all relative
                        ${isActive ? 'text-[#007A40]' : 'text-[#7A9A7A] hover:text-[#007A40]'}`}
          >
            {item.icon}
            <span className="text-[8px] font-mono tracking-widest uppercase">
              {item.label}
            </span>
            {isActive && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#007A40] rounded-full" />
            )}
          </button>
          );
        })}

        {/* Divider */}
        <div className="w-px h-6 bg-[rgba(0,80,40,0.15)] mx-1" />

        {/* Settings */}
        <button
          onClick={onSettingsOpen}
          className="w-11 h-11 flex flex-col items-center justify-center gap-0.5
                     rounded-full text-[#7A9A7A] hover:text-[#007A40] transition-all"
        >
          <Settings size={20} />
          <span className="text-[8px] font-mono tracking-widest uppercase">Settings</span>
        </button>

      </div>
    </div>
  );
}