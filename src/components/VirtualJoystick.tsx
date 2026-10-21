import React, { useRef, useState, useCallback, useEffect } from 'react';

interface VirtualJoystickProps {
  onMove: (dir: { x: number; z: number }, isSprint: boolean) => void;
  onStop: () => void;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, onStop }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activeTouchId = useRef<number | null>(null);

  const radius = 50; // max knob travel distance in pixels

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsActive(true);
    activeTouchId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive || activeTouchId.current !== e.pointerId || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.hypot(dx, dy);

    const clampedDist = Math.min(distance, radius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;
    setKnobPos({ x: knobX, y: knobY });

    // Output normalized vector: X: -1..1, Z (up/down): -1..1
    const normX = knobX / radius;
    const normZ = knobY / radius;
    const isSprint = clampedDist > radius * 0.75;

    onMove({ x: normX, z: normZ }, isSprint);
  }, [isActive, onMove]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTouchId.current === e.pointerId) {
      setIsActive(false);
      activeTouchId.current = null;
      setKnobPos({ x: 0, y: 0 });
      onStop();
    }
  }, [onStop]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
      className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all select-none cursor-pointer ${
        isActive
          ? 'bg-slate-900/80 border-2 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]'
          : 'bg-slate-950/60 border-2 border-slate-700/80 shadow-lg'
      }`}
    >
      {/* Direction Cross Markings */}
      <div className="absolute inset-2 rounded-full border border-dashed border-slate-700/60 pointer-events-none" />
      <div className="absolute w-full h-[1px] bg-slate-800 pointer-events-none" />
      <div className="absolute h-full w-[1px] bg-slate-800 pointer-events-none" />

      {/* Thumbstick Knob */}
      <div
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          transition: isActive ? 'none' : 'transform 0.15s ease-out',
        }}
        className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-[10px] tracking-tighter uppercase transition-colors pointer-events-none shadow-xl ${
          isActive
            ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white ring-4 ring-orange-500/30'
            : 'bg-slate-800 text-slate-400 border border-slate-600'
        }`}
      >
        <span>{isActive ? '跑' : '摇杆'}</span>
      </div>
    </div>
  );
};
