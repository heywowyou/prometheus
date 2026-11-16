/**
 * A soft two-note chime from Web Audio, so there is no sound file to ship.
 * Browsers only allow audio after a user gesture: `primeAudio` is called from
 * the Start button so the chime can play when the phase ends later.
 */
let context: AudioContext | null = null;

export const primeAudio = () => {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    context ??= new Ctor();
    if (context.state === "suspended") void context.resume();
  } catch {
    context = null;
  }
};

export const playChime = () => {
  if (!context) return;
  const start = context.currentTime + 0.02;
  [659.25, 880].forEach((frequency, index) => {
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    const at = start + index * 0.28;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.18, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.2);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 1.25);
  });
};
