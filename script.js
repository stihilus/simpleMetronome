class Metronome {
    constructor() {
        this.bpm = 60;
        this.isPlaying = false;
        this.beats = 4;
        this.currentBeat = 0;
        this.audioContext = null;
        this.nextNoteTime = 0.0;
        this.lastTapTime = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateBeatCircles();
    }

    initializeElements() {
        this.bpmDisplay = document.getElementById('bpm');
        this.slider = document.getElementById('tempo-slider');
        this.startStopBtn = document.getElementById('start-stop');
        this.tapBtn = document.getElementById('tap-btn');
        this.beatCount = document.getElementById('beat-count');
        this.accentFirst = document.getElementById('accent-first');
        this.beatCirclesContainer = document.getElementById('beat-circles');
    }

    setupEventListeners() {
        document.getElementById('decrease').addEventListener('click', () => this.adjustTempo(-1));
        document.getElementById('increase').addEventListener('click', () => this.adjustTempo(1));
        this.slider.addEventListener('input', (e) => this.updateTempo(e.target.value));
        this.startStopBtn.addEventListener('click', () => this.togglePlay());
        this.tapBtn.addEventListener('click', () => this.handleTap());
        document.getElementById('decrease-beats').addEventListener('click', () => this.adjustBeats(-1));
        document.getElementById('increase-beats').addEventListener('click', () => this.adjustBeats(1));
        
        // Keyboard event listeners
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    handleKeyboard(e) {
        // Check if user is typing in an input field
        if (e.target.tagName === 'INPUT' && e.target.type !== 'range') {
            return;
        }
        
        // SPACE to start/stop
        if (e.code === 'Space') {
            e.preventDefault();
            this.togglePlay();
        }
        
        // LEFT arrow to decrease tempo by 5
        if (e.code === 'ArrowLeft') {
            e.preventDefault();
            this.adjustTempo(-5);
        }
        
        // RIGHT arrow to increase tempo by 5
        if (e.code === 'ArrowRight') {
            e.preventDefault();
            this.adjustTempo(5);
        }
    }

    updateBeatCircles() {
        this.createBeatBoxes(this.beats);
    }

    createBeatBoxes(count) {
        const container = document.getElementById('beat-circles');
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const box = document.createElement('div');
            box.className = 'beat-box';
            if (i === 0) box.classList.add('accent');
            container.appendChild(box);
        }
        this.beatCircles = document.querySelectorAll('.beat-box');
    }

    updateActiveBeat() {
        this.beatCircles.forEach((circle) => circle.classList.remove('active'));
        if (this.isPlaying) {
            this.beatCircles[this.currentBeat].classList.add('active');
        }
    }

    adjustTempo(change) {
        const newTempo = Math.min(Math.max(20, this.bpm + change), 240);
        this.updateTempo(newTempo);
    }

    updateTempo(newTempo) {
        this.bpm = parseInt(newTempo);
        this.bpmDisplay.textContent = this.bpm;
        this.slider.value = this.bpm;
        
        if (this.isPlaying) {
            this.stopMetronome();
            this.startMetronome();
        }
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        if (this.isPlaying) {
            this.startMetronome();
            this.startStopBtn.textContent = 'STOP';
            this.startStopBtn.classList.add('active');
        } else {
            this.stopMetronome();
            this.startStopBtn.textContent = 'START';
            this.startStopBtn.classList.remove('active');
            // Clear active beat when stopped
            this.currentBeat = 0;
            this.updateActiveBeat();
        }
    }

    startMetronome() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();
    }

    stopMetronome() {
        clearTimeout(this.timerID);
        this.currentBeat = 0;
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
            this.scheduleNote(this.nextNoteTime);
            this.nextNoteTime += 60.0 / this.bpm;
        }
        this.timerID = setTimeout(() => this.scheduler(), 25.0);
    }

    scheduleNote(time) {
        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        const isAccented = this.currentBeat === 0 && this.accentFirst.checked;
        const frequency = isAccented ? 1000 : 800;
        const gain = isAccented ? 1 : 0.7;

        osc.frequency.value = frequency;
        envelope.gain.value = gain;
        envelope.gain.exponentialRampToValueAtTime(gain, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(envelope);
        envelope.connect(this.audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.03);

        // Schedule the visual update
        setTimeout(() => {
            this.updateActiveBeat();
            this.currentBeat = (this.currentBeat + 1) % this.beats;
        }, time - this.audioContext.currentTime * 1000);
    }

    handleTap() {
        const currentTime = performance.now();
        if (this.lastTapTime) {
            const timeDiff = currentTime - this.lastTapTime;
            const newBpm = Math.round(60000 / timeDiff);
            if (newBpm >= 20 && newBpm <= 240) {
                this.updateTempo(newBpm);
            }
        }
        this.lastTapTime = currentTime;
        
        this.tapBtn.classList.add('active');
        setTimeout(() => this.tapBtn.classList.remove('active'), 100);
    }

    adjustBeats(change) {
        const newBeats = Math.min(Math.max(1, this.beats + change), 12);
        this.beats = newBeats;
        this.beatCount.textContent = newBeats;
        this.currentBeat = 0;
        this.updateBeatCircles();
        this.updateActiveBeat();
    }
}

// Initialize the metronome when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const metronome = new Metronome();
});
