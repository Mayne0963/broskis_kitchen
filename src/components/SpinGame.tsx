'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaStar, FaGem, FaCrown } from 'react-icons/fa';
import { Sparkles, Zap } from 'lucide-react';

interface SpinGameProps {
  onSpin?: (result: { points: number; isJackpot: boolean }) => void;
  onClose?: () => void;
  onComplete?: () => void;
}

interface SpinSegment {
  points: number;
  probability: number;
  color: string;
  textColor: string;
  icon: React.ReactNode;
  isJackpot?: boolean;
}

const SPIN_SEGMENTS: SpinSegment[] = [
  {
    points: 5,
    probability: 30,
    color: '#4B5563', // Gray
    textColor: '#FFFFFF',
    icon: <FaStar className="text-lg" />
  },
  {
    points: 10,
    probability: 30,
    color: '#059669', // Green
    textColor: '#FFFFFF',
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    points: 20,
    probability: 25,
    color: '#DC2626', // Red
    textColor: '#FFFFFF',
    icon: <Zap className="w-5 h-5" />
  },
  {
    points: 25,
    probability: 13,
    color: '#7C3AED', // Purple
    textColor: '#FFFFFF',
    icon: <FaGem className="text-lg" />
  },
  {
    points: 50,
    probability: 2,
    color: '#FFD700', // Gold
    textColor: '#000000',
    icon: <FaCrown className="text-lg" />,
    isJackpot: true
  }
];

const SpinGame: React.FC<SpinGameProps> = ({ onSpin, onClose, onComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ points: number; isJackpot: boolean } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Calculate segment angles
  const segmentAngle = 360 / SPIN_SEGMENTS.length;

  const getRandomResult = (): { segment: SpinSegment; index: number } => {
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < SPIN_SEGMENTS.length; i++) {
      cumulative += SPIN_SEGMENTS[i].probability;
      if (random <= cumulative) {
        return { segment: SPIN_SEGMENTS[i], index: i };
      }
    }
    
    // Fallback to first segment
    return { segment: SPIN_SEGMENTS[0], index: 0 };
  };

  const handleSpin = async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);
    setShowConfetti(false);

    // Get random result
    const { segment, index } = getRandomResult();
    
    // Calculate target rotation
    const targetSegmentAngle = index * segmentAngle;
    const extraRotations = 5 + Math.random() * 3; // 5-8 full rotations
    const finalRotation = rotation + (extraRotations * 360) + (360 - targetSegmentAngle);
    
    setRotation(finalRotation);

    // Wait for spin animation to complete
    setTimeout(() => {
      setIsSpinning(false);
      const spinResult = {
        points: segment.points,
        isJackpot: segment.isJackpot || false
      };
      setResult(spinResult);
      
      if (segment.isJackpot) {
        setShowConfetti(true);
      }
      
      // Call callbacks
      onSpin?.(spinResult);
      
      // Auto close after showing result
      setTimeout(() => {
        onComplete?.();
        onClose?.();
      }, 3000);
    }, 4000);
  };

  // Confetti effect
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  return (
    <div className="relative">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-[#FFD700] to-[#40E0D0] rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Spin Wheel Container */}
      <div className="flex flex-col items-center space-y-8">
        {/* Wheel */}
        <div className="relative">
          {/* Outer Glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FFD700] to-[#40E0D0] blur-xl opacity-30 scale-110"></div>
          
          {/* Wheel Base */}
          <div className="relative w-80 h-80 rounded-full border-8 border-[#FFD700] shadow-2xl overflow-hidden">
            {/* Spinning Wheel */}
            <div
              ref={wheelRef}
              className="w-full h-full relative transition-transform duration-4000 ease-out"
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center'
              }}
            >
              {SPIN_SEGMENTS.map((segment, index) => {
                const startAngle = index * segmentAngle;
                const endAngle = (index + 1) * segmentAngle;
                
                return (
                  <div
                    key={index}
                    className="absolute w-full h-full"
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((endAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((endAngle - 90) * Math.PI / 180)}%)`,
                      backgroundColor: segment.color
                    }}
                  >
                    {/* Segment Content */}
                    <div
                      className="absolute flex flex-col items-center justify-center text-center"
                      style={{
                        top: '20%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${startAngle + segmentAngle / 2}deg)`,
                        color: segment.textColor
                      }}
                    >
                      <div className="mb-1">{segment.icon}</div>
                      <div className="font-black text-sm">{segment.points}pts</div>
                      {segment.isJackpot && (
                        <div className="text-xs font-bold animate-pulse">JACKPOT!</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10">
            <div className="w-8 h-8 bg-black rounded-full"></div>
          </div>
          
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-[#FFD700] drop-shadow-lg"></div>
          </div>
        </div>

        {/* Spin Button */}
        <button
          onClick={handleSpin}
          disabled={isSpinning}
          className={`group relative px-12 py-4 rounded-xl font-black text-xl tracking-wider transition-all duration-500 transform ${
            isSpinning
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:shadow-2xl hover:shadow-[#FFD700]/50 hover:scale-110 active:scale-95'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFA500] to-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
          <span className="relative z-10">
            {isSpinning ? 'SPINNING...' : 'SPIN TO WIN!'}
          </span>
        </button>

        {/* Result Display */}
        {result && (
          <div className="text-center animate-fade-in">
            <div className={`text-4xl font-black mb-2 ${
              result.isJackpot 
                ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent animate-pulse'
                : 'text-[#40E0D0]'
            }`}>
              {result.isJackpot ? '🎉 JACKPOT! 🎉' : '🎊 YOU WON! 🎊'}
            </div>
            <div className="text-2xl font-bold text-white">
              +{result.points} Points
            </div>
            {result.isJackpot && (
              <div className="text-lg text-[#FFD700] font-bold animate-bounce mt-2">
                LEGENDARY SPIN!
              </div>
            )}
          </div>
        )}

        {/* Probability Display */}
        <div className="text-center text-sm text-gray-400">
          <div className="mb-2 font-semibold">Win Chances:</div>
          <div className="grid grid-cols-5 gap-2 text-xs">
            {SPIN_SEGMENTS.map((segment, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-white font-bold">{segment.points}pts</div>
                <div className={segment.isJackpot ? 'text-[#FFD700]' : 'text-gray-400'}>
                  {segment.probability}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpinGame;