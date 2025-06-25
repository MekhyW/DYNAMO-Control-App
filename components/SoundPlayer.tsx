import React from 'react';

export type SoundType = 'minor' | 'major';

export const useSoundPlayer = () => {
  const playSound = (type: SoundType) => {
    try {
      const soundPath = type === 'minor' ? '/pressMinor.mp3' : '/pressMajor.mp3';
      const audio = new Audio(soundPath);
      audio.volume = 0.5; // Set volume to 50%
      audio.play().catch(error => {
        console.warn('Failed to play sound:', error);
      });
    } catch (error) {
      console.warn('Error creating audio:', error);
    }
  };
  return { playSound };
};

function SoundPlayer() {
  const { playSound } = useSoundPlayer();
  return (
    <button onClick={() => playSound('minor')}>
      Play Sound
    </button>
  );
}

export default SoundPlayer;