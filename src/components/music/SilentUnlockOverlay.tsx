import React from 'react';

interface SilentUnlockOverlayProps {
  onUnlock: () => void;
}

export const SilentUnlockOverlay: React.FC<SilentUnlockOverlayProps> = ({ onUnlock }) => {
  return (
    <div 
      onClick={onUnlock}
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white text-xl z-50 cursor-pointer"
    >
      <div className="text-center">
        <div className="text-4xl mb-4">🎶</div>
        <div className="text-2xl font-bold mb-2">Tap to Start Broski&apos;s Music</div>
        <div className="text-lg opacity-75">One tap unlocks all tracks</div>
      </div>
    </div>
  );
};