import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://127.0.0.1:8000/api/v1';

  getRecords(): Observable<MedicalRecord> {
    // For development, load local JSON file
    const patientData = 'assets/dummy_backend_answers/patient.json';
    return this.http.get<MedicalRecord>(patientData);

    // For production, uncomment this line:
    // return this.http.get<MedicalRecord>(`${this.base}/records`);
  }

  scanImage(base64: string): Observable<void> {
    // Simulation for development
    return new Observable<void>((observer) => {
      setTimeout(() => {
        observer.next();
        observer.complete();
      }, 1000);
    });

    // For production, uncomment this line:
    // return this.http.post<void>(`${this.base}/scan`, { image: base64 });
  }

  chat(message: string): Observable<string> {
    // Enhanced simulation with medical responses in English
    return new Observable<string>((observer) => {
      setTimeout(() => {
        const medicalResponses = [
          `Regarding "${message}", based on your medical history, this requires careful consideration. Let me analyze your patient records for relevant information.`,
          
          `Thank you for your question about "${message}". According to your medical data, I can provide you with the following clinical insights and recommendations.`,
          
          `Excellent question regarding "${message}". After reviewing your medical history, lab results, and current medications, here's my clinical assessment.`,
          
          `I understand your concern about "${message}". Based on your patient profile, risk factors, and treatment history, I recommend the following approach.`,
          
          `Your inquiry about "${message}" is clinically relevant. Considering your documented allergies, current medications, and medical conditions, here's my professional recommendation.`,
          
          `Thank you for bringing up "${message}". This aligns with several findings in your medical record. Let me provide you with evidence-based guidance.`,
          
          `Your question about "${message}" requires careful evaluation of your medical history. Based on your lab values, imaging results, and current treatment plan, here's my analysis.`,
          
          `I appreciate your question regarding "${message}". After correlating this with your documented symptoms, diagnostic results, and therapeutic response, I can offer the following clinical perspective.`
        ];
        
        const randomResponse = medicalResponses[Math.floor(Math.random() * medicalResponses.length)];
        observer.next(randomResponse);
        observer.complete();
      }, 1500 + Math.random() * 1000); // Realistic delay 1.5-2.5 seconds
    });

    // For production with real medical AI backend:
    /*
    return this.http.post(
      `${this.base}/chat`,
      { message },
      { responseType: 'text' }
    );
    */
  }

  chatAudio(base64Audio: string): Observable<string> {
    // Enhanced simulation for audio processing in medical English
    return new Observable<string>((observer) => {
      setTimeout(() => {
        const audioMedicalResponses = [
          '🎤 Voice message received and analyzed. Based on your medical profile and the clinical query you\'ve presented, I can provide comprehensive medical guidance.',
          
          '🎤 Audio successfully processed. Your medical inquiry has been cross-referenced with your patient history, and I have relevant clinical recommendations.',
          
          '🎤 Voice input analyzed. The medical concern you\'ve described correlates with several aspects of your documented health record. Here\'s my clinical assessment.',
          
          '🎤 Speech recognition complete. Your health question has been evaluated against your medical history, current medications, and diagnostic results.',
          
          '🎤 Audio message processed successfully. Based on the symptoms and medical concerns you\'ve described, I can offer evidence-based clinical insights.',
          
          '🎤 Voice analysis complete. Your medical query aligns with important aspects of your patient profile, and I have relevant therapeutic recommendations.',
          
          '🎤 Speech successfully transcribed and analyzed. The medical information you\'ve provided has been correlated with your clinical history for accurate assessment.',
          
          '🎤 Audio input processed. Your healthcare question demonstrates excellent clinical awareness and has been evaluated against current medical guidelines.'
        ];
        
        const randomResponse = audioMedicalResponses[Math.floor(Math.random() * audioMedicalResponses.length)];
        observer.next(randomResponse);
        observer.complete();
      }, 2000 + Math.random() * 1000); // Longer delay for audio processing (2-3 seconds)
    });

    // For production with backend that processes audio:
    /*
    return this.http.post(
      `${this.base}/chat/audio`,
      { audio: base64Audio },
      { responseType: 'text' }
    );
    */
  }
}