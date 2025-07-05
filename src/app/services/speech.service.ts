import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface SpeechResult {
  transcript: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private readonly http = inject(HttpClient);
  private readonly GCP_SPEECH_API = 'https://speech.googleapis.com/v1/speech:recognize';
  
  // ⚠️ REMPLACE PAR TES VRAIES VALEURS GCP
  private readonly GCP_API_KEY = 'AIza-REMPLACE-PAR-TA-CLE-API';
  private readonly GCP_PROJECT_ID = 'ton-project-id';
  
  constructor() {}

  /**
   * Version hybride optimisée : GCP + Web Speech API fallback
   */
  speechToText(audioBlob?: Blob): Observable<SpeechResult> {
    console.log('🎤 [DEBUG] Starting speech recognition...');
    
    // Priorité 1: GCP Speech-to-Text (plus fiable sur Android)
    if (environment.gcpApiKey && environment.gcpApiKey !== 'AIza-REMPLACE-PAR-TA-CLE-API-GCP' && this.supportsMediaRecorder()) {
      console.log('🎤 [DEBUG] Using GCP Speech-to-Text API');
      return this.speechToTextGCP();
    }
    
    // Priorité 2: Web Speech API (fallback)
    console.log('🎤 [DEBUG] Using Web Speech API fallback');
    return this.speechToTextWebAPI();
  }

  /**
   * GCP Speech-to-Text - Direct API call
   */
  private speechToTextGCP(): Observable<SpeechResult> {
    return new Observable(observer => {
      this.recordAudioForGCP().subscribe({
        next: (audioBase64) => {
          console.log('🎤 [DEBUG] Audio recorded, calling GCP API...');
          
          const requestBody = {
            config: {
              encoding: 'WEBM_OPUS',
              sampleRateHertz: 16000,
              languageCode: 'en-US',
              enableAutomaticPunctuation: true,
              model: 'latest_long' // Optimisé pour les phrases longues
            },
            audio: {
              content: audioBase64
            }
          };

          const headers = new HttpHeaders({
            'Content-Type': 'application/json'
          });

          const url = `${this.GCP_SPEECH_API}?key=${environment.gcpApiKey}`;

          this.http.post<any>(url, requestBody, { headers }).subscribe({
            next: (response) => {
              console.log('🎤 [DEBUG] GCP API Response:', response);
              
              if (response.results && response.results.length > 0) {
                const result = response.results[0];
                if (result.alternatives && result.alternatives.length > 0) {
                  const alternative = result.alternatives[0];
                  observer.next({
                    transcript: this.cleanMedicalText(alternative.transcript || ''),
                    confidence: Math.round((alternative.confidence || 0.8) * 100)
                  });
                  observer.complete();
                  return;
                }
              }
              
              // Pas de résultat valide
              observer.next({
                transcript: 'No speech detected in audio. Please try speaking clearly.',
                confidence: 0
              });
              observer.complete();
            },
            error: (error) => {
              console.error('🎤 [ERROR] GCP API failed:', error);
              
              // Fallback vers Web Speech API
              console.log('🎤 [DEBUG] Falling back to Web Speech API...');
              this.speechToTextWebAPI().subscribe({
                next: (result) => observer.next(result),
                error: (webError) => {
                  console.error('🎤 [ERROR] Web Speech API also failed:', webError);
                  observer.next({
                    transcript: 'Speech recognition failed. Please check your internet connection and try again.',
                    confidence: 0
                  });
                },
                complete: () => observer.complete()
              });
            }
          });
        },
        error: (recordError) => {
          console.error('🎤 [ERROR] Audio recording failed:', recordError);
          
          // Fallback vers Web Speech API
          this.speechToTextWebAPI().subscribe({
            next: (result) => observer.next(result),
            error: (webError) => observer.error(webError),
            complete: () => observer.complete()
          });
        }
      });
    });
  }

  /**
   * Enregistrer audio et convertir en base64 pour GCP
   */
  private recordAudioForGCP(): Observable<string> {
    return new Observable(observer => {
      let mediaRecorder: MediaRecorder;
      const audioChunks: Blob[] = [];

      navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }).then(stream => {
        console.log('🎤 [DEBUG] Microphone access granted');
        
        // Vérifier les types MIME supportés
        let mimeType = 'audio/webm;codecs=opus';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/webm';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
          }
        }
        
        console.log('🎤 [DEBUG] Using MIME type:', mimeType);
        
        mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
            console.log('🎤 [DEBUG] Audio chunk received:', event.data.size, 'bytes');
          }
        };

        mediaRecorder.onstop = () => {
          console.log('🎤 [DEBUG] Recording stopped, processing audio...');
          
          const audioBlob = new Blob(audioChunks, { type: mimeType });
          console.log('🎤 [DEBUG] Audio blob size:', audioBlob.size, 'bytes');
          
          // Convertir en base64
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result && typeof reader.result === 'string') {
              const base64Audio = reader.result.split(',')[1]; // Enlever le prefix data:
              console.log('🎤 [DEBUG] Base64 audio length:', base64Audio.length);
              observer.next(base64Audio);
              observer.complete();
            } else {
              observer.error('Failed to convert audio to base64');
            }
          };
          
          reader.onerror = () => observer.error('FileReader error');
          reader.readAsDataURL(audioBlob);
          
          // Libérer les ressources
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.onerror = (event) => {
          console.error('🎤 [ERROR] MediaRecorder error:', event);
          observer.error('MediaRecorder error');
        };

        // Démarrer l'enregistrement
        mediaRecorder.start(1000); // Collecter par chunks de 1s
        console.log('🎤 [DEBUG] Recording started...');
        
        // Arrêter après 5 secondes
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            console.log('🎤 [DEBUG] Stopping recording after timeout...');
            mediaRecorder.stop();
          }
        }, 5000);

      }).catch(error => {
        console.error('🎤 [ERROR] Microphone access denied:', error);
        observer.error(`Microphone access denied: ${error.message}`);
      });

      // Cleanup
      return () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      };
    });
  }

  /**
   * Web Speech API (fallback) - Version optimisée
   */
  private speechToTextWebAPI(): Observable<SpeechResult> {
    return new Observable(observer => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        observer.next({ 
          transcript: 'Speech recognition not supported on this device. Please use Chrome browser.', 
          confidence: 0 
        });
        observer.complete();
        return;
      }

      console.log('🎤 [DEBUG] Starting Web Speech API...');
      
      const recognition = new SpeechRecognition();
      
      // Configuration adaptée selon la plateforme
      recognition.lang = 'en-US';
      recognition.continuous = this.isAndroid() ? false : true;
      recognition.interimResults = this.isAndroid() ? false : true;
      recognition.maxAlternatives = 1;

      let hasResult = false;
      let finalTranscript = '';
      let timeoutId: any;

      recognition.onstart = () => {
        console.log('🎤 [DEBUG] Web Speech API started');
        
        // Timeout adaptatif
        timeoutId = setTimeout(() => {
          console.log('🎤 [DEBUG] Web Speech timeout, stopping...');
          recognition.stop();
        }, this.isAndroid() ? 6000 : 10000);
      };

      recognition.onresult = (event: any) => {
        console.log('🎤 [DEBUG] Web Speech result received');
        clearTimeout(timeoutId);
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            hasResult = true;
            console.log('🎤 [DEBUG] Final transcript:', finalTranscript);
          }
        }
        
        if (hasResult && finalTranscript.trim()) {
          recognition.stop();
        }
      };

      recognition.onend = () => {
        console.log('🎤 [DEBUG] Web Speech API ended');
        clearTimeout(timeoutId);
        
        if (finalTranscript.trim()) {
          observer.next({
            transcript: this.cleanMedicalText(finalTranscript),
            confidence: 85
          });
        } else {
          observer.next({
            transcript: 'No speech detected. Please try speaking clearly into the microphone.',
            confidence: 0
          });
        }
        observer.complete();
      };

      recognition.onerror = (event: any) => {
        console.error('🎤 [ERROR] Web Speech API error:', event.error);
        clearTimeout(timeoutId);
        
        let errorMessage = 'Speech recognition failed';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone error. Please check your microphone.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
        }
        
        observer.next({ transcript: errorMessage, confidence: 0 });
        observer.complete();
      };

      try {
        recognition.start();
      } catch (error) {
        console.error('🎤 [ERROR] Failed to start Web Speech API:', error);
        observer.next({
          transcript: 'Failed to start speech recognition. Please refresh the page and try again.',
          confidence: 0
        });
        observer.complete();
      }

      // Cleanup
      return () => {
        clearTimeout(timeoutId);
        if (recognition) {
          try {
            recognition.stop();
          } catch (e) {
            console.log('🎤 [DEBUG] Cleanup completed');
          }
        }
      };
    });
  }

  /**
   * Vérifications de support
   */
  private supportsMediaRecorder(): boolean {
    return 'MediaRecorder' in window && 'getUserMedia' in navigator.mediaDevices;
  }

  private isAndroid(): boolean {
    return navigator.userAgent.toLowerCase().includes('android');
  }

  /**
   * Nettoyage du texte médical
   */
  private cleanMedicalText(text: string): string {
    if (!text) return '';
    
    let cleaned = text.trim();
    
    // Corrections médicales courantes
    const corrections: { [key: string]: string } = {
      'patience': 'patient',
      'patients': 'patients',
      'medicashan': 'medication',
      'prescripsion': 'prescription',
      'blud presure': 'blood pressure',
      'hart rate': 'heart rate',
      'diabetis': 'diabetes',
      'alergy': 'allergy',
      'allergys': 'allergies',
      'symtom': 'symptom',
      'symtoms': 'symptoms',
      'docter': 'doctor',
      'medecine': 'medicine'
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
   * Vérification de la configuration
   */
  isConfigured(): boolean {
    const hasWebSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const hasMediaRecorder = this.supportsMediaRecorder();
    const hasGCPKey = environment.gcpApiKey && environment.gcpApiKey !== 'AIza-REMPLACE-PAR-TA-CLE-API-GCP';
    
    console.log('🎤 [DEBUG] Speech capabilities:');
    console.log('🎤 [DEBUG] - Web Speech API:', hasWebSpeech);
    console.log('🎤 [DEBUG] - MediaRecorder:', hasMediaRecorder);
    console.log('🎤 [DEBUG] - GCP API Key:', hasGCPKey ? 'Present' : 'Missing');
    console.log('🎤 [DEBUG] - Android device:', this.isAndroid());
    
    return hasWebSpeech || hasMediaRecorder;
  }

  /**
   * Test du microphone
   */
  testAndroidMicrophone(): Promise<boolean> {
    return navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log('🎤 [DEBUG] Microphone test: SUCCESS');
        stream.getTracks().forEach(track => track.stop());
        return true;
      })
      .catch(error => {
        console.error('🎤 [ERROR] Microphone test: FAILED', error);
        return false;
      });
  }
}