import { useState, useEffect, useRef } from 'react';
import { VolumeX, Disc } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTranslation } from '../../hooks/useTranslation';

export function MusicToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScratching, setIsScratching] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [rotation, setRotation] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastXRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    audioRef.current = new Audio('/sound/song.mp3');
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  // Natural spin animation
  useEffect(() => {
    if (isPlaying && !isScratching) {
      spinIntervalRef.current = setInterval(() => {
        setRotation(prev => (prev + 3) % 360);
      }, 50);
    } else {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    }
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, [isPlaying, isScratching]);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        console.warn("Autoplay blocked");
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
    lastXRef.current = clientX;
    setHasMoved(false);
    setIsScratching(true);
    if (audioRef.current) audioRef.current.pause();
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isScratching || !audioRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const deltaX = clientX - lastXRef.current;
    const totalDist = Math.abs(clientX - startXRef.current);

    if (totalDist > 5) {
      setHasMoved(true);
    }
    
    // Rotate disc based on movement
    setRotation(prev => prev + deltaX * 2);
    
    // Scrub audio
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + (deltaX * 0.05));
    
    lastXRef.current = clientX;
  };

  const handleMouseUp = () => {
    if (!isScratching) return;
    
    setIsScratching(false);

    // If it was just a click (hardly moved), toggle play/pause
    if (!hasMoved) {
      toggleMusic();
    } else if (isPlaying && audioRef.current) {
      // If we were playing before scratching, resume
      audioRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (isScratching) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isScratching, hasMoved, isPlaying]);

  return (
    <div className="fixed bottom-6 right-24 sm:right-26 z-50 flex flex-col items-end gap-2 select-none group">
      {/* Play/Pause Label */}
      <div className="bg-primary text-zinc-900 text-[10px] font-black px-4 py-1.5 rounded-full opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 whitespace-nowrap pointer-events-none uppercase tracking-widest border border-primary/20 shadow-xl flex items-center h-7">
        {isScratching && hasMoved ? t.floating.music.scratching : isPlaying ? t.floating.music.playing : t.floating.music.paused}
      </div>

      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
        className={cn(
          "relative w-16 h-16 rounded-full transition-shadow duration-300 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing",
          isPlaying ? "shadow-[0_0_30px_rgba(245,158,11,0.3)]" : "shadow-2xl shadow-black/50"
        )}
      >
          {/* Vinyl Disc SVG */}
          <div 
            className="w-full h-full relative"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle cx="50" cy="50" r="48" fill="#111" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#222" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="35" fill="none" stroke="#222" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="#222" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="25" fill="none" stroke="#222" strokeWidth="0.5" />
              <path d="M50 2 A48 48 0 0 1 98 50 L50 50 Z" fill="rgba(255,255,255,0.05)" />
              <path d="M50 98 A48 48 0 0 1 2 50 L50 50 Z" fill="rgba(255,255,255,0.05)" />
              <circle cx="50" cy="50" r="15" fill="#f59e0b" />
              <circle cx="50" cy="50" r="2" fill="#000" />
              <text x="50" y="52" fontSize="4" fontWeight="bold" textAnchor="middle" fill="#000" transform="rotate(-45 50 50)">BOOM</text>
            </svg>
          </div>

          {/* Mute Overlay Icon */}
          {!isPlaying && (!isScratching || !hasMoved) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] rounded-full">
              <VolumeX size={24} className="text-white/80" />
            </div>
          )}
        </button>
    </div>
  );
}
