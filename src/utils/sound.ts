/**
 * The three-note reroll jingle, synthesised with the Web Audio API so no audio
 * file has to ship with the extension. `volume` is the user's 0..1 setting.
 */
export function playRollSound(volume = 0.5) {
  const AudioContextClass = window.AudioContext
  if (!AudioContextClass || volume <= 0) return

  const audio = new AudioContextClass()
  const notes = [880, 1174.66, 1567.98]
  const peak = 0.11 * volume

  notes.forEach((frequency, index) => {
    const start = audio.currentTime + index * 0.07
    const gain = audio.createGain()
    const oscillator = audio.createOscillator()

    oscillator.type = "triangle"
    oscillator.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09)

    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.1)
  })
}
