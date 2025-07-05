import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, MedicalRecord } from '../services/api.service';
import { Camera } from '../camera/camera';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'report';
  dateAdded: Date;
  isNew: boolean;
}

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [NgIf, NgFor, Camera],
  templateUrl: './records.html',
  styleUrl: './records.css',
})
export class Records {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  record = signal<MedicalRecord | null>(null);
  loading = signal(true);
  cameraOpen = signal(false);
  
  // Documents management
  documents = signal<Document[]>([
    {
      id: '1',
      name: 'Medical History',
      type: 'pdf',
      dateAdded: new Date('2024-01-15'),
      isNew: false
    },
    {
      id: '2',
      name: 'Lab Results',
      type: 'report',
      dateAdded: new Date('2024-02-10'),
      isNew: false
    }
  ]);

  constructor() {
    this.api.getRecords().subscribe({
      next: (rec) => {
        this.record.set(rec);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Remove "new" badge after 5 seconds for any new documents
    this.autoRemoveNewBadges();
  }

  openChat(): void {
    this.router.navigateByUrl('/chat');
  }

  navigateToLegacy(): void {
    this.router.navigateByUrl('/legacy');
  }

  toggleCamera(): void {
    this.cameraOpen.update((v) => !v);
  }

  /* camera emits 'captured' when it has sent the image to the backend */
  onCaptureDone(): void {
    this.cameraOpen.set(false);
    
    // Add new document immediately after capture
    this.addNewDocument();
  }

  calculateAge(dateOfBirth: string | undefined): number | null {
    if (!dateOfBirth) {
      return null;
    }
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private addNewDocument(): void {
    const newDoc: Document = {
      id: Date.now().toString(),
      name: `Scan ${new Date().toLocaleDateString()}`,
      type: 'image',
      dateAdded: new Date(),
      isNew: true
    };

    this.documents.update(docs => [...docs, newDoc]);
  }

  private autoRemoveNewBadges(): void {
    setTimeout(() => {
      this.documents.update(docs => 
        docs.map(doc => ({ ...doc, isNew: false }))
      );
    }, 5000); // Remove "new" badges after 5 seconds
  }

  // Method to handle document click (for future implementation)
  onDocumentClick(document: Document): void {
    console.log('Document clicked:', document);
    // TODO: Implement document viewer
  }
}