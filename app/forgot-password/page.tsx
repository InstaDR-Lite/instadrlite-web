'use client';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">
        <div className="px-6 py-4 border-b border-[rgba(0,80,40,0.18)]">
          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase font-mono">
            // reset password
          </span>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {sent ? (
            <p className="font-mono text-[12px] text-[#3D5C3D]">
              // if that email exists, a reset link is on its way.
            </p>
          ) : (
            <>
              <p className="font-mono text-[11px] text-[#7A9A7A]">
                Enter your email and we'll send you a reset link.
              </p>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]
                           text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A]
                           focus:outline-none focus:border-[#007A40] transition-all"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !email}
                className="w-full py-3 text-xs tracking-widest uppercase border
                           border-[#007A40] text-[#007A40] hover:bg-[#007A40]
                           hover:text-[#F5F0E8] disabled:opacity-50
                           disabled:cursor-not-allowed transition-all font-mono"
              >
                {loading ? '// sending...' : '[ Send Reset Link ]'}
              </button>
            </>
          )}
          <a href="/login" className="text-[10px] font-mono text-[#7A9A7A]
                                      hover:text-[#007A40] transition-all">
            ← back to login
          </a>
        </div>
      </div>
    </div>
  );
}