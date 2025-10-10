import React from 'react';
import { Play } from 'lucide-react';

interface AudioUnlockOverlayProps {
  onUnlock: () => Promise<boolean>;
  onHide: () => void;
}

export const AudioUnlockOverlay: React.FC<AudioUnlockOverlayProps> = ({
  onUnlock,
  onHide,
}) => {
  const handleTap = async () => {
    const success = await onUnlock();
    if (success) {
      onHide();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTap();
        }
      }}
      aria-label="Tap to start music"
    >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mx-4 max-w-sm w-full text-center border border-white/20 shadow-2xl">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Tap to Start Music
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            iOS requires user interaction to enable audio playback. 
            Tap anywhere to unlock music for this session.
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handleTap}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Enable Audio
          </button>
          
          <p className="text-xs text-white/60">
            This will only happen once per device
          </p>
        </div>
      </div>
    </div>
  );
};