import { useCallback, useRef, useState } from 'react';

interface AudioSettings {
  enabled: boolean;
  volume: number;
}

export const useAudio = () => {
  const [settings, setSettings] = useState<AudioSettings>({
    enabled: true,
    volume: 0.7
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Generate synthesized sound effects
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!settings.enabled) return;

    const audioContext = getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * settings.volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [settings, getAudioContext]);

  // Complex sound effects
  const playOpenCapsule = useCallback(() => {
    if (!settings.enabled) return;
    
    // Magical opening sound with multiple frequencies
    setTimeout(() => playTone(220, 0.1, 'sine', 0.4), 0);
    setTimeout(() => playTone(330, 0.1, 'sine', 0.3), 50);
    setTimeout(() => playTone(440, 0.2, 'sine', 0.5), 100);
    setTimeout(() => playTone(660, 0.3, 'triangle', 0.3), 200);
    setTimeout(() => playTone(880, 0.4, 'triangle', 0.2), 300);
  }, [playTone, settings.enabled]);

  const playRevealRare = useCallback(() => {
    if (!settings.enabled) return;
    
    // Epic reveal sound
    setTimeout(() => playTone(880, 0.2, 'triangle', 0.6), 0);
    setTimeout(() => playTone(1100, 0.2, 'triangle', 0.5), 100);
    setTimeout(() => playTone(1320, 0.3, 'triangle', 0.4), 200);
    setTimeout(() => playTone(1760, 0.4, 'sine', 0.3), 300);
  }, [playTone, settings.enabled]);

  const playRevealCommon = useCallback(() => {
    if (!settings.enabled) return;
    
    // Simple reveal sound
    setTimeout(() => playTone(440, 0.15, 'sine', 0.3), 0);
    setTimeout(() => playTone(550, 0.15, 'sine', 0.2), 100);
  }, [playTone, settings.enabled]);

  const playButtonClick = useCallback(() => {
    if (!settings.enabled) return;
    playTone(800, 0.05, 'square', 0.2);
  }, [playTone, settings.enabled]);

  const playButtonHover = useCallback(() => {
    if (!settings.enabled) return;
    playTone(600, 0.03, 'sine', 0.1);
  }, [playTone, settings.enabled]);

  const playSuccess = useCallback(() => {
    if (!settings.enabled) return;
    
    // Success chime
    setTimeout(() => playTone(523, 0.1, 'sine', 0.4), 0);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.4), 100);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.5), 200);
  }, [playTone, settings.enabled]);

  const playError = useCallback(() => {
    if (!settings.enabled) return;
    
    // Error buzz
    setTimeout(() => playTone(200, 0.1, 'sawtooth', 0.3), 0);
    setTimeout(() => playTone(180, 0.1, 'sawtooth', 0.2), 100);
  }, [playTone, settings.enabled]);

  const toggleAudio = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  return {
    settings,
    playOpenCapsule,
    playRevealRare,
    playRevealCommon,
    playButtonClick,
    playButtonHover,
    playSuccess,
    playError,
    toggleAudio,
    setVolume
  };
};