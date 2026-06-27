import { soundSynth } from '../audio/SoundSynth.js';

export default class CutsceneScene extends Phaser.Scene {
    constructor() {
        super('CutsceneScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Draw solid dark background
        const bg = this.add.graphics();
        bg.fillStyle(0x020303, 1);
        bg.fillRect(0, 0, width, height);

        // Load correct script lines based on chapter
        this.dialogueLines = this.getDialogueForChapter(window.gameState.currentChapter);
        this.currentLineIdx = 0;

        // Visual novel setup
        this.textDisplay = this.add.text(80, height / 2 - 40, '', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '18px',
            color: '#3bbf3b',
            wordWrap: { width: width - 160 },
            lineSpacing: 10
        });

        this.promptText = this.add.text(width / 2, height - 60, 'PRESS [SPACE] TO CONTINUE', {
            fontFamily: 'Courier Prime, Courier, monospace',
            fontSize: '11px',
            color: '#666'
        }).setOrigin(0.5).setAlpha(0);

        // Slow loop for prompt blinking
        this.tweens.add({
            targets: this.promptText,
            alpha: 1,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Play static radio hum/screaming background atmosphere
        this.playRadioHum();

        // Start typewriter
        this.displayNextLine();

        // Inputs
        this.input.keyboard.on('keydown-SPACE', this.onAdvance, this);
        this.input.on('pointerdown', this.onAdvance, this);
    }

    getDialogueForChapter(chapterNum) {
        switch (chapterNum) {
            case 1:
                return [
                    "ANO 2036. A GRANDE GUERRA QUE DEVASTOU METADE DO PAÍS FINALMENTE TERMINOU.",
                    "O SILÊNCIO DAS RUÍNAS É PIOR DO QUE O BARULHO DAS BOMBAS...",
                    "ELIAS WARD SENTA-SE NO ESCURO. SEU CORPO CARREGA AS CICATRIZES DO COMBATE. SUA MENTE CARREGA ALGO MUITO PIOR.",
                    "DE REPENTE, O VELHO RÁDIO MILITAR COMEÇA A CHIAR...",
                    "ESTÁTICO... '...Ward... Elias Ward... Nós a encontramos. Sua esposa, Claire... ela está viva.'",
                    "'Eles a mantêm no Setor 9. Corra...'",
                    "ELIAS PEGA SUA PISTOLA M19. A VOZ DO RÁDIO DEU A ELE A ÚNICA COISA QUE RESTAVA.",
                    "ESPERANÇA.",
                    "ELIAS: 'Aguente firme, Claire. Eu estou indo te buscar.'"
                ];
            case 2:
                return [
                    "ELIAS AVANÇA POR CIDADE DESTRUÍDA SOB UMA CHUVA TORRENCIAL.",
                    "O RÁDIO GUIA SEUS PASSOS ATÉ O ANTIGO HOSPITAL MILITAR.",
                    "O LUGAR CHEIRA A CLORO E MORTE. AS LUZES PISCAM, PROJETANDO SOMBRAS DISTORCIDAS.",
                    "ELIAS: 'Tem algo de errado aqui... ouço sussurros... rostos aparecem no escuro.'",
                    "RÁDIO: 'Elias... continue. Eles estão controlando a mente dela. Mate qualquer um que entrar no seu caminho.'"
                ];
            case 3:
                return [
                    "OS INIMIGOS PARECEM MAIS AGRESSIVOS. NÃO PARECEM MAIS HUMANOS.",
                    "ELIAS DESCE PARA A ESCURIDÃO DOS TÚNEIS DO METRÔ.",
                    "A ESTRUTURA METÁLICA RETORCIDA PARECE A JAULA DE UMA FERA.",
                    "AS LUZES DE EMERGÊNCIA VERMELHAS BANHAM OS TRILHOS EM SANGUE.",
                    "ELIAS: 'Eles estão por toda parte... eu consigo ouvir a respiração deles...'",
                    "ELIAS: '...mas eles não vão me impedir de chegar em casa.'"
                ];
            case 4:
                return [
                    "AO EMERGER DO SUBTERRÂNEO, ELIAS ENCONTRA A FAVELA TOTALMENTE DESTRUÍDA.",
                    "VIGAS DE AÇO EXPOSTAS, CONCRETO QUEBRADO, ATIRADORES NOS TELHADOS.",
                    "LASERS VERMELHOS CORTAM A NEBLINA ESPESSA DA MADRUGADA.",
                    "ELIAS: 'Eu sinto a Claire... ela está perto. Consigo ouvir o choro dela...'",
                    "RÁDIO: 'Cuidado, Elias. O General da base ordenou que os atiradores o eliminem. Eles sabem a verdade.'"
                ];
            case 5:
                return [
                    "ELIAS INVADE O COMPLEXO DA BASE MILITAR DO SETOR 9.",
                    "A CHUVA APERTA. SANGUE E LAMA SE MISTURAM.",
                    "NO TOPO DA BASE, O GENERAL WARD AGUARDA COM SUA ARMADURA E SUAS METRALHADORAS.",
                    "GENERAL: 'Soldado Ward! Acorde! Olhe para o que você está fazendo! Não há ninguém aqui!'",
                    "ELIAS: 'Mentiroso! Você tirou tudo de mim! Onde está minha esposa?! Onde está minha filha?!'",
                    "GENERAL: 'Você mesmo os destruiu... no dia da bomba...'"
                ];
            case 6:
                return [
                    "O GENERAL CAIU. A BASE MILITAR ESTÁ EM SILÊNCIO.",
                    "ELIAS CAMINHA, EXAUSTO, SANGUINOLENTO. ELE SEGUE O ÚLTIMO ENDEREÇO INDICADO.",
                    "ELE CHEGA A UMA PEQUENA CASA SUBURBANA, SURPREENDENTEMENTE INTACTA.",
                    "A CHUVA PAROU. A NEBLINA SE DISSIPA LENTAMENTE.",
                    "O RÁDIO EM SEU BOLSO ESTÁ TOTALMENTE SILENCIOSO. SEM RUÍDO. SEM ESTÁTICO.",
                    "ELIAS EMPURRA A PORTA DE ENTRADA.",
                    "ELIAS: 'Claire? Filha?... Eu cheguei em casa.'"
                ];
            default:
                return [];
        }
    }

    displayNextLine() {
        if (this.currentLineIdx >= this.dialogueLines.length) {
            this.finishCutscene();
            return;
        }

        const line = this.dialogueLines[this.currentLineIdx];
        this.currentLineIdx++;

        this.typewriterEffect(line);
    }

    typewriterEffect(text) {
        this.textDisplay.setText('');
        this.promptText.setAlpha(0); // hide prompt during typing
        
        let charIdx = 0;
        
        // Typewriter audio tick
        this.typewriterTimer = this.time.addEvent({
            delay: 35,
            callback: () => {
                this.textDisplay.setText(text.substring(0, charIdx + 1));
                charIdx++;
                
                // Play typewriter mechanical tick sound
                if (window.gameState.audioInitialized && charIdx % 2 === 0) {
                    try {
                        const time = soundSynth.ctx.currentTime;
                        const osc = soundSynth.ctx.createOscillator();
                        const gain = soundSynth.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(150, time);
                        gain.gain.setValueAtTime(0.015, time);
                        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.02);
                        osc.connect(gain);
                        gain.connect(soundSynth.sfxVolume);
                        osc.start(time);
                        osc.stop(time + 0.02);
                    } catch (e) {}
                }

                if (charIdx >= text.length) {
                    this.typewriterTimer.remove();
                    this.promptText.setAlpha(1); // show blink prompt
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    onAdvance() {
        // If still typing, skip to full text
        if (this.typewriterTimer && this.typewriterTimer.loop) {
            this.typewriterTimer.remove();
            this.textDisplay.setText(this.dialogueLines[this.currentLineIdx - 1]);
            this.promptText.setAlpha(1);
            return;
        }

        // Play press confirm sound
        if (window.gameState.audioInitialized) {
            try {
                const time = soundSynth.ctx.currentTime;
                const osc = soundSynth.ctx.createOscillator();
                const gain = soundSynth.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(350, time);
                gain.gain.setValueAtTime(0.05, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
                osc.connect(gain);
                gain.connect(soundSynth.sfxVolume);
                osc.start(time);
                osc.stop(time + 0.08);
            } catch (e) {}
        }

        this.displayNextLine();
    }

    finishCutscene() {
        // Stop radio atmosphere
        this.stopRadioHum();
        
        // Start game play scene
        this.scene.start('GameScene');
    }

    playRadioHum() {
        if (!window.gameState.audioInitialized) return;
        try {
            const time = soundSynth.ctx.currentTime;
            
            // Continuous radio static hum
            this.radioOsc = soundSynth.ctx.createOscillator();
            this.radioGain = soundSynth.ctx.createGain();
            
            // Use low frequency sawtooth with noise modulation for static radio hum
            this.radioOsc.type = 'triangle';
            this.radioOsc.frequency.value = 60; // 60Hz hum
            
            // Filter to make it muffled
            this.radioFilter = soundSynth.ctx.createBiquadFilter();
            this.radioFilter.type = 'bandpass';
            this.radioFilter.frequency.value = 400;
            this.radioFilter.Q.value = 2.0;

            this.radioOsc.connect(this.radioFilter);
            this.radioFilter.connect(this.radioGain);
            this.radioGain.connect(soundSynth.sfxVolume);
            
            this.radioGain.gain.setValueAtTime(0.05, time);
            
            this.radioOsc.start(time);
        } catch (e) {}
    }

    stopRadioHum() {
        if (this.radioOsc) {
            try {
                this.radioOsc.stop();
                this.radioOsc.disconnect();
                this.radioOsc = null;
            } catch (e) {}
        }
    }
}
