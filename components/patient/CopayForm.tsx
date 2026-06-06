'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface Props {
  paymentAmount: number;
  onSuccess:     () => void;
}

export default function CopayForm({ paymentAmount, onSuccess }: Props) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required'
    });

    if (error) {
      setError(error.message || 'Payment failed');
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PaymentElement />
      {error && (
        <div className="text-[11px] text-[#CC2200] font-mono">
          error: {error}
        </div>
      )}
      <button
        onClick={handlePay}
        disabled={loading || !stripe}
        className={`w-full py-3 text-xs tracking-widest uppercase transition-all ${
          !loading && stripe
            ? 'border border-[#007A40] text-[#007A40] hover:bg-[#007A40] hover:text-[#F5F0E8]'
            : 'border border-[rgba(0,80,40,0.18)] text-[#7A9A7A] cursor-not-allowed'
        }`}
      >
        {loading ? '// processing...' : `[ pay $${paymentAmount} ]`}
      </button>
    </div>
  );
}