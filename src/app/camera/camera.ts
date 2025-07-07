import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  signal,
  inject,
} from '@angular/core';
import { NgIf } from '@angular/common';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [NgIf],
  templateUrl: './camera.html',
  styleUrl: './camera.css',
})
export class Camera {
  private stream: MediaStream | undefined;
  private readonly api = inject(ApiService);

  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  @Output() captured = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  saving = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);

  async ngAfterViewInit(): Promise<void> {
    try {
      // Configuration pour la caméra arrière sur tablette
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Caméra arrière
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoRef.nativeElement.srcObject = this.stream;
    } catch (err) {
      console.error('Camera error:', err);
      // Fallback en cas d'échec avec la caméra arrière
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.videoRef.nativeElement.srcObject = this.stream;
        this.info.set('🔄 Using front camera (rear camera not available)');
      } catch (fallbackErr) {
        this.error.set('Could not access camera');
      }
    }
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  take(): void {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext('2d')?.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL('image/png').split(',')[1];
    this.saving.set(true);

    // Phase 1: Document analysis with MedGemma
    this.info.set('📄 Analyzing document with MedGemma...');
    
    setTimeout(() => {
      this.info.set('🤖 Extracting medical information...');
      
      setTimeout(() => {
        this.info.set('📝 Adding information to Smart Medical Record...');
        
        setTimeout(() => {
          // Simulate successful upload
          this.saving.set(false);
          this.info.set('✅ Document successfully processed!');
          this.captured.emit();
          
          // Clear success message after delay
          setTimeout(() => {
            this.info.set(null);
          }, 2000);
        }, 2000); // Adding to SMR
      }, 2500); // Extracting info
    }, 3000); // Document analysis
  }

  close(): void {
    this.stopStream();
    this.closed.emit();
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
  }
}