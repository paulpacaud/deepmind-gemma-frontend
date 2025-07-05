import { Component, inject, signal } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { Router } from '@angular/router';

interface LegacyDocument {
  id: string;
  title: string;
  date: string;
  type: 'Consultation' | 'Analyse' | 'Imagerie' | 'Prescription' | 'Hospitalisation';
  doctor: string;
  pages: number;
  size: string;
}

@Component({
  selector: 'app-legacy-dmp',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './legacy-dmp.html',
  styleUrl: './legacy-dmp.css',
})
export class LegacyDmp {
  private readonly router = inject(Router);

  loading = signal(false);
  selectedDocument = signal<LegacyDocument | null>(null);

  // Documents réalistes du DMP français
  documents = signal<LegacyDocument[]>([
    {
      id: '1',
      title: 'CR_Consultation_Cardiologie_Dr_Martin.pdf',
      date: '15/01/2024',
      type: 'Consultation',
      doctor: 'Dr. Martin (Cardiologue)',
      pages: 3,
      size: '245 KB'
    },
    {
      id: '2', 
      title: 'Analyses_Biologiques_Laboratoire_Pasteur.pdf',
      date: '08/01/2024',
      type: 'Analyse',
      doctor: 'Laboratoire Pasteur',
      pages: 5,
      size: '187 KB'
    },
    {
      id: '3',
      title: 'Echo_Cardiaque_Dr_Dubois_CHU.pdf',
      date: '22/12/2023',
      type: 'Imagerie',
      doctor: 'Dr. Dubois (CHU)',
      pages: 2,
      size: '1.2 MB'
    },
    {
      id: '4',
      title: 'Ordonnance_Dr_Lemoine_MG.pdf',
      date: '18/12/2023',
      type: 'Prescription',
      doctor: 'Dr. Lemoine (Médecin généraliste)',
      pages: 1,
      size: '156 KB'
    },
    {
      id: '5',
      title: 'CR_Hospitalisation_Cardiologie_CHU_Toulouse.pdf',
      date: '10/12/2023',
      type: 'Hospitalisation',
      doctor: 'Service Cardiologie CHU Toulouse',
      pages: 12,
      size: '892 KB'
    },
    {
      id: '6',
      title: 'Consultation_Urgences_SAMU_31.pdf',
      date: '09/12/2023',
      type: 'Consultation',
      doctor: 'Dr. Rodriguez (Urgentiste)',
      pages: 4,
      size: '298 KB'
    },
    {
      id: '7',
      title: 'Radio_Thorax_Dr_Chen_Radiologie.pdf',
      date: '05/12/2023',
      type: 'Imagerie',
      doctor: 'Dr. Chen (Radiologue)',
      pages: 2,
      size: '756 KB'
    },
    {
      id: '8',
      title: 'Analyses_Urgences_Bio_Express.pdf',
      date: '09/12/2023',
      type: 'Analyse',
      doctor: 'Laboratoire Bio Express',
      pages: 3,
      size: '203 KB'
    },
    {
      id: '9',
      title: 'CR_Consultation_Dr_Moreau_MG.pdf',
      date: '25/11/2023',
      type: 'Consultation',
      doctor: 'Dr. Moreau (Médecin généraliste)',
      pages: 2,
      size: '167 KB'
    },
    {
      id: '10',
      title: 'Scanner_Coronaire_Dr_Patel_Imagerie.pdf',
      date: '18/11/2023',
      type: 'Imagerie',
      doctor: 'Dr. Patel (Radiologue)',
      pages: 8,
      size: '2.1 MB'
    }
  ]);

  openDocument(doc: LegacyDocument): void {
    this.loading.set(true);
    setTimeout(() => {
      this.selectedDocument.set(doc);
      this.loading.set(false);
    }, 800);
  }

  closeDocument(): void {
    this.selectedDocument.set(null);
  }

  navigateToSmart(): void {
    this.router.navigateByUrl('/smart');
  }

  getTypeIcon(type: string): string {
    return 'PDF'; // Tous les documents sont des PDF basiques
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'Consultation': return '#3b82f6';
      case 'Analyse': return '#f59e0b';
      case 'Imagerie': return '#8b5cf6';
      case 'Prescription': return '#10b981';
      case 'Hospitalisation': return '#ef4444';
      default: return '#6b7280';
    }
  }
}