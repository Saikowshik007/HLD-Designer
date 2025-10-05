/**
 * Voice Service for handling speech-to-text and text-to-speech
 * Uses Web Speech API (Chrome) for both recognition and synthesis - completely free!
 */

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isListening: boolean = false;
  private resolveCallback: ((value: string) => void) | null = null;
  private rejectCallback: ((reason: Error) => void) | null = null;
  private startTime: number = 0;
  private language: string = 'en-US';

  constructor(language: string = 'en-US') {
    this.synthesis = window.speechSynthesis;
    this.language = language;

    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // Keep listening for longer phrases
      this.recognition.interimResults = true; // Show interim results for better feedback
      this.recognition.lang = this.language;
      this.recognition.maxAlternatives = 1; // We only need the best match

      // These improve accuracy (if browser supports them)
      if ('grammars' in this.recognition) {
        // Add technical terms context (some browsers support this)
        const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
        if (SpeechGrammarList) {
          const grammarList = new SpeechGrammarList();
          // Add system design related terms to improve recognition
          const grammar = '#JSGF V1.0; grammar systemDesign; public <term> = microservices | kubernetes | database | load balancer | cache | API | scalability | latency | throughput | sharding | replication | consistency | availability | partition tolerance | distributed system | message queue | CDN | nginx | redis | mongodb | postgresql | nosql | sql;';
          grammarList.addFromString(grammar, 1);
          this.recognition.grammars = grammarList;
        }
      }
    }
  }

  /**
   * Start voice recognition using Web Speech API (Chrome)
   * Returns a promise that resolves with the transcribed text when stopRecording is called
   */
  async startRecording(): Promise<string> {
    // First, check microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      throw new Error('Microphone access denied. Please allow microphone permissions in your browser.');
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported in this browser. Please use Chrome.'));
        return;
      }

      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }

      this.isListening = true;
      this.resolveCallback = resolve;
      this.rejectCallback = reject;
      let accumulatedTranscript = '';
      let hasReceivedSpeech = false;

      this.recognition.onresult = (event) => {
        // Build complete transcript from all results
        let finalTranscript = '';
        let interimTranscript = '';

        // Iterate through all results to separate final and interim
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Set accumulated to the complete final transcript, or use interim if no final yet
        if (finalTranscript.trim()) {
          accumulatedTranscript = finalTranscript.trim();
        } else if (interimTranscript.trim()) {
          accumulatedTranscript = interimTranscript.trim();
        }
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        let errorMessage = 'Speech recognition error';

        switch (event.error) {
          case 'no-speech':
            if (accumulatedTranscript.trim()) {
              this.resolveCallback?.(accumulatedTranscript.trim());
              this.cleanup();
              return;
            }
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not found or not accessible.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'aborted':
            if (accumulatedTranscript.trim()) {
              this.resolveCallback?.(accumulatedTranscript.trim());
              this.cleanup();
              return;
            }
            errorMessage = 'Recording stopped';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        this.rejectCallback?.(new Error(errorMessage));
        this.cleanup();
      };

      this.recognition.onend = () => {
        if (this.isListening && accumulatedTranscript.trim()) {
          this.resolveCallback?.(accumulatedTranscript.trim());
          this.cleanup();
        } else if (this.isListening) {
          if (!hasReceivedSpeech) {
            this.rejectCallback?.(new Error('No speech detected. Please check your microphone and try speaking louder.'));
          } else {
            this.rejectCallback?.(new Error('Could not transcribe speech. Please try again.'));
          }
          this.cleanup();
        }
        this.isListening = false;
      };

      this.recognition.onstart = () => {
        this.startTime = Date.now();
      };

      this.recognition.onspeechstart = () => {
        hasReceivedSpeech = true;
      };

      try {
        this.recognition.start();
      } catch (error) {
        this.isListening = false;
        this.cleanup();
        reject(error);
      }
    });
  }

  /**
   * Stop voice recognition and return accumulated transcript
   */
  stopRecording(): void {
    if (this.recognition && this.isListening) {
      const elapsed = Date.now() - this.startTime;

      // If stopped too quickly (< 500ms), give it more time
      if (elapsed < 500) {
        setTimeout(() => {
          if (this.isListening && this.recognition) {
            this.recognition.stop();
          }
        }, 500 - elapsed);
      } else {
        this.recognition.stop();
      }
    }
  }

  /**
   * Cleanup callbacks
   */
  private cleanup(): void {
    this.resolveCallback = null;
    this.rejectCallback = null;
  }

  /**
   * Update language setting
   */
  setLanguage(language: string): void {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  /**
   * Clean markdown formatting from text for better speech output
   */
  private cleanTextForSpeech(text: string): string {
    return text
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, 'code block')
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic markers
      .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/___([^_]+)___/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove images
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // Remove bullet points and list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove horizontal rules
      .replace(/^-{3,}$/gm, '')
      .replace(/^\*{3,}$/gm, '')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Speak text using browser Speech Synthesis
   */
  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): void {
    // Cancel any ongoing speech
    this.stopSpeaking();

    // Clean markdown formatting for better speech
    const cleanText = this.cleanTextForSpeech(text);

    this.currentUtterance = new SpeechSynthesisUtterance(cleanText);

    // Adjust parameters for more natural, human-like speech
    this.currentUtterance.rate = options?.rate || 0.95; // Slightly slower for clarity
    this.currentUtterance.pitch = options?.pitch || 1.1; // Slightly higher pitch for warmth
    this.currentUtterance.volume = options?.volume || 1.0;
    this.currentUtterance.lang = this.language;

    // Find the best natural-sounding voice
    const voices = this.synthesis.getVoices();
    const langPrefix = this.language.split('-')[0]; // e.g., 'en' from 'en-US'

    // Priority order for most natural voices
    let preferredVoice =
      // First: Look for premium/neural voices (Google, Microsoft Natural, Apple Enhanced)
      voices.find(v =>
        v.lang.startsWith(langPrefix) &&
        (v.name.includes('Google') ||
         v.name.includes('Premium') ||
         v.name.includes('Neural') ||
         v.name.includes('Enhanced') ||
         v.name.includes('Natural'))
      ) ||
      // Second: Look for specific good quality voices
      voices.find(v =>
        v.lang.startsWith(langPrefix) &&
        (v.name.includes('Samantha') || // macOS
         v.name.includes('Daniel') ||    // macOS
         v.name.includes('Karen') ||     // macOS
         v.name.includes('Zira') ||      // Windows
         v.name.includes('David'))       // Windows
      ) ||
      // Third: Any female voice (generally sounds warmer)
      voices.find(v =>
        v.lang.startsWith(langPrefix) &&
        (v.name.includes('Female') || v.name.toLowerCase().includes('female'))
      ) ||
      // Fourth: Exact language match
      voices.find(v => v.lang === this.language) ||
      // Last: Any voice in the same language family
      voices.find(v => v.lang.startsWith(langPrefix));

    if (preferredVoice) {
      this.currentUtterance.voice = preferredVoice;
    }

    this.synthesis.speak(this.currentUtterance);
  }

  /**
   * Stop current speech
   */
  stopSpeaking(): void {
    this.synthesis.cancel();
    this.currentUtterance = null;
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.isListening;
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    this.stopRecording();
    this.stopSpeaking();
  }
}

// Singleton instance
let voiceServiceInstance: VoiceService | null = null;

export const getVoiceService = (language?: string): VoiceService => {
  if (!voiceServiceInstance) {
    voiceServiceInstance = new VoiceService(language || 'en-US');
  } else if (language) {
    voiceServiceInstance.setLanguage(language);
  }
  return voiceServiceInstance;
};