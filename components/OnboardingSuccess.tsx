'use client';

import { useRouter } from 'next/navigation';

interface Props {
  slug: string;
  providerName: string;
}

export default function OnboardingSuccess({ slug, providerName }: Props) {
  const router = useRouter();
  const roomUrl = `instaroom.link/rm/${slug}`;

  return (
    <div className="p-6 flex flex-col gap-6 items-center text-center">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="text-[10px] text-[#007A40] tracking-widest uppercase font-mono">
          // room is live
        </div>
        <div className="text-2xl font-semibold text-[#1A2E1A]">
          Your room is live{providerName ? `, ${providerName.split(' ')[0]}` : ''}.
        </div>
        <p className="text-[11px] text-[#7A9A7A] font-mono">
          Share your room link with patients — it never changes.
        </p>
      </div>

      {/* Room URL */}
      <div className="w-full border border-[rgba(0,80,40,0.18)] bg-[#EDE8DC] p-4 flex items-center justify-between gap-3">
        <span className="font-mono text-[14px] text-[#007A40]">{roomUrl}</span>
        <button
          onClick={() => navigator.clipboard.writeText(`https://${roomUrl}`)}
          className="text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A]
                     border border-[rgba(0,80,40,0.18)] px-3 py-1.5
                     hover:border-[#007A40] hover:text-[#007A40] transition-all"
        >
          Copy
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full">
        <a
          href={`https://${roomUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 border border-[#007A40] text-[10px] tracking-widest
                     uppercase text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]
                     transition-all font-mono text-center block"
        >
          [ View your room → ]
        </a>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full py-3 border border-[rgba(0,80,40,0.18)] text-[10px]
                     tracking-widest uppercase text-[#7A9A7A]
                     hover:border-[#007A40] hover:text-[#007A40] transition-all font-mono"
        >
          Go to dashboard
        </button>
      </div>

      {/* Next steps hint */}
      <p className="text-[10px] font-mono text-[#7A9A7A]">
        // configure payments and calendar in Settings anytime
      </p>
    </div>
  );
}