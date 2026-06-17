/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useState, useEffect } from 'react';

// ─── BROWSER DETECTION ───────────────────────────────────────────────────────

function isBlurSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  const hasCapture = typeof canvas.captureStream === 'function';
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg|OPR/.test(navigator.userAgent);
  return hasCapture && isChrome;
}

// ─── BLUR PREFERENCE KEY ─────────────────────────────────────────────────────

const BLUR_PREF_KEY = 'instaroom:bgBlur';

export function getBlurPreference(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(BLUR_PREF_KEY);
  return stored === null ? true : stored === 'true'; // default on
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function VideoTab() {
  const [cameras,  setCameras]  = useState<MediaDeviceInfo[]>([]);
  const [mics,     setMics]     = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera,  setSelectedCamera]  = useState('');
  const [selectedMic,     setSelectedMic]     = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [loading, setLoading] = useState(true);
  const [blurEnabled, setBlurEnabled] = useState(false);
  const [blurSupported, setBlurSupported] = useState(false);

  useEffect(() => {
    const supported = isBlurSupported();
    setBlurSupported(supported);
    if (supported) setBlurEnabled(getBlurPreference());

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then(devices => {
        setCameras(devices.filter(d => d.kind === 'videoinput'));
        setMics(devices.filter(d => d.kind === 'audioinput'));
        setSpeakers(devices.filter(d => d.kind === 'audiooutput'));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function handleBlurToggle() {
    const next = !blurEnabled;
    setBlurEnabled(next);
    localStorage.setItem(BLUR_PREF_KEY, String(next));
  }

  if (loading) return (
    <div className="p-6">
      <p className="text-[11px] text-[#7A9A7A] tracking-widest">// enumerating devices...</p>
    </div>
  );

  return (
    <div className="p-6 flex flex-col gap-5 max-w-[580px]">
      <div>
        <div className="text-[10px] text-[#7A9A7A] tracking-widest uppercase mb-1">// video & hardware</div>
        <div className="text-lg font-semibold text-[#1A2E1A]">Video & Hardware</div>
      </div>

      {/* Camera */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">camera</label>
        <select
          value={selectedCamera}
          onChange={e => setSelectedCamera(e.target.value)}
          className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] focus:outline-none focus:border-[#007A40] transition-all"
        >
          {cameras.length === 0
            ? <option>// no cameras found</option>
            : cameras.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,8)}`}</option>
              ))
          }
        </select>
      </div>

      {/* Microphone */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">microphone</label>
        <select
          value={selectedMic}
          onChange={e => setSelectedMic(e.target.value)}
          className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] focus:outline-none focus:border-[#007A40] transition-all"
        >
          {mics.length === 0
            ? <option>// no microphones found</option>
            : mics.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,8)}`}</option>
              ))
          }
        </select>
      </div>

      {/* Speaker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">speaker</label>
        <select
          value={selectedSpeaker}
          onChange={e => setSelectedSpeaker(e.target.value)}
          className="px-3 py-2 bg-[#EDE8DC] border border-[rgba(0,80,40,0.18)] text-sm font-mono text-[#1A2E1A] focus:outline-none focus:border-[#007A40] transition-all"
        >
          {speakers.length === 0
            ? <option>// no speakers found</option>
            : speakers.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0,8)}`}</option>
              ))
          }
        </select>
      </div>

      {/* Background Blur */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] tracking-widest uppercase text-[#7A9A7A]">background blur</label>
        <div className="flex items-center justify-between border border-[rgba(0,80,40,0.18)] p-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-mono text-[#1A2E1A]">
              {blurSupported
                ? 'Blur background during sessions'
                : 'Background blur'}
            </span>
            <span className="text-[11px] font-mono text-[#7A9A7A]">
              {blurSupported
                ? '// powered by MediaDance · Chrome only'
                : '// not supported in this browser — use Chrome'}
            </span>
          </div>

          {blurSupported ? (
            <button
              onClick={handleBlurToggle}
              className={`relative w-[44px] h-[24px] border transition-all flex-shrink-0 ${
                blurEnabled
                  ? 'bg-[#007A40] border-[#007A40]'
                  : 'bg-transparent border-[rgba(0,80,40,0.3)]'
              }`}
              aria-label={blurEnabled ? 'Disable background blur' : 'Enable background blur'}
            >
              <span
                className={`absolute top-[3px] w-[16px] h-[16px] bg-white transition-all ${
                  blurEnabled ? 'left-[24px]' : 'left-[3px]'
                }`}
              />
            </button>
          ) : (
            <span className="text-[10px] font-mono text-[#CC2200] tracking-widest uppercase">
              unavailable
            </span>
          )}
        </div>
      </div>

      {/* Privacy note */}
      <div className="border border-[rgba(0,80,40,0.18)] p-3">
        <p className="text-[11px] text-[#7A9A7A] font-mono">
          // camera starts OFF by default in all sessions — your privacy first
        </p>
      </div>
    </div>
  );
}