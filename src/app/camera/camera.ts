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

  async ngAfterViewInit(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoRef.nativeElement.srcObject = this.stream;
    } catch (err) {
      this.error.set('Could not access camera');
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
    this.api.scanImage(base64).subscribe({
      next: () => {
        this.saving.set(false);
        this.captured.emit();
      },
      error: () => {
        this.error.set('Upload failed');
        this.saving.set(false);
      },
    });
  }

  close(): void {
    this.stopStream();
    this.closed.emit();
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
  }
}
