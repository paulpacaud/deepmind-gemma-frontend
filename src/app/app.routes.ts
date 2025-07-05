import { Routes } from '@angular/router';
import { Records } from './records/records';
import { Chatbot } from './chatbot/chatbot';
import { LegacyDmp } from './legacy-dmp/legacy-dmp';

export const routes: Routes = [
  { path: '', component: LegacyDmp, title: 'DMP Traditionnel' },
  { path: 'legacy', component: LegacyDmp, title: 'DMP Traditionnel' },
  { path: 'smart', component: Records, title: 'Smart Medical Record' },
  { path: 'chat', component: Chatbot, title: 'Medical Chat' },
  { path: '**', redirectTo: '' },
];