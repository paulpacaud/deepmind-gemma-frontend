import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SpeechResult {
  transcript: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  
  constructor() {}

  /**
   * Version simplifiée et robuste pour l'anglais médical
   */
  speechToText(audioBlob: Blob): Observable<SpeechResult> {
    console.log('🎤 [DEBUG] Starting English speech recognition');
    
    return new Observable(observer => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('🎤 [ERROR] Speech Recognition not supported');
        observer.next({ 
          transcript: 'Speech recognition not supported in this browser', 
          confidence: 0 
        });
        observer.complete();
        return;
      }

      console.log('🎤 [DEBUG] Creating SpeechRecognition instance');
      const recognition = new SpeechRecognition();
      
      // CONFIGURATION SIMPLIFIÉE ET ROBUSTE
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      let finalTranscript = '';
      let hasResult = false;
      let timeoutId: any;

      // Timeout de sécurité (10 secondes)
      const startTimeout = () => {
        timeoutId = setTimeout(() => {
          console.log('🎤 [DEBUG] Timeout reached, stopping recognition');
          try {
            recognition.stop();
          } catch (e) {
            console.log('🎤 [DEBUG] Recognition already stopped');
          }
        }, 10000);
      };

      recognition.onstart = () => {
        console.log('🎤 [SUCCESS] Speech recognition started successfully');
        startTimeout();
      };

      recognition.onresult = (event: any) => {
        console.log('🎤 [DEBUG] Result received:', event.results.length, 'results');
        
        let interimTranscript = '';
        let currentFinal = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          
          if (result.isFinal) {
            currentFinal += transcript;
            hasResult = true;
            console.log('🎤 [DEBUG] Final result:', transcript);
          } else {
            interimTranscript += transcript;
            console.log('🎤 [DEBUG] Interim result:', transcript);
          }
        }
        
        if (currentFinal) {
          finalTranscript += currentFinal;
        }
        
        // Si on a un résultat final, on peut arrêter
        if (hasResult && currentFinal.trim()) {
          console.log('🎤 [DEBUG] Good result received, stopping...');
          clearTimeout(timeoutId);
          setTimeout(() => {
            try {
              recognition.stop();
            } catch (e) {
              console.log('🎤 [DEBUG] Already stopped');
            }
          }, 500);
        }
      };

      recognition.onend = () => {
        console.log('🎤 [DEBUG] Speech recognition ended');
        clearTimeout(timeoutId);
        
        const cleanedTranscript = this.cleanMedicalText(finalTranscript);
        console.log('🎤 [DEBUG] Final cleaned transcript:', cleanedTranscript);
        
        if (cleanedTranscript.trim()) {
          observer.next({ 
            transcript: cleanedTranscript, 
            confidence: 90 
          });
        } else {
          observer.next({ 
            transcript: 'No speech detected', 
            confidence: 0 
          });
        }
        observer.complete();
      };

      recognition.onerror = (event: any) => {
        console.error('🎤 [ERROR] Speech recognition error:', event.error);
        clearTimeout(timeoutId);
        
        let errorMessage = '';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone error';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied';
            break;
          case 'network':
            errorMessage = 'Network error';
            break;
          case 'aborted':
            errorMessage = 'Recognition aborted';
            break;
          default:
            errorMessage = `Speech error: ${event.error}`;
        }
        
        observer.next({ transcript: errorMessage, confidence: 0 });
        observer.complete();
      };

      // Événements audio pour debug
      recognition.onspeechstart = () => {
        console.log('🎤 [DEBUG] Speech detected!');
        hasResult = true;
      };

      recognition.onspeechend = () => {
        console.log('🎤 [DEBUG] Speech ended');
      };

      recognition.onsoundstart = () => {
        console.log('🎤 [DEBUG] Sound detected');
      };

      recognition.onsoundend = () => {
        console.log('🎤 [DEBUG] Sound ended');
      };

      // Démarrage avec gestion d'erreur
      try {
        console.log('🎤 [DEBUG] Starting recognition...');
        recognition.start();
      } catch (error) {
        console.error('🎤 [ERROR] Failed to start:', error);
        observer.next({ transcript: 'Failed to start speech recognition', confidence: 0 });
        observer.complete();
      }

      // Cleanup
      return () => {
        try {
          clearTimeout(timeoutId);
          recognition.stop();
        } catch (e) {
          console.log('🎤 [DEBUG] Cleanup completed');
        }
      };
    });
  }

  /**
   * Nettoyage simple du texte médical
   */
  private cleanMedicalText(text: string): string {
    if (!text) return '';
    
    let cleaned = text.trim();
    
    // Corrections simples et efficaces
    const corrections: { [key: string]: string } = {
      'patience': 'patient',
      'patients': 'patients',
      'medicashan': 'medication',
      'prescripsion': 'prescription',
      'blud presure': 'blood pressure',
      'hart rate': 'heart rate',
      'diabetis': 'diabetes',
      'BP': 'blood pressure',
      'HR': 'heart rate'
    };
    
    Object.entries(corrections).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      cleaned = cleaned.replace(regex, correct);
    });
    
    // Capitalisation
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    
    // Ponctuation finale
    if (cleaned && !cleaned.match(/[.!?]$/)) {
      cleaned += '.';
    }
    
    return cleaned;
  }

  /**
   * Vérification de support
   */
  isConfigured(): boolean {
    const hasWebSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    console.log('🎤 [DEBUG] Web Speech supported:', hasWebSpeech);
    return hasWebSpeech;
  }
}