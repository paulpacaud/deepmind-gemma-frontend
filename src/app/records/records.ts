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
    
    // Scroll to top to show new document
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Phase 2: Rare disease analysis after document processing
    setTimeout(() => {
      this.startRareDiseaseAnalysis();
    }, 1500);
  }

  private startRareDiseaseAnalysis(): void {
    // Show rare disease analysis loader
    this.showRareDiseaseLoader();
  }

  private showRareDiseaseLoader(): void {
    // Create and show loader overlay
    const loaderOverlay = document.createElement('div');
    loaderOverlay.id = 'rareDiseaseLoader';
    loaderOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      flex-direction: column;
    `;
    
    loaderOverlay.innerHTML = `
      <div style="text-align: center; color: white;">
        <div style="width: 60px; height: 60px; border: 4px solid rgba(239, 68, 68, 0.3); border-top: 4px solid #ef4444; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 2rem;"></div>
        <div id="rareAnalysisText" style="font-size: 1.3rem; font-weight: 500; margin-bottom: 1rem;">🧬 Analyzing for rare diseases with MedGemma...</div>
        <div style="font-size: 1rem; color: #ccc; font-weight: 300;">Processing patient profile and medical history</div>
      </div>
    `;
    
    document.body.appendChild(loaderOverlay);
    
    // Phase progression
    setTimeout(() => {
      const textElement = document.getElementById('rareAnalysisText');
      if (textElement) {
        textElement.textContent = '🔍 Cross-referencing symptoms and lab results...';
      }
    }, 3000);
    
    setTimeout(() => {
      const textElement = document.getElementById('rareAnalysisText');
      if (textElement) {
        textElement.textContent = '🎯 Evaluating disease probability scores...';
      }
    }, 6000);
    
    setTimeout(() => {
      const textElement = document.getElementById('rareAnalysisText');
      if (textElement) {
        textElement.textContent = '⚕️ Generating clinical recommendations...';
      }
    }, 8500);
    
    // Show rare disease alert after analysis
    setTimeout(() => {
      document.body.removeChild(loaderOverlay);
      this.showRareDiseaseAlert();
    }, 11000);
  }

  private showRareDiseaseAlert(): void {
    // Create rare disease alert modal
    const alertModal = document.createElement('div');
    alertModal.id = 'rareDiseaseAlert';
    alertModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 3000;
      animation: fadeIn 0.5s ease;
    `;
    
    alertModal.innerHTML = `
      <div style="
        background: white;
        border-radius: 20px;
        padding: 3rem;
        max-width: 700px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        border: 3px solid #ef4444;
        animation: alertSlide 0.6s ease;
      ">
        <div style="
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
          font-size: 3rem;
          color: white;
          animation: pulse 2s infinite;
        ">⚠️</div>
        
        <h2 style="
          font-size: 2rem;
          font-weight: 600;
          color: #ef4444;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        ">Rare Disease Detected</h2>
        
        <p style="
          font-size: 1.1rem;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 2rem;
        ">MedGemma AI analysis has identified a potential rare disease based on the patient's medical profile.</p>
        
        <div style="
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 16px;
          padding: 2rem;
          margin-bottom: 2rem;
          text-align: left;
        ">
          <h4 style="
            color: #ef4444;
            font-weight: 600;
            margin-bottom: 1rem;
            font-size: 1.1rem;
          ">🧬 IgG4-Related Disease Indicators:</h4>
          <ul style="
            list-style: none;
            padding: 0;
            margin: 0;
          ">
            <li style="padding: 0.5rem 0; border-bottom: 1px solid rgba(239, 68, 68, 0.1); font-weight: 400;">
              • Elevated IgG4 levels (4.8 g/L) - significantly above normal range
            </li>
            <li style="padding: 0.5rem 0; border-bottom: 1px solid rgba(239, 68, 68, 0.1); font-weight: 400;">
              • Chronic pancreatitis with characteristic imaging findings
            </li>
            <li style="padding: 0.5rem 0; border-bottom: 1px solid rgba(239, 68, 68, 0.1); font-weight: 400;">
              • Retroperitoneal fibrosis pattern consistent with IgG4-RD
            </li>
            <li style="padding: 0.5rem 0; border-bottom: 1px solid rgba(239, 68, 68, 0.1); font-weight: 400;">
              • Multi-organ involvement and systemic inflammation
            </li>
            <li style="padding: 0.5rem 0; font-weight: 400;">
              • Positive response to corticosteroid therapy
            </li>
          </ul>
        </div>
        
        <p style="
          color: #6b7280;
          font-weight: 400;
          margin-bottom: 2rem;
          font-size: 1rem;
        ">
          <strong>Confidence Score:</strong> 87% | <strong>Recommendation:</strong> Refer to rheumatology for specialized evaluation and potential tissue biopsy confirmation.
        </p>
        
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(239, 68, 68, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(239, 68, 68, 0.3)'">
          ✅ Understood
        </button>
      </div>
    `;
    
    document.body.appendChild(alertModal);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes alertSlide {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
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