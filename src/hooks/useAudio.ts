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

  // Generate complex synthesized sound effects with unique patterns
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

  // Create frequency sweep effect
  const playSweep = useCallback((startFreq: number, endFreq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!settings.enabled) return;

    const audioContext = getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + duration);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * settings.volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [settings, getAudioContext]);

  // Tier-specific opening sounds
  const playOpenCommon = useCallback(() => {
    if (!settings.enabled) return;
    
    // Simple crystalline chime for common
    setTimeout(() => playTone(523, 0.15, 'triangle', 0.3), 0);   // C5
    setTimeout(() => playTone(659, 0.15, 'triangle', 0.25), 80); // E5
    setTimeout(() => playTone(784, 0.2, 'sine', 0.2), 160);     // G5
  }, [playTone, settings.enabled]);

  const playOpenRare = useCallback(() => {
    if (!settings.enabled) return;
    
    // Mystical ascending sequence for rare
    setTimeout(() => playTone(220, 0.12, 'sawtooth', 0.2), 0);    // A3
    setTimeout(() => playTone(330, 0.12, 'triangle', 0.3), 60);   // E4
    setTimeout(() => playTone(440, 0.15, 'sine', 0.4), 120);      // A4
    setTimeout(() => playTone(659, 0.18, 'triangle', 0.35), 180); // E5
    setTimeout(() => playSweep(880, 1320, 0.25, 'sine', 0.3), 240); // A5 to E6 sweep
  }, [playTone, playSweep, settings.enabled]);

  const playOpenEpic = useCallback(() => {
    if (!settings.enabled) return;
    
    // Epic orchestral-like sequence
    setTimeout(() => playTone(130, 0.1, 'sawtooth', 0.4), 0);     // C3 - deep bass
    setTimeout(() => playTone(196, 0.12, 'square', 0.35), 50);    // G3
    setTimeout(() => playTone(262, 0.15, 'triangle', 0.4), 100);  // C4
    setTimeout(() => playTone(392, 0.18, 'sine', 0.45), 150);     // G4
    setTimeout(() => playTone(523, 0.2, 'triangle', 0.4), 200);   // C5
    setTimeout(() => playSweep(784, 1568, 0.3, 'sine', 0.35), 250); // G5 to G6 sweep
    setTimeout(() => playTone(2093, 0.4, 'triangle', 0.25), 350); // C7 - ethereal high note
  }, [playTone, playSweep, settings.enabled]);

  // Unified capsule opening that chooses tier-specific sound
  const playOpenCapsule = useCallback((tier?: string) => {
    switch(tier) {
      case 'common':
        playOpenCommon();
        break;
      case 'rare':
        playOpenRare();
        break;
      case 'epic':
        playOpenEpic();
        break;
      default:
        playOpenEpic(); // Default to epic for backwards compatibility
    }
  }, [playOpenCommon, playOpenRare, playOpenEpic]);

  const playRevealRare = useCallback(() => {
    if (!settings.enabled) return;
    
    // Triumphant fanfare with harmony
    setTimeout(() => playTone(523, 0.15, 'triangle', 0.4), 0);    // C5
    setTimeout(() => playTone(659, 0.15, 'sine', 0.35), 0);       // E5 (harmony)
    setTimeout(() => playTone(698, 0.2, 'triangle', 0.4), 100);   // F5
    setTimeout(() => playTone(880, 0.2, 'sine', 0.35), 100);      // A5 (harmony)
    setTimeout(() => playTone(784, 0.25, 'triangle', 0.45), 200); // G5
    setTimeout(() => playTone(1047, 0.25, 'sine', 0.3), 200);     // C6 (harmony)
    setTimeout(() => playSweep(1176, 1760, 0.3, 'triangle', 0.35), 300); // D6 to A6 sweep
  }, [playTone, playSweep, settings.enabled]);

  const playRevealCommon = useCallback(() => {
    if (!settings.enabled) return;
    
    // Gentle acknowledgment with soft bell tones
    setTimeout(() => playTone(440, 0.1, 'sine', 0.25), 0);       // A4
    setTimeout(() => playTone(554, 0.12, 'triangle', 0.2), 80);  // C#5
    setTimeout(() => playTone(659, 0.15, 'sine', 0.18), 160);    // E5
  }, [playTone, settings.enabled]);

  const playRevealEpic = useCallback(() => {
    if (!settings.enabled) return;
    
    // Grand revelation with rich harmonics
    setTimeout(() => playTone(130, 0.2, 'sawtooth', 0.3), 0);     // C3 - foundation
    setTimeout(() => playTone(262, 0.2, 'triangle', 0.4), 0);     // C4
    setTimeout(() => playTone(523, 0.2, 'sine', 0.45), 0);        // C5
    setTimeout(() => playTone(349, 0.25, 'triangle', 0.4), 120);  // F4
    setTimeout(() => playTone(698, 0.25, 'sine', 0.4), 120);      // F5
    setTimeout(() => playTone(392, 0.3, 'triangle', 0.45), 200);  // G4
    setTimeout(() => playTone(784, 0.3, 'sine', 0.4), 200);       // G5
    setTimeout(() => playSweep(1047, 2093, 0.4, 'triangle', 0.35), 280); // C6 to C7 sweep
    setTimeout(() => playTone(1568, 0.5, 'sine', 0.2), 400);      // G6 - sustain
  }, [playTone, playSweep, settings.enabled]);

  const playButtonClick = useCallback(() => {
    if (!settings.enabled) return;
    // Sharp, precise click with harmonic
    playTone(800, 0.04, 'square', 0.15);
    setTimeout(() => playTone(1200, 0.02, 'triangle', 0.1), 20);
  }, [playTone, settings.enabled]);

  const playButtonHover = useCallback(() => {
    if (!settings.enabled) return;
    // Subtle frequency sweep for hover
    playSweep(600, 720, 0.08, 'sine', 0.08);
  }, [playSweep, settings.enabled]);

  const playSuccess = useCallback(() => {
    if (!settings.enabled) return;
    
    // Bright success cascade with major chord progression
    setTimeout(() => playTone(523, 0.12, 'triangle', 0.35), 0);   // C5
    setTimeout(() => playTone(659, 0.12, 'sine', 0.3), 0);        // E5
    setTimeout(() => playTone(784, 0.12, 'triangle', 0.25), 0);   // G5
    setTimeout(() => playTone(698, 0.15, 'triangle', 0.4), 80);   // F5
    setTimeout(() => playTone(880, 0.15, 'sine', 0.35), 80);      // A5
    setTimeout(() => playTone(1047, 0.15, 'triangle', 0.3), 80);  // C6
    setTimeout(() => playTone(1175, 0.2, 'triangle', 0.4), 160);  // D6
    setTimeout(() => playTone(1319, 0.25, 'sine', 0.3), 200);     // E6
  }, [playTone, settings.enabled]);

  const playError = useCallback(() => {
    if (!settings.enabled) return;
    
    // Dissonant descending sequence for errors
    setTimeout(() => playTone(300, 0.08, 'sawtooth', 0.25), 0);
    setTimeout(() => playTone(280, 0.08, 'square', 0.2), 40);
    setTimeout(() => playTone(250, 0.12, 'sawtooth', 0.15), 80);
    setTimeout(() => playTone(200, 0.15, 'square', 0.1), 120);
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
    playRevealEpic,
    playButtonClick,
    playButtonHover,
    playSuccess,
    playError,
    toggleAudio,
    setVolume
  };
};