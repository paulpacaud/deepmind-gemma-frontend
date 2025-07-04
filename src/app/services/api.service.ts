import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MedicalRecord {
  // tailor this to the exact shape of patient.json
  id: string;
  name: string;
  age: number;
  conditions: string[];
  medications: string[];
  [key: string]: unknown;
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
    return this.http.post(
      `${this.base}/chat`,
      { message },
      { responseType: 'text' },
    );
  }
}
