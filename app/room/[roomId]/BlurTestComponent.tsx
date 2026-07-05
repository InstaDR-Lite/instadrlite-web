import { useEffect, useRef, useState } from "react";

export const BlurTestComponent = ({ mediaDanceClient }: { mediaDanceClient: any }) => {
  const videoRef =  useRef<HTMLVideoElement | null>(null);
  const [isBlurActive, setIsBlurActive] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // 1. Guard check: If the hook passes a null instance, do absolutely nothing yet
    if (!mediaDanceClient) return;

    const handleStreamReady = (stream: MediaStream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    };

    console.log('[BlurTestComponent]: MediaDanceClient is available');
    // 2. Safe registration
    mediaDanceClient.on('local-stream-ready', handleStreamReady);

    // 3. Safe cache check using optional chaining
    if (mediaDanceClient.media?.localStream) {
      videoRef.current!.srcObject = mediaDanceClient.media.localStream;
    }

    // 4. Safe cleanup guard
    return () => {
      mediaDanceClient.off('local-stream-ready', handleStreamReady);
    };
  }, [mediaDanceClient]); // React will safely re-run this block the exact millisecond mediaDanceClient becomes valid

  const handleToggle = async () => {
    const nextState = !isBlurActive;
    setIsBlurActive(nextState);
    // await mediaDanceClient.toggleBlur(nextState);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', border: '1px solid white', zIndex: 9999 }}>
      <h3>MediaDance On-Demand Test</h3>
      
      {/* The isolated local preview */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ width: '100%', borderRadius: '8px', backgroundColor: '#000' }} 
      />

      <div style={{ marginTop: '12px', background: 'green' }}>
        <button onClick={handleToggle}>
          {isBlurActive ? "Disable Blur" : "Enable Blur"}
        </button>
        <p style={{ fontSize: '12px', color: '#fff' }}>Status: {status}</p>
      </div>
    </div>
  );
};