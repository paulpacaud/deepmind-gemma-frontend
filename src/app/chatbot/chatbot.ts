import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormControl,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { SpeechService } from '../services/speech.service';

interface Msg {
  text: string;
  from: 'user' | 'bot';
  type?: 'text' | 'audio';
  timestamp?: Date;
  audioUrl?: string;
  isProcessing?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot {
  private readonly api = inject(ApiService);
  private readonly speech = inject(SpeechService);
  private readonly router = inject(Router);
  
  @ViewChild('chatContainer', { static: false }) chatContainer!: ElementRef;
  @ViewChild('audioElement', { static: false }) audioElement!: ElementRef<HTMLAudioElement>;

  private stream: MediaStream | null = null;

  messages = signal<Msg[]>([
    { 
      text: '👋 Hello! I am your AI Medical Assistant. You can type your medical questions or click the microphone to speak in English.', 
      from: 'bot',
      timestamp: new Date()
    },
  ]);

  input = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });
  
  sending = signal(false);
  recording = signal(false);
  processing = signal(false);
  audioSupported = signal(false);
  speechConfigured = signal(false);
  recordingTime = signal(0);
  private recordingInterval: any;

  ngOnInit() {
    this.audioSupported.set(!!navigator.mediaDevices?.getUserMedia);
    this.speechConfigured.set(this.speech.isConfigured());
    
    if (!this.speechConfigured()) {
      this.addMessage('⚠️ Speech recognition not available in this browser. Please use Chrome or Edge.', 'bot');
    } else {
      this.addMessage('✅ English speech recognition ready! Click the microphone to speak.', 'bot');
    }
  }

  ngOnDestroy() {
    this.stopRecording();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  send(): void {
    if (this.input.invalid || this.sending()) return;

    const content = this.input.value.trim();
    if (!content) return;

    this.addMessage(content, 'user', 'text');
    this.input.setValue('');
    this.sendToBot(content);
  }

  /**
   * Toggle recording - VISUAL FEEDBACK AMÉLIORÉ
   */
  toggleRecording(): void {
    if (this.recording()) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  /**
   * Start recording avec feedback visuel immédiat
   */
  private async startRecording(): Promise<void> {
    if (!this.audioSupported()) {
      this.addMessage('❌ Audio recording not supported in this browser.', 'bot');
      return;
    }

    if (this.processing() || this.sending()) {
      this.addMessage('⏳ Please wait for current processing to complete.', 'bot');
      return;
    }

    try {
      console.log('🎤 [DEBUG] Requesting microphone access...');
      
      // FEEDBACK VISUEL IMMÉDIAT
      this.recording.set(true);
      this.recordingTime.set(0);
      
      // Démarre le compteur visuel immédiatement
      this.recordingInterval = setInterval(() => {
        this.recordingTime.update(time => time + 1);
      }, 1000);

      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      console.log('🎤 [DEBUG] Microphone access granted');

      // Message de feedback dans le chat
      this.addMessage('🎤 Listening... Speak clearly in English.', 'bot');
      
      // Démarre la reconnaissance vocale
      this.startSpeechRecognition();

    } catch (error) {
      console.error('🎤 [ERROR] Microphone access error:', error);
      this.addMessage('❌ Unable to access microphone. Please check permissions.', 'bot');
      this.recording.set(false);
      this.recordingTime.set(0);
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
      }
    }
  }

  /**
   * Stop recording avec feedback visuel
   */
  private stopRecording(): void {
    if (!this.recording()) return;

    console.log('🎤 [DEBUG] Stopping recording...');
    
    // FEEDBACK VISUEL IMMÉDIAT
    this.recording.set(false);
    this.recordingTime.set(0);
    
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    console.log('🎤 [DEBUG] Recording stopped');
  }

  /**
   * Start speech recognition
   */
  private startSpeechRecognition(): void {
    console.log('🎤 [DEBUG] Starting speech recognition...');
    
    const messageIndex = this.addMessage('🎤 Processing your voice...', 'user', 'audio', undefined, true);
    this.processing.set(true);

    this.speech.speechToText(new Blob()).subscribe({
      next: (result) => {
        this.processing.set(false);
        this.recording.set(false);
        
        if (this.recordingInterval) {
          clearInterval(this.recordingInterval);
        }
        
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        if (result.transcript && result.transcript.trim() && 
            !result.transcript.includes('error') && 
            !result.transcript.includes('No speech') &&
            !result.transcript.includes('not supported')) {
          
          // SUCCÈS
          const displayText = `🎤 "${result.transcript}" (${result.confidence}%)`;
          this.updateMessage(messageIndex, displayText);
          this.sendToBot(result.transcript);
        } else {
          // ÉCHEC
          this.updateMessage(messageIndex, `🎤 ${result.transcript}`);
        }
      },
      error: (error) => {
        console.error('🎤 [ERROR] Speech recognition error:', error);
        this.processing.set(false);
        this.recording.set(false);
        
        if (this.recordingInterval) {
          clearInterval(this.recordingInterval);
        }
        
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        this.updateMessage(messageIndex, '🎤 Speech recognition failed');
      }
    });
  }

  private addMessage(text: string, from: 'user' | 'bot', type: 'text' | 'audio' = 'text', audioUrl?: string, isProcessing: boolean = false): number {
    const newMessage: Msg = {
      text, 
      from, 
      type, 
      timestamp: new Date(),
      audioUrl,
      isProcessing
    };
    
    this.messages.update(m => [...m, newMessage]);
    setTimeout(() => this.scrollToBottom(), 100);
    return this.messages().length - 1;
  }

  private updateMessage(index: number, newText: string): void {
    this.messages.update(messages => {
      const updated = [...messages];
      if (updated[index]) {
        updated[index] = { ...updated[index], text: newText, isProcessing: false };
      }
      return updated;
    });
  }

  private sendToBot(message: string): void {
    this.sending.set(true);

    this.api.chat(message).subscribe({
      next: (reply: string) => {
        this.addMessage(reply, 'bot');
        this.sending.set(false);
      },
      error: () => {
        this.addMessage('❌ Sorry, an error occurred.', 'bot');
        this.sending.set(false);
      },
    });
  }

  playAudio(audioUrl: string): void {
    if (this.audioElement) {
      this.audioElement.nativeElement.src = audioUrl;
      this.audioElement.nativeElement.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Format message text to handle line breaks
   */
  formatMessageText(text: string): string {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
  }

  private scrollToBottom(): void {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  back(): void {
    this.router.navigateByUrl('/');
  }
}