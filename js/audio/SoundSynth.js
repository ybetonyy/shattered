export default class SoundSynth {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.musicVolume = null;
        this.sfxVolume = null;
        
        this.heartbeatInterval = null;
        this.heartbeatActive = false;
        
        // Sequencer variables for music
        this.seqTimer = null;
        this.currentBeat = 0;
        this.bpm = 124;
        this.currentTrack = null;
        this.isPlayingMusic = false;
        this.nextNoteTime = 0.0;
        this.scheduleAheadTime = 0.1; // seconds
        this.lookahead = 25.0; // milliseconds
    }

    init() {
        if (this.ctx) return;
        
        // Create audio context
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        
        // Master Nodes
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.gain.value = 0.8;
        
        this.musicVolume = this.ctx.createGain();
        this.musicVolume.gain.value = 0.55;
        
        this.sfxVolume = this.ctx.createGain();
        this.sfxVolume.gain.value = 0.75;
        
        this.musicVolume.connect(this.masterVolume);
        this.sfxVolume.connect(this.masterVolume);
        this.masterVolume.connect(this.ctx.destination);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- SFX SYNTHESIS ---

    // Noise helper
    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playShoot(type = 'pistol') {
        this.resume();
        if (!this.ctx) return;

        const time = this.ctx.currentTime;
        
        // 1. Drum/Punch Element
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        
        osc.connect(oscGain);
        oscGain.connect(this.sfxVolume);
        
        // 2. Noise/Fire Element
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        
        const noiseFilter = this.ctx.createBiquadFilter();
        const noiseGain = this.ctx.createGain();
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxVolume);

        if (type === 'pistol' || type === 'revolver') {
            const duration = type === 'revolver' ? 0.35 : 0.22;
            const volume = type === 'revolver' ? 1.0 : 0.7;
            const freq = type === 'revolver' ? 180 : 250;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
            
            oscGain.gain.setValueAtTime(volume, time);
            oscGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(1000, time);
            noiseFilter.Q.setValueAtTime(3.0, time);
            
            noiseGain.gain.setValueAtTime(volume * 0.8, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.05);
            
            osc.start(time);
            osc.stop(time + duration);
            noise.start(time);
            noise.stop(time + duration);
        } 
        else if (type === 'shotgun') {
            // Loud boom, heavy low-end sweep, long white noise blast
            const duration = 0.6;
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, time);
            osc.frequency.linearRampToValueAtTime(20, time + 0.25);
            
            oscGain.gain.setValueAtTime(1.2, time);
            oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
            
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(800, time);
            noiseFilter.frequency.exponentialRampToValueAtTime(100, time + 0.4);
            
            noiseGain.gain.setValueAtTime(1.4, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            
            osc.start(time);
            osc.stop(time + 0.3);
            noise.start(time);
            noise.stop(time + duration);
        }
        else if (type === 'rifle') {
            // High pitch kick, quick noise punch
            const duration = 0.18;
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, time);
            osc.frequency.exponentialRampToValueAtTime(50, time + 0.05);
            
            oscGain.gain.setValueAtTime(0.8, time);
            oscGain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(1500, time);
            
            noiseGain.gain.setValueAtTime(0.9, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.02);
            
            osc.start(time);
            osc.stop(time + duration);
            noise.start(time);
            noise.stop(time + duration);
        }
    }

    playSlash() {
        this.resume();
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const duration = 0.15;

        // Blade swish: frequency sweep from 800Hz to 2000Hz back to 300Hz
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, time);
        osc.frequency.exponentialRampToValueAtTime(1800, time + 0.05);
        osc.frequency.exponentialRampToValueAtTime(300, time + duration);

        oscGain.gain.setValueAtTime(0.4, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(oscGain);
        oscGain.connect(this.sfxVolume);

        osc.start(time);
        osc.stop(time + duration);
    }

    playAxe() {
        this.resume();
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const duration = 0.35;

        // Heavy slow swing: deep pitch sweep + noise click
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, time);
        osc.frequency.linearRampToValueAtTime(40, time + duration);

        oscGain.gain.setValueAtTime(0.6, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(oscGain);
        oscGain.connect(this.sfxVolume);

        osc.start(time);
        osc.stop(time + duration);
    }

    playReload() {
        this.resume();
        if (!this.ctx) return;
        const time = this.ctx.currentTime;

        // Double click/metallic rattle
        const playClick = (delay, pitch) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(pitch, time + delay);
            osc.frequency.linearRampToValueAtTime(pitch / 2, time + delay + 0.04);
            
            gain.gain.setValueAtTime(0.25, time + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, time + delay + 0.05);
            
            osc.connect(gain);
            gain.connect(this.sfxVolume);
            osc.start(time + delay);
            osc.stop(time + delay + 0.05);
        };

        playClick(0, 1200);   // eject/magazine out
        playClick(0.18, 900);  // magazine in
        playClick(0.32, 1400); // slide chamber release
    }

    playScream() {
        this.resume();
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const duration = 0.5;

        // Moody/horror vocal sweep (sawtooth with vibrato and bandpass sweep)
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, time);
        osc.frequency.linearRampToValueAtTime(150, time + duration);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440, time);
        osc2.frequency.linearRampToValueAtTime(140, time + duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.linearRampToValueAtTime(300, time + duration);
        filter.Q.value = 4.0;

        oscGain.gain.setValueAtTime(0.35, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.sfxVolume);

        osc.start(time);
        osc.stop(time + duration);
        osc2.start(time);
        osc2.stop(time + duration);
    }

    playGlassBreak() {
        this.resume();
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const duration = 0.25;

        // High frequency tiny tones
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            const f = 2000 + Math.random() * 2500;
            osc.frequency.setValueAtTime(f, time);
            osc.frequency.exponentialRampToValueAtTime(f - 800, time + duration);

            gain.gain.setValueAtTime(0.2, time + Math.random() * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

            osc.connect(gain);
            gain.connect(this.sfxVolume);
            osc.start(time);
            osc.stop(time + duration);
        }
    }

    playExplosion() {
        this.resume();
        if (!this.ctx) return;
        const time = this.ctx.currentTime;
        const duration = 1.6;

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, time);
        filter.frequency.exponentialRampToValueAtTime(10, time + duration);
        filter.Q.value = 1.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(1.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxVolume);

        noise.start(time);
        noise.stop(time + duration);

        // Sub bass blast
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, time);
        osc.frequency.linearRampToValueAtTime(20, time + 0.4);
        oscGain.gain.setValueAtTime(1.5, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);

        osc.connect(oscGain);
        oscGain.connect(this.sfxVolume);

        osc.start(time);
        osc.stop(time + 0.5);
    }

    // --- ATMOSPHERIC PULSES (HEARTBEAT & BREATHING) ---

    playHeartbeat(bpm = 72) {
        if (!this.ctx || this.heartbeatActive) return;
        this.heartbeatActive = true;

        const intervalMs = (60 / bpm) * 1000;

        const playPulse = () => {
            if (!this.heartbeatActive) return;
            const time = this.ctx.currentTime;
            
            // Heartbeat: lub-dub
            const lub = this.ctx.createOscillator();
            const lubGain = this.ctx.createGain();
            lub.type = 'sine';
            lub.frequency.setValueAtTime(55, time);
            lubGain.gain.setValueAtTime(0.5, time);
            lubGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
            lub.connect(lubGain);
            lubGain.connect(this.sfxVolume);
            lub.start(time);
            lub.stop(time + 0.12);

            // Dub (slightly higher pitch, slightly delayed)
            const dub = this.ctx.createOscillator();
            const dubGain = this.ctx.createGain();
            dub.type = 'sine';
            dub.frequency.setValueAtTime(60, time + 0.18);
            dubGain.gain.setValueAtTime(0.4, time + 0.18);
            dubGain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);
            dub.connect(dubGain);
            dubGain.connect(this.sfxVolume);
            dub.start(time + 0.18);
            dub.stop(time + 0.32);

            // Schedule next beat
            this.heartbeatInterval = setTimeout(playPulse, intervalMs);
        };

        playPulse();
    }

    stopHeartbeat() {
        this.heartbeatActive = false;
        if (this.heartbeatInterval) {
            clearTimeout(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    updateHeartRate(bpm) {
        if (this.heartbeatActive) {
            this.stopHeartbeat();
            this.playHeartbeat(bpm);
        }
    }

    // --- MUSIC SEQUENCER ---

    startMusic(type = 'game') {
        this.resume();
        if (!this.ctx) return;
        
        if (this.isPlayingMusic) {
            if (this.currentTrack === type) return;
            this.stopMusic();
        }

        this.currentTrack = type;
        this.isPlayingMusic = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.ctx.currentTime;
        
        this.bpm = type === 'ending' ? 84 : 122; // Where is my mind is slower (84 BPM)

        this.scheduler();
    }

    stopMusic() {
        this.isPlayingMusic = false;
        if (this.seqTimer) {
            clearTimeout(this.seqTimer);
            this.seqTimer = null;
        }
    }

    scheduler() {
        if (!this.isPlayingMusic) return;

        // Prevent catch-up loop freeze when tab is backgrounded
        if (this.nextNoteTime < this.ctx.currentTime) {
            this.nextNoteTime = this.ctx.currentTime;
        }

        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNextNote(this.currentBeat, this.nextNoteTime);
            this.advanceBeat();
        }
        
        this.seqTimer = setTimeout(() => this.scheduler(), this.lookahead);
    }

    advanceBeat() {
        const secondsPerBeat = 60.0 / this.bpm;
        const stepDuration = secondsPerBeat / 4; // 16th notes
        this.nextNoteTime += stepDuration;
        
        this.currentBeat = (this.currentBeat + 1) % 32; // 32 steps sequence (2 bars)
    }

    scheduleNextNote(step, time) {
        if (this.currentTrack === 'game') {
            this.playGameTrackStep(step, time);
        } else if (this.currentTrack === 'ending') {
            this.playEndingTrackStep(step, time);
        }
    }

    // --- GAME SOUNDTRACK (Molchat Doma style: Dark synthwave / post-punk) ---
    playGameTrackStep(step, time) {
        // drum pattern:
        // Kick on 0, 8, 16, 24.
        // Snare on 4, 12, 20, 28.
        // Closed Hihat on all even steps.
        
        const kickSteps = [0, 8, 14, 16, 24, 30];
        const snareSteps = [4, 12, 20, 28];
        const hatSteps = [2, 6, 10, 14, 18, 22, 26, 30];

        if (kickSteps.includes(step)) this.synthKick(time);
        if (snareSteps.includes(step)) this.synthSnare(time);
        if (hatSteps.includes(step)) this.synthHat(time);

        // Synth Bassline: Dark analog minor progression
        // Progression: E2, C2, D2, B1 (Each chords is 8 steps / 2 beats)
        let bassFreq = 82.41; // E2
        if (step >= 8 && step < 16) bassFreq = 65.41; // C2
        if (step >= 16 && step < 24) bassFreq = 73.42; // D2
        if (step >= 24 && step < 32) bassFreq = 61.74; // B1

        // Play bass note on 16th pulses (constant dark pulse)
        // 8th note pulsing: step % 2 === 0
        if (step % 2 === 0) {
            this.synthBass(bassFreq, time, 0.18);
        }

        // Melodic Lead Synthesizer: repeating gloomy post-punk melody
        // Notes in key: B, C, B, A, G, E
        // Only trigger on certain steps
        const melodySteps = {
            0: 329.63,  // E4
            2: 392.00,  // G4
            4: 493.88,  // B4
            6: 493.88,  // B4
            8: 523.25,  // C5
            10: 493.88, // B4
            12: 440.00, // A4
            14: 392.00, // G4
            16: 329.63, // E4
            20: 392.00, // G4
            24: 440.00, // A4
            26: 493.88, // B4
            28: 392.00, // G4
            30: 349.23  // F4
        };

        if (melodySteps[step]) {
            this.synthLead(melodySteps[step], time, 0.25);
        }
    }

    // --- ENDING TRACK (Pixies - Where Is My Mind Synth-Cover) ---
    playEndingTrackStep(step, time) {
        // Slow emotional tempo
        // Progression: E Maj, C# min, G# Maj, A Maj
        // 32-step sequence. Each chord takes 8 steps.
        
        // Root bass notes
        let bassFreq = 82.41; // E2 (steps 0-7)
        if (step >= 8 && step < 16) bassFreq = 69.30;  // C#2 (steps 8-15)
        if (step >= 16 && step < 24) bassFreq = 51.91; // G#1 (steps 16-23)
        if (step >= 24 && step < 32) bassFreq = 55.00; // A1 (steps 24-31)

        // Slow pulse kick on 0, 4, 8, 12, 16, 20, 24, 28
        if (step % 4 === 0) {
            this.synthKick(time, 0.4); // softer kick
        }
        
        // Snare on 4, 12, 20, 28
        if (step % 8 === 4) {
            this.synthSnare(time, 0.25); // softer snare
        }

        // Bass playing on 1 and 3 of the chord (steps 0, 2, 4, 8, 10, 12, etc.)
        if (step % 4 === 0 || step % 4 === 2) {
            this.synthBass(bassFreq, time, 0.35, 'sawtooth'); // warm bass
        }

        // Piano/Synth Arpeggio Lead (The famous riff)
        // Riff: E4, G#4, B4, E5, etc.
        // Let's create a beautiful chime arpeggio
        const arpeggio = [
            // E Maj
            { step: 0, note: 329.63 }, // E4
            { step: 1, note: 415.30 }, // G#4
            { step: 2, note: 493.88 }, // B4
            { step: 3, note: 659.25 }, // E5
            // C# min
            { step: 8, note: 349.23 }, // C#4 (277.18)
            { step: 9, note: 415.30 }, // E4
            { step: 10, note: 493.88 }, // G#4
            { step: 11, note: 554.37 }, // C#5
            // G# Maj
            { step: 16, note: 415.30 }, // G#4
            { step: 17, note: 519.10 }, // C#5
            { step: 18, note: 622.25 }, // D#5
            { step: 19, note: 830.61 }, // G#5
            // A Maj
            { step: 24, note: 440.00 }, // A4
            { step: 25, note: 554.37 }, // C#5
            { step: 26, note: 659.25 }, // E5
            { step: 27, note: 880.00 }  // A5
        ];

        const match = arpeggio.find(a => a.step === step);
        if (match) {
            this.synthChime(match.note, time, 0.5);
        }
    }

    // --- SEQUENCER INSTRUMENT SYNTHS ---

    synthKick(time, gainVal = 0.8) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.musicVolume);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);

        gain.gain.setValueAtTime(gainVal, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        osc.start(time);
        osc.stop(time + 0.16);
    }

    synthSnare(time, gainVal = 0.4) {
        // Noise buffer snare
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, time);

        const gain = this.ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicVolume);

        gain.gain.setValueAtTime(gainVal, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        noise.start(time);
        noise.stop(time + 0.16);

        // add a high metallic snap oscillator
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, time);
        oscGain.gain.setValueAtTime(gainVal * 0.6, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.musicVolume);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    synthHat(time) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);

        const gain = this.ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicVolume);

        gain.gain.setValueAtTime(0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        noise.start(time);
        noise.stop(time + 0.05);
    }

    synthBass(freq, time, duration, type = 'sawtooth') {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        // sub octave layering
        const sub = this.ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(freq / 2, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, time);

        gain.gain.setValueAtTime(0.38, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        sub.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicVolume);

        osc.start(time);
        sub.start(time);
        osc.stop(time + duration);
        sub.stop(time + duration);
    }

    synthLead(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        
        // vibrato
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.value = 6; // 6Hz
        lfoGain.gain.value = 5; // modulate frequency by 5Hz
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, time);
        filter.frequency.linearRampToValueAtTime(400, time + duration);

        // delay effect simulation
        const delay = this.ctx.createDelay();
        delay.delayTime.value = 0.12;
        const delayGain = this.ctx.createGain();
        delayGain.gain.value = 0.25;

        gain.gain.setValueAtTime(0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicVolume);

        // Connect delay feedback loop
        gain.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(this.musicVolume);
        delayGain.connect(delay); // feedback

        lfo.start(time);
        osc.start(time);
        lfo.stop(time + duration);
        osc.stop(time + duration);
    }

    synthChime(freq, time, duration) {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // High crystal tine / chime sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2.01, time); // slight detune

        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.musicVolume);

        osc.start(time);
        osc2.start(time);
        osc.stop(time + duration);
        osc2.stop(time + duration);
    }
}

// Global single instance of SoundSynth
window.soundSynth = new SoundSynth();
export const soundSynth = window.soundSynth;
