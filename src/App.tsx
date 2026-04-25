/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Terminal, ShieldAlert, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Position {
  x: number;
  y: number;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const TRACKS: Track[] = [
  {
    id: 0,
    title: "SYNTHETIC_DREAM_01.void",
    artist: "ARCH_SYSTEM_ERROR",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/void1/400/400?grayscale&blur=2"
  },
  {
    id: 1,
    title: "VOID_CORE_PROTOCOL.null",
    artist: "NULL_POINTER_NULL",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/void2/400/400?grayscale&blur=2"
  },
  {
    id: 2,
    title: "NEURAL_STATIC_WAVE.pulse",
    artist: "PULSE_WIDTH_MOD",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/void3/400/400?grayscale&blur=2"
  }
];

// --- Snake Game Component ---
const SnakeGame = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Position>({ x: 0, y: -1 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const generateFood = useCallback((currentSnake: Position[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      // eslint-disable-next-line no-loop-func
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) break;
    }
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE
      };

      // Collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Eat food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 10;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, generateFood, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    const loop = (time: number) => {
      if (time - lastUpdateRef.current > INITIAL_SPEED - Math.min(score / 5, 100)) {
        moveSnake();
        lastUpdateRef.current = time;
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [moveSnake, score]);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 15 });
    setDirection({ x: 0, y: -1 });
    setGameOver(false);
    setScore(0);
    // Add a quick flicker effect to body?
    document.body.classList.add('animate-pulse');
    setTimeout(() => document.body.classList.remove('animate-pulse'), 500);
  };

  return (
    <div className="relative flex flex-col items-center gap-4">
      <div className="flex justify-between w-full px-4 mb-2">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-neon-cyan" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neon-cyan">Score::0x{score.toString(16).toUpperCase().padStart(4, '0')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-neon-magenta" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/40">Peak::0x{highScore.toString(16).toUpperCase().padStart(4, '0')}</span>
        </div>
      </div>

      <div className="relative glitch-border bg-void-black overflow-hidden aspect-square w-[320px] sm:w-[400px]">
        {/* Animated Scanlines inside game */}
        <div className="absolute inset-0 scanlines opacity-30 z-10 pointer-events-none" />
        
        {/* Grid dots with random flicker */}
        <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 opacity-5">
          {Array.from({ length: 400 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-neon-cyan/10" />
          ))}
        </div>

        {/* Food - Glitching Pulse */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute w-[5%] h-[5%] bg-neon-magenta shadow-[0_0_15px_#FF00FF]"
          style={{ left: `${food.x * 5}%`, top: `${food.y * 5}%` }}
        />

        {/* Snake - Cyber Segments */}
        {snake.map((segment, i) => (
          <div
            key={i}
            className={`absolute w-[5%] h-[5%] ${i === 0 ? 'bg-white z-10 shadow-[0_0_20px_#FFFFFF]' : 'bg-neon-cyan opacity-80'}`}
            style={{ 
              left: `${segment.x * 5}%`, 
              top: `${segment.y * 5}%`,
              transition: 'all 50ms linear' 
            }}
          />
        ))}

        {gameOver && (
          <div className="absolute inset-0 bg-void-black/95 flex flex-col items-center justify-center backdrop-blur-md z-30 animate-pulse">
            <h2 className="text-4xl font-black text-neon-magenta glitch-text mb-2 tracking-tighter">FATAL_ERROR</h2>
            <div className="text-[10px] text-neon-cyan mb-8 uppercase tracking-widest font-mono">[LOG::MEM_CORRUPTION_DETECTED]</div>
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-neon-cyan text-black font-black uppercase tracking-tighter hover:bg-white hover:shadow-[0_0_25px_#FFFFFF] transition-all"
            >
              RUN ./REBOOT.SH
            </button>
          </div>
        )}
      </div>
      
      <div className="text-[10px] text-neon-cyan/40 uppercase tracking-[0.2em]">
        Move: Arrow Keys | Status: [LIVE_INPUT_DETECTED]
      </div>
    </div>
  );
};

// --- App Component ---
export default function App() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrackIndex, isPlaying]);

  return (
    <main className="min-h-screen bg-void-black relative flex flex-col items-center justify-center p-4">
      {/* Visual background layers */}
      <div className="fixed inset-0 noise-overlay pointer-events-none z-50" />
      <div className="fixed inset-0 scanlines pointer-events-none z-50" />
      
      {/* Rotating Header */}
      <header className="absolute top-8 left-8 hidden lg:block overflow-hidden w-64 border-l-2 border-neon-magenta pl-4 pointer-events-none">
        <div className="text-[10px] text-neon-magenta uppercase tracking-[0.3em] font-bold">Protocol</div>
        <h1 className="text-2xl font-black glitch-text leading-none mt-2">NEURAL_SYNAPSE</h1>
        <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1 italic">Void Edition v0.4.2</div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Sidebar Left: Status/Visuals */}
        <div className="lg:col-span-3 hidden lg:flex flex-col gap-8 opacity-40 hover:opacity-100 transition-opacity">
          <div className="border border-white/10 p-4">
            <div className="text-[10px] text-white/50 mb-2 uppercase">Sensors</div>
            <div className="space-y-4">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="h-1 bg-white/5 w-full relative">
                    <motion.div 
                      className="absolute inset-0 bg-neon-cyan"
                      animate={{ width: [`${20+i*20}%`, `${50+i*10}%`, `${20+i*20}%`] }}
                      transition={{ duration: 2 + i, repeat: Infinity }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] uppercase">
                    <span>Node_{i.toString().padStart(2, '0')}</span>
                    <span>Safe</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border border-white/10 p-4 relative overflow-hidden group">
            <ShieldAlert size={20} className="text-neon-magenta mb-2" />
            <div className="text-[10px] leading-tight">
              WARNING: SYSTEM INTEGRITY AT 88%. VOLTAGE SPIKES DETECTED IN SECTOR 7.
            </div>
          </div>
        </div>

        {/* Center: Game */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <SnakeGame />
        </div>

        {/* Sidebar Right: Music Player */}
        <div className="lg:col-span-3 w-full animate-tear">
          <div className="glitch-border bg-black/40 backdrop-blur-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-neon-cyan/20 overflow-hidden">
               <motion.div 
                className="h-full bg-neon-cyan" 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>

            <div className="relative z-10 flex flex-col items-center">
               <div className="w-full aspect-square bg-white/5 mb-6 relative overflow-hidden group">
                  <AnimatePresence mode="wait">
                    <motion.img 
                      key={currentTrackIndex}
                      src={currentTrack.cover} 
                      alt="Cover"
                      className="w-full h-full object-cover filter grayscale contrast-125 saturate-0 group-hover:saturate-100 transition-all duration-700"
                      initial={{ scale: 1.2, opacity: 0, x: 20 }}
                      animate={{ scale: 1, opacity: 1, x: 0 }}
                      exit={{ scale: 0.8, opacity: 0, x: -20 }}
                      referrerPolicy="no-referrer"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
               </div>

               <div className="w-full mb-6">
                  <div className="text-[10px] text-neon-magenta uppercase tracking-[0.2em] mb-1 font-bold">Now Playing</div>
                  <h3 className="text-lg font-black truncate text-neon-cyan">{currentTrack.title}</h3>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest">{currentTrack.artist}</p>
               </div>

               <div className="w-full flex items-center justify-between gap-4 mb-6">
                  <button onClick={prevTrack} className="p-2 text-white/60 hover:text-neon-cyan transition-colors">
                    <SkipBack size={20} />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-14 h-14 rounded-full border-2 border-neon-cyan flex items-center justify-center text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                  >
                    {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
                  </button>
                  <button onClick={nextTrack} className="p-2 text-white/60 hover:text-neon-cyan transition-colors">
                    <SkipForward size={20} />
                  </button>
               </div>

               <div className="w-full flex items-center gap-3">
                  <Volume2 size={12} className="text-white/30" />
                  <div className="flex-1 h-1 bg-white/10 rounded-full relative">
                    <div className="absolute inset-y-0 left-0 bg-neon-cyan/50 w-2/3" />
                  </div>
               </div>
            </div>
            
            <audio 
              ref={audioRef} 
              src={currentTrack.url} 
              onEnded={nextTrack}
            />
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TRACKS.map((t, i) => (
              <button 
                key={t.id}
                onClick={() => { setCurrentTrackIndex(i); setIsPlaying(true); }}
                className={`flex-shrink-0 w-12 h-12 border transition-all ${i === currentTrackIndex ? 'border-neon-cyan scale-110' : 'border-white/10 opacity-30 hover:opacity-100'}`}
              >
                <img src={t.cover} alt="track" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating UI Accents */}
      <footer className="absolute bottom-4 right-8 text-[8px] text-white/20 uppercase tracking-[0.4em] pointer-events-none">
        [ENCRYPTED_TRANSMISSION_STABLE] :: OX_4419_X_22
      </footer>

      {/* Background Glitch Canvas/Visualizer placeholder */}
      <div className="fixed top-0 right-0 p-8 opacity-20 pointer-events-none">
         <Music size={120} className="text-neon-magenta animate-pulse" />
      </div>
    </main>
  );
}
