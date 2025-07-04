import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, MedicalRecord } from '../services/api.service';
import { Camera } from '../camera/camera';

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

  constructor() {
    this.api.getRecords().subscribe({
      next: (rec) => {
        this.record.set(rec);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openChat(): void {
    this.router.navigateByUrl('/chat');
  }

  toggleCamera(): void {
    this.cameraOpen.update((v) => !v);
  }

  /* camera emits 'captured' when it has sent the image to the backend */
  onCaptureDone(): void {
    this.cameraOpen.set(false);
  }
}
