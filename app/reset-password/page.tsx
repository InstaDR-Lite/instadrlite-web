'use client';
import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const handleSubmit = async () => {
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setLoading(true);
    setError('');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong');
    } else {
      setDone(true);
      setTimeout(() => router.push('/login'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] border border-[rgba(0,80,40,0.18)] bg-[#F5F0E8]">
        <div className="px-6 py-4 border-b border-[rgba(0,80,40,0.18)]">
          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase font-mono">
            // new password
          </span>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {done ? (
            <p className="font-mono text-[12px] text-[#007A40]">
              // password updated. redirecting to login...
            </p>
          ) : (
            <>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password"
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]
                           text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A]
                           focus:outline-none focus:border-[#007A40] transition-all"
              />
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)]
                           text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A]
                           focus:outline-none focus:border-[#007A40] transition-all"
              />
              {error && (
                <p className="text-[11px] text-[#CC2200] font-mono">// {error}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || !password || !confirm}
                className="w-full py-3 text-xs tracking-widest uppercase border
                           border-[#007A40] text-[#007A40] hover:bg-[#007A40]
                           hover:text-[#F5F0E8] disabled:opacity-50
                           disabled:cursor-not-allowed transition-all font-mono"
              >
                {loading ? '// updating...' : '[ Update Password ]'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}