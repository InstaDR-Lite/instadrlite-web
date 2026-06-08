/* eslint-disable react/jsx-no-comment-textnodes */
'use client';

import { useState, useEffect } from 'react';

export default function VideoTab() {
  const [cameras,  setCameras]  = useState<MediaDeviceInfo[]>([]);
  const [mics,     setMics]     = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera,  setSelectedCamera]  = useState('');
  const [selectedMic,     setSelectedMic]     = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

      {/* Privacy note */}
      <div className="border border-[rgba(0,80,40,0.18)] p-3">
        <p className="text-[11px] text-[#7A9A7A] font-mono">
          // camera starts OFF by default in all sessions — your privacy first
        </p>
        <p className="text-[11px] text-[#7A9A7A] font-mono mt-1">
          // background blur — coming in v1.1
        </p>
      </div>
    </div>
  );
}