export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#edf1f7] flex items-center justify-center">
      <div className="text-center font-mono">
        <div className="text-[10px] tracking-widest text-[#7A9A7A] uppercase mb-2">
          // 404
        </div>
        <div className="text-lg font-semibold text-[#1A2E1A] mb-4">
          Room not found.
        </div>
        <a href="https://getinstaroom.com" className="text-[11px] text-[#007A40]">
          ← getinstaroom.com
        </a>
      </div>
    </div>
  );
}