'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useSearchParams } from 'next/navigation';


export default function SignupPage() {

  return (

  <Suspense fallback={null}>
    <SignupInner />
  </Suspense>
  )
}

function SignupInner() {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  
  const plan = searchParams.get('plan') || 'monthly';
  
  useEffect(() => {
    //  SAFE: Next.js guarantees useEffect ONLY runs on the client after mounting
    localStorage.setItem('selected_plan', plan);
    
    // 
    if (promoCode) {
      localStorage.setItem('pending_promo_code', promoCode);
    }
  }, [plan, promoCode]);
  
  /**
   * Handles the signup process for new users. It first checks if the password and confirm password fields match. 
   * If they don't, it sets an error message and exits. If they do match, it proceeds to send a POST request 
   * to the backend API with the user's name, email, and password. If a promo code is entered, it saves it 
   * to localStorage before making the API call. Upon successful signup, it redirects the user to the onboarding 
   * page. If there's an error during the process, it catches it and displays the error message.   
   * @returns 
  */
 const handleSignup = async () => {

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          name:     form.name,
          email:    form.email,
          password: form.password
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      router.push('/onboarding'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
 };
  
  const handleGoogle = async () => {

    const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google/login`);
    const data = await res.json();
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] border border-[rgba(0,80,40,0.18)] bg-[#e4eaf4]">

        <div className="px-6 py-4 border-b border-[rgba(0,80,40,0.18)] flex items-center gap-3">
          <span className="border border-[rgba(0,80,40,0.30)] px-2 py-0.5 text-[#007A40] text-xs font-bold">iD</span>
          <span className="text-sm tracking-widest uppercase text-[#1A2E1A]">InstaRoom<span className="text-[#7A9A7A]">-Lite</span></span>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">
              Provider signup
            </div>
            <div className="text-lg font-semibold text-[#1A2E1A]">Create your account</div>
          </div>

          <span className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1"> 
            Have a promo code? 
          </span>
          <input
            type="text"
            placeholder="Promo code (optional)"
            value={promoCode}
            onChange={e => setPromoCode(e.target.value.toUpperCase())}
            className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
          />
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[rgba(0,80,40,0.12)]" />
            {/* <span className="text-[10px] text-[#7A9A7A] tracking-widest">or</span> */}
            <div className="flex-1 h-px bg-[rgba(0,80,40,0.12)]" />
          </div>

          <button
            onClick={handleGoogle}
            className="w-full py-2.5 border border-[rgba(0,80,40,0.18)] text-[11px] tracking-widest uppercase text-[#3D5C3D] hover:border-[#007A40] hover:text-[#007A40] transition-all flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[rgba(0,80,40,0.12)]" />
            <span className="text-[10px] text-[#7A9A7A] tracking-widest">or</span>
            <div className="flex-1 h-px bg-[rgba(0,80,40,0.12)]" />
          </div>

          {[
            { key: 'name',            type: 'text',     placeholder: 'Full name' },
            { key: 'email',           type: 'email',    placeholder: 'Email' },
            { key: 'password',        type: 'password', placeholder: 'Password' },
            { key: 'confirmPassword', type: 'password', placeholder: 'Confirm password' }
          ].map(f => (
            <input
              key={f.key}
              type={f.type}
              placeholder={f.placeholder}
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] placeholder:text-[#7A9A7A] focus:outline-none focus:border-[#007A40] transition-all"
            />
          ))}

          {error && (
            <div className="text-[11px] text-[#CC2200] font-mono">Error: {error}</div>
          )}


          <button
            onClick={handleSignup}
            disabled={loading}
            className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
              loading
              ? 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A]'
              : 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#e4eaf4]'
            }`}
          >
            {loading ? '// creating account...' : '[ create account ]'}
          </button>
          

          <div className="text-center text-[11px] text-[#7A9A7A] tracking-wide">
            Already have an account?{' '}
            <a href="/login" className="text-[#007A40] hover:underline">Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}