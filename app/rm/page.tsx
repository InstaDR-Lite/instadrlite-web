'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function RoomFinderPage() {
  const [roomSlug, setRoomSlug] = useState('');
  const [searchName, setSearchName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleEnterRoom = async () => {
    if (!roomSlug.trim()) return;
    const slug = roomSlug.trim().toLowerCase();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/slug/${slug}`
    );
    const data = await res.json();
    if (data.success) {
      router.push(`/rm/${slug}`);
    } else {
      setError(`No room found for "instaroom.link/rm/${slug}". Please check the URL and try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[480px] flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center px-2">
        <Image
          src="/instaroom-wordmark-8-currentcolor.svg"
          alt="InstaRoom logo"
          width={122}
          height={30}
        />
        </div>

        {/* Enter room by slug */}
        <div className="bg-[#F5F0E8] border border-[rgba(0,80,40,0.18)] p-5 flex flex-col gap-3">
          <div className="text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A]">
            // enter a room
          </div>
          <div className="text-base font-semibold text-[#1A2E1A]">
            Have a room link?
          </div>
          <div className="flex items-center border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC]">
            <span className="px-3 text-[11px] font-mono text-[#7A9A7A] border-r border-[rgba(0,80,40,0.18)] py-2.5 whitespace-nowrap">
              instaroom.link/rm/
            </span>
            <input
              type="text"
              value={roomSlug}
              onChange={e => { setRoomSlug(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleEnterRoom()}
              placeholder="dr-noah"
              className="flex-1 px-3 py-2.5 bg-transparent font-mono text-[13px]
                         text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none"
            />
          </div>

          {error && (
            <p className="font-mono text-[11px] text-[#CC2200]">// {error}</p>
          )}

          <button
            onClick={handleEnterRoom}
            disabled={!roomSlug.trim()}
            className="w-full py-2.5 border border-[#007A40] text-[10px] tracking-widest
                       uppercase font-mono text-[#007A40] hover:bg-[#007A40]
                       hover:text-[#F5F0E8] transition-all disabled:opacity-40
                       disabled:cursor-not-allowed"
          >
            [ Lookup Room → ]
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[rgba(0,80,40,0.12)]" />
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A]">or</span>
          <div className="flex-1 h-px bg-[rgba(0,80,40,0.12)]" />
        </div>

        {/* Search by provider name */}
        <div className="bg-[#F5F0E8] border border-[rgba(0,80,40,0.18)] p-5 flex flex-col gap-3">
          <div className="text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A]">
            // find a provider
          </div>
          <div className="text-base font-semibold text-[#1A2E1A]">
            Search by provider name
          </div>
          <input
            type="text"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            placeholder="Noah ..."
            className="px-3 py-2.5 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]
                       font-mono text-[13px] text-[#1A2E1A] placeholder:text-[#7A9A7A]
                       focus:outline-none focus:border-[#007A40] transition-all"
          />
          <button
            disabled
            className="w-full py-2.5 border border-[rgba(0,80,40,0.18)] text-[10px]
                       tracking-widest uppercase font-mono text-[#7A9A7A]
                       cursor-not-allowed opacity-50"
          >
            [ Search → ] // coming soon
          </button>
        </div>

        <p className="text-center text-[10px] font-mono text-[#7A9A7A]">
          powered by{' '}
          <a href="https://getinstaroom.com" className="text-[#007A40] hover:underline">
            getinstaroom.com
          </a>
        </p>

      </div>
    </div>
  );
}