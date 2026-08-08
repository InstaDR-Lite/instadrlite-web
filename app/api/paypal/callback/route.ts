// app/api/paypal/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get('merchantIdInPayPal');
  const permissionsGranted = searchParams.get('permissionsGranted');
  const trackingId = searchParams.get('merchantId'); // this is your tracking_id (providerId)

  console.log('[PayPal Callback]', { merchantId, permissionsGranted, trackingId });

  if (merchantId && permissionsGranted === 'true') {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/paypal/save-merchant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, providerId: trackingId }),
    });
  }

  return NextResponse.redirect(new URL('/dashboard?settings=payments', req.url));
}