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
    // for now, we simulate the response by loading the local JSON file from dummy_backend_answers/patient.json
    // load the patient data from a local JSON file
    const patientData = 'assets/dummy_backend_answers/patient.json';

    return this.http.get<MedicalRecord>(patientData);

    //return this.http.get<MedicalRecord>(`${this.base}/records`);
  }

  scanImage(base64: string): Observable<void> {
    // simulate OK response, don't make the call for now
    return new Observable<void>((observer) => {
      setTimeout(() => {
        observer.next();
        observer.complete();
      }, 1000);
    });

    //return this.http.post<void>(`${this.base}/scan`, { image: base64 });
  }

  chat(message: string): Observable<string> {
    // simulate a placeholder response, don't make the call for now
    return new Observable<string>((observer) => {
      setTimeout(() => {
        observer.next(`You said: ${message}`);
        observer.complete();
      }, 1000);
    });
    /*    return this.http.post(
      `${this.base}/chat`,
      { message },
      { responseType: 'text' },
    );*/
  }
}
