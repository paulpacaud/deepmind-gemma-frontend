import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../environments/environment';

export interface MedicalRecord {
  personal_information?: {
    last_name: string;
    first_name: string;
    date_of_birth: string;
  };
  medical_history?: {
    conditions: string[];
    surgeries: {
      name: string;
      year: number;
    }[];
  };
  allergies?: {
    substance: string;
    reaction: string;
  }[];
  treatment?: {
    medication: string;
    dosage: string;
    schedule: string;
  }[];
  lifestyle?: {
    relationship_status: string;
    children: boolean;
    living_alone: boolean;
    alcohol_tobacco_use: string;
  };
  lab_results?: {
    date: string;
    sodium_mmol_per_L: number;
    potassium_mmol_per_L: number;
    creatinine_umol_per_L: number;
  }[];
  imaging?: {
    date: string;
    type: string;
    result: string;
  }[];
}

export interface ChatResponse {
  message: string;
  confidence?: number;
  sources?: string[];
}

export interface SpeechToTextResponse {
  transcript: string;
  confidence: number;
  language?: string;
}

export interface DocumentScanResponse {
  success: boolean;
  document_id: string;
  extracted_text?: string;
  document_type?: string;
  confidence?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  
  // Configuration des endpoints
  private readonly config = {
    // Backend principal (votre API DeepMind/Gemma)
    baseUrl: environment.production ? 'https://your-backend.com/api/v1' : 'http://127.0.0.1:8000/api/v1',
    
    // Google Cloud Speech-to-Text
    googleSpeechUrl: 'https://speech.googleapis.com/v1/speech:recognize',
    googleApiKey: environment.googleCloudApiKey, // À définir dans environment
    
    // Autres services
    ocrService: environment.ocrServiceUrl,
    
    // Headers par défaut
    defaultHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  /**
   * 🏥 DOSSIERS MÉDICAUX
   */
  getRecords(): Observable<MedicalRecord> {
    if (!environment.production) {
      // Mode développement - charge depuis les assets
      return this.http.get<MedicalRecord>('assets/dummy_backend_answers/patient.json');
    }
    
    return this.http.get<MedicalRecord>(`${this.config.baseUrl}/records`, {
      headers: this.config.defaultHeaders
    });
  }

  /**
   * 📷 SCAN DE DOCUMENTS
   */
  scanImage(base64: string): Observable<DocumentScanResponse> {
    if (!environment.production) {
      // Simulation pour le développement
      return new Observable<DocumentScanResponse>((observer) => {
        setTimeout(() => {
          observer.next({
            success: true,
            document_id: `doc_${Date.now()}`,
            extracted_text: 'Document médical analysé avec succès',
            document_type: 'medical_report',
            confidence: 0.95
          });
          observer.complete();
        }, 2000);
      });
    }

    const payload = {
      image: base64,
      document_type: 'medical',
      extract_text: true,
      analyze_content: true
    };

    return this.http.post<DocumentScanResponse>(`${this.config.baseUrl}/scan`, payload, {
      headers: this.config.defaultHeaders
    });
  }

  /**
   * 💬 CHAT AVEC GEMMA/DEEPMIND
   */
  chat(message: string, context?: any): Observable<ChatResponse> {
    if (!environment.production) {
      // Simulation améliorée pour le développement
      return new Observable<ChatResponse>((observer) => {
        setTimeout(() => {
          const responses = [
            {
              message: `Basé sur votre dossier médical, concernant "${message}", je peux vous dire que...`,
              confidence: 0.92,
              sources: ['medical_history', 'lab_results']
            },
            {
              message: `Excellente question sur "${message}". En analysant vos antécédents médicaux...`,
              confidence: 0.88,
              sources: ['treatment_history']
            },
            {
              message: `Je comprends votre préoccupation. Selon vos données médicales récentes...`,
              confidence: 0.95,
              sources: ['recent_scans', 'lab_results']
            }
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          observer.next(randomResponse);
          observer.complete();
        }, 1500);
      });
    }

    const payload = {
      message,
      patient_context: context,
      include_medical_history: true,
      language: 'en'
    };

    return this.http.post<ChatResponse>(`${this.config.baseUrl}/chat`, payload, {
      headers: this.config.defaultHeaders
    });
  }

  /**
   * 🎤 SPEECH-TO-TEXT avec Google Cloud
   */
  speechToTextGoogle(audioBlob: Blob): Observable<SpeechToTextResponse> {
    return new Observable<SpeechToTextResponse>((observer) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          // Convertir en base64
          const audioBase64 = (reader.result as string).split(',')[1];
          
          const payload = {
            config: {
              encoding: 'WEBM_OPUS', // ou 'LINEAR16' selon votre setup
              sampleRateHertz: 48000,
              languageCode: 'en-US',
              enableAutomaticPunctuation: true,
              enableWordTimeOffsets: false,
              model: 'medical', // Modèle spécialisé médical si disponible
              useEnhanced: true
            },
            audio: {
              content: audioBase64
            }
          };

          const response = await this.http.post<any>(
            `${this.config.googleSpeechUrl}?key=${this.config.googleApiKey}`,
            payload,
            { headers: { 'Content-Type': 'application/json' } }
          ).toPromise();

          if (response?.results?.[0]?.alternatives?.[0]) {
            const result = response.results[0].alternatives[0];
            observer.next({
              transcript: result.transcript,
              confidence: Math.round((result.confidence || 0.8) * 100),
              language: 'en-US'
            });
          } else {
            observer.next({
              transcript: 'No speech detected',
              confidence: 0
            });
          }
          
          observer.complete();
        } catch (error) {
          console.error('Google Speech API Error:', error);
          observer.error(error);
        }
      };
      
      reader.onerror = () => observer.error('Failed to read audio file');
      reader.readAsDataURL(audioBlob);
    });
  }

  /**
   * 🎤 SPEECH-TO-TEXT Browser Fallback
   */
  speechToTextBrowser(): Observable<SpeechToTextResponse> {
    return new Observable<SpeechToTextResponse>((observer) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        observer.error('Speech recognition not supported');
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        const result = event.results[0][0];
        observer.next({
          transcript: result.transcript,
          confidence: Math.round(result.confidence * 100)
        });
        observer.complete();
      };

      recognition.onerror = (event: any) => {
        observer.error(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
      };

      recognition.start();
    });
  }

  /**
   * 🔍 ANALYSE SPÉCIALISÉE (CXR, CT, Dermatology, etc.)
   */
  analyzeRadiology(base64Image: string, modalityType: 'xray' | 'ct' | 'dermatology'): Observable<string> {
    if (!environment.production) {
      return new Observable<string>((observer) => {
        setTimeout(() => {
          const analyses = {
            xray: 'Analyse radiologique : Poumons clairs, pas de signe d\'infection visible. Structure cardiaque normale.',
            ct: 'Analyse CT : Structures anatomiques normales. Pas d\'anomalie significative détectée.',
            dermatology: 'Analyse dermatologique : Lésion bénigne probable. Recommandation de suivi dermatologique de routine.'
          };
          observer.next(analyses[modalityType]);
          observer.complete();
        }, 3000);
      });
    }

    const payload = {
      image: base64Image,
      modality: modalityType,
      include_annotations: true,
      confidence_threshold: 0.7
    };

    return this.http.post(`${this.config.baseUrl}/analyze/${modalityType}`, payload, {
      responseType: 'text',
      headers: this.config.defaultHeaders
    });
  }

  /**
   * 💊 RECOMMANDATIONS DE TRAITEMENT (TxGemma)
   */
  getTreatmentRecommendations(patientData: any, condition: string): Observable<string> {
    if (!environment.production) {
      return new Observable<string>((observer) => {
        setTimeout(() => {
          observer.next(`Recommandations personnalisées pour ${condition}:\n\n1. Suivi régulier recommandé\n2. Adaptation du traitement selon évolution\n3. Surveillance des effets secondaires`);
          observer.complete();
        }, 2500);
      });
    }

    const payload = {
      patient_data: patientData,
      condition,
      include_drug_interactions: true,
      include_contraindications: true
    };

    return this.http.post(`${this.config.baseUrl}/treatment/recommendations`, payload, {
      responseType: 'text',
      headers: this.config.defaultHeaders
    });
  }

  /**
   * 🔧 UTILITAIRES
   */
  
  // Test de connectivité backend
  testConnection(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      this.http.get(`${this.config.baseUrl}/health`).subscribe({
        next: () => {
          observer.next(true);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  // Upload de fichier générique
  uploadFile(file: File, type: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.http.post(`${this.config.baseUrl}/upload`, formData);
  }
}