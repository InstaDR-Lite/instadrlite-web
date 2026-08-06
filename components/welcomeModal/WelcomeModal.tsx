'use client';

import { useState } from 'react';
import { Link2, CreditCard, CalendarDays, Settings2, ExternalLink, Copy, Check } from 'lucide-react';

interface Provider {
  name: string;
  slug: string | null;
  stripe_id: string | null;
  google_id: string | null;
  payment_mode: string | null;
}

interface WelcomeModalProps {
  provider: Provider;
  onDismiss: () => void;
  onOpenSettings: (tab: string) => void;
}

interface Step {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  done: boolean;
}

export default function WelcomeModal({ provider, onDismiss, onOpenSettings }: WelcomeModalProps) {
  const [copied, setCopied] = useState(false);

  const roomUrl = provider.slug
    ? `instaroom.link/${provider.slug}`
    : null;

  const handleCopy = () => {
    if (!roomUrl) return;
    navigator.clipboard.writeText(`https://${roomUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = (onClick: () => void) => {
    onDismiss();
    onClick();
  };

  const stripeConnected = !!provider.stripe_id;
  const calendarConnected = !!provider.google_id;
  const isEmailSignup = !provider.google_id;

  const steps: Step[] = [
    {
      id: 'stripe',
      icon: <CreditCard size={16} />,
      title: 'Connect Stripe to collect payments',
      description: stripeConnected
        ? 'Stripe connected. No-show protection and automated billing are active.'
        : 'Your scheduling link is live, but clients cannot pre-pay yet.',
      action: stripeConnected ? undefined : {
        label: 'Configure payments →',
        onClick: () => onOpenSettings('payments'),
      },
      done: stripeConnected,
    },
    {
      id: 'share',
      icon: <Link2 size={16} />,
      title: 'Share your room link',
      description: 'Add it to your Psychology Today profile, website, or email signature.',
      done: false,
    },
    {
      id: 'settings',
      icon: <Settings2 size={16} />,
      title: 'Configure your room hours',
      description: 'Set your available days, hours, and session duration.',
      action: {
        label: 'Room settings →',
        onClick: () => onOpenSettings('room'),
      },
      done: false,
    },
    ...(isEmailSignup ? [{
      id: 'calendar',
      icon: <CalendarDays size={16} />,
      title: 'Connect Google Calendar',
      description: 'Sync appointments automatically with your calendar.',
      action: {
        label: 'Integrations →',
        onClick: () => onOpenSettings('integrations'),
      },
      done: calendarConnected,
    }] : []),
  ];

  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1A2E1A]/40 animate-fadeIn">
      <div className="relative w-full max-w-[560px] bg-[#F5F0E8] border border-[rgba(0,80,40,0.18)] animate-slideUp mx-4">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[rgba(0,80,40,0.12)]">
          <div className="text-[10px] font-mono tracking-widest text-[#7A9A7A] uppercase mb-1">
            // Welcome to InstaRoom
          </div>
          <div className="text-lg font-semibold text-[#1A2E1A]">
            Your room is live{provider.name ? `, ${provider.name.split(' ')[0]}` : ''}.
          </div>
        </div>

        {/* Room URL */}
        {roomUrl && (
          <div className="px-6 py-4 border-b border-[rgba(0,80,40,0.12)]">
            <div className="text-[10px] font-mono tracking-widest text-[#7A9A7A] uppercase mb-2">
              your permanent room
            </div>
            <div className="flex items-center gap-2 p-3 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]">
              <span className="flex-1 font-mono text-[13px] text-[#007A40] truncate">
                {roomUrl}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(0,80,40,0.18)]
                           text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A]
                           hover:border-[#007A40] hover:text-[#007A40] transition-all flex-shrink-0"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <a
                href={`https://${roomUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(0,80,40,0.18)]
                           text-[10px] font-mono tracking-widest uppercase text-[#7A9A7A]
                           hover:border-[#007A40] hover:text-[#007A40] transition-all flex-shrink-0"
              >
                <ExternalLink size={11} />
                Preview
              </a>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="px-6 py-4 border-b border-[rgba(0,80,40,0.12)]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-mono tracking-widest text-[#7A9A7A] uppercase">
              // next steps
            </div>
            <div className="text-[10px] font-mono text-[#7A9A7A]">
              {doneCount}/{steps.length} complete
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {steps.map(step => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 border transition-all ${
                  step.done
                    ? 'border-[rgba(0,80,40,0.12)] bg-[rgba(0,122,64,0.04)]'
                    : 'border-[rgba(0,80,40,0.18)] bg-[#EDE8DC]'
                }`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${step.done ? 'text-[#007A40]' : 'text-[#7A9A7A]'}`}>
                  {step.done ? <Check size={16} /> : step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-mono text-[12px] font-medium ${step.done ? 'text-[#007A40]' : 'text-[#1A2E1A]'}`}>
                    {step.title}
                  </div>
                  <div className="font-mono text-[11px] text-[#7A9A7A] mt-0.5">
                    {step.description}
                  </div>
                  {step.action && !step.done && (
                    <button
                      onClick={() => handleAction(step.action!.onClick)}
                      className="mt-2 text-[10px] font-mono tracking-widest uppercase
                                 text-[#007A40] hover:underline transition-all"
                    >
                      {step.action.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#7A9A7A]">
            // find these in settings anytime
          </span>
          <button
            onClick={onDismiss}
            className="px-5 py-2.5 border border-[#007A40] text-[10px] font-mono
                       tracking-widest uppercase text-[#007A40]
                       hover:bg-[#007A40] hover:text-[#F5F0E8] transition-all"
          >
            Take me to my dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}