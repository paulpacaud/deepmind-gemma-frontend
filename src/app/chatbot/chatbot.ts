import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormsModule,
  FormControl,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';

interface Msg {
  text: string;
  from: 'user' | 'bot';
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  messages = signal<Msg[]>([
    { text: '👋 Hi! Ask me anything about your medical record.', from: 'bot' },
  ]);

  input = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });
  sending = signal(false);

  send(): void {
    if (this.input.invalid || this.sending()) return;

    const content = this.input.value.trim();
    if (!content) return;

    // optimistic UI
    this.messages.update((m) => [...m, { text: content, from: 'user' }]);
    this.input.setValue('');
    this.sending.set(true);

    this.api.chat(content).subscribe({
      next: (reply) => {
        this.messages.update((m) => [...m, { text: reply, from: 'bot' }]);
        this.sending.set(false);
      },
      error: () => {
        this.messages.update((m) => [
          ...m,
          { text: 'Sorry, something went wrong.', from: 'bot' },
        ]);
        this.sending.set(false);
      },
    });
  }

  back(): void {
    this.router.navigateByUrl('/');
  }
}
