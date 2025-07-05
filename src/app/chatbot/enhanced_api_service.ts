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
    // Pour le développement, on charge depuis le fichier local
    const patientData = 'assets/dummy_backend_answers/patient.json';
    return this.http.get<MedicalRecord>(patientData);
    
    // Pour la production, décommentez cette ligne :
    // return this.http.get<MedicalRecord>(`${this.base}/records`);
  }

  scanImage(base64: string): Observable<void> {
    // Simulation pour le développement
    return new Observable<void>((observer) => {
      setTimeout(() => {
        observer.next();
        observer.complete();
      }, 1000);
    });

    // Pour la production, décommentez ces lignes :
    // return this.http.post<void>(`${this.base}/scan`, { image: base64 });
  }

  chat(message: string): Observable<string> {
    // Simulation d'une réponse intelligente pour le développement
    return new Observable<string>((observer) => {
      setTimeout(() => {
        const responses = [
          `Je comprends votre question sur "${message}". Basé sur votre dossier médical, je peux vous fournir des informations pertinentes.`,
          `Merci pour votre question. En analysant vos données médicales, voici ce que je peux vous dire...`,
          `C'est une excellente question médicale. Permettez-moi de consulter votre dossier pour vous donner une réponse précise.`,
          `Votre question concernant "${message}" est importante. Selon vos antécédents médicaux...`
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        observer.next(randomResponse);
        observer.complete();
      }, 1500);
    });

    // Pour la production avec Gemini, décommentez ces lignes :
    /*
    return this.http.post(
      `${this.base}/chat`,
      { message },
      { responseType: 'text' }
    );
    */
  }

  chatAudio(base64Audio: string): Observable<string> {
    // Simulation pour le développement
    return new Observable<string>((observer) => {
      setTimeout(() => {
        observer.next('🎤 J\'ai bien reçu votre message vocal. Je l\'ai analysé et je peux vous répondre que...');
        observer.complete();
      }, 2000);
    });

    // Pour la production avec HeAR (Health Acoustic Representations), décommentez ces lignes :
    /*
    return this.http.post(
      `${this.base}/chat/audio`,
      { audio: base64Audio },
      { responseType: 'text' }
    );
    */
  }

  // Nouvelle méthode pour l'analyse d'images médicales avec les modèles spécialisés
  analyzeRadiology(base64Image: string, modalityType: 'xray' | 'ct' | 'dermatology'): Observable<string> {
    return new Observable<string>((observer) => {
      setTimeout(() => {
        const analysisResults = {
          xray: 'Analyse radiologique : Les poumons apparaissent clairs, pas de signe d\'infection visible.',
          ct: 'Analyse CT : Structure anatomique normale, pas d\'anomalie détectée.',
          dermatology: 'Analyse dermatologique : Lésion bénigne probable, recommandation de suivi.'
        };
        observer.next(analysisResults[modalityType]);
        observer.complete();
      }, 3000);
    });

    // Pour la production avec CXR Foundation, CT Foundation, Derm Foundation :
    /*
    return this.http.post(
      `${this.base}/analyze/${modalityType}`,
      { image: base64Image },
      { responseType: 'text' }
    );
    */
  }

  // Méthode pour l'analyse pathologique avec Path Foundation
  analyzePathology(base64Image: string): Observable<string> {
    return new Observable<string>((observer) => {
      setTimeout(() => {
        observer.next('Analyse pathologique : Tissu normal observé, pas de signe de malignité détecté.');
        observer.complete();
      }, 3000);
    });

    // Pour la production avec Path Foundation :
    /*
    return this.http.post(
      `${this.base}/analyze/pathology`,
      { image: base64Image },
      { responseType: 'text' }
    );
    */
  }

  // Méthode pour les recommandations de traitement avec TxGemma
  getTreatmentRecommendations(patientData: any, condition: string): Observable<string> {
    return new Observable<string>((observer) => {
      setTimeout(() => {
        observer.next(`Recommandations de traitement personnalisées pour ${condition} basées sur votre profil médical...`);
        observer.complete();
      }, 2500);
    });

    // Pour la production avec TxGemma :
    /*
    return this.http.post(
      `${this.base}/treatment/recommendations`,
      { patient_data: patientData, condition },
      { responseType: 'text' }
    );
    */
  }
}