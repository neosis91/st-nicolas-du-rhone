import { Component, inject, OnInit, signal } from '@angular/core';
import { FormField, form as signalForm, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { readError } from '../core/format';
import { Person, Settings } from '../core/models';
import { parentData } from '../core/resolvers';
import { FieldError } from '../admin/field-error';
import { SeoService } from '../core/seo.service';

@Component({
  selector: 'app-contact-page',
  imports: [RouterLink, FormField, FieldError],
  templateUrl: './contact.html',
})
export class ContactPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly api = inject(ApiService);
  readonly settings = parentData<Settings>(this.route, 'settings');
  readonly contacts = (this.route.snapshot.data['people'] as Person[]).filter((person) => person.showOnContact);
  readonly subjects = ['Messe et horaires', 'Baptême', 'Mariage', 'Funérailles', 'Catéchèse', 'Intention de messe', 'Autre'];
  readonly status = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');
  readonly error = signal('');
  private readonly model = signal(this.blankMessage());
  readonly form = signalForm(this.model, (path) => {
    required(path.name);
    minLength(path.name, 2);
    required(path.contact);
    minLength(path.contact, 3);
    required(path.subject);
    required(path.body);
    minLength(path.body, 5);
  });

  ngOnInit() {
    this.seo.apply(
      this.settings,
      'Contact',
      `Secrétariat de ${this.settings.name}, ${this.settings.street} à ${this.settings.city}. Téléphone ${this.settings.phone}.`,
      '/contact',
    );
  }

  submit() {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    this.status.set('sending');
    const value = this.form().value();
    this.api.sendMessage(value).subscribe({
      next: () => {
        this.status.set('sent');
        this.form().reset(this.blankMessage());
      },
      error: (error: unknown) => {
        this.status.set('error');
        this.error.set(readError(error, 'Le message n’a pas pu être envoyé.'));
      },
    });
  }

  private blankMessage() {
    return { name: '', contact: '', subject: this.subjects[0], body: '', company: '' };
  }
}
