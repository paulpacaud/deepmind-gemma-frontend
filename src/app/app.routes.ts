import { Routes } from '@angular/router';
import { Records } from './records/records';
import { Chatbot } from './chatbot/chatbot';

export const routes: Routes = [
  { path: '', component: Records, title: 'Patient Records' },
  { path: 'chat', component: Chatbot, title: 'Medical Chat' },
  { path: '**', redirectTo: '' },
];
