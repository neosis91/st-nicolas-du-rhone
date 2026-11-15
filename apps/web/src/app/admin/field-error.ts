import { Component, computed, input } from '@angular/core';

interface FieldErrorSource {
  (): {
    touched: () => boolean;
    errors: () => readonly { kind: string; message?: string }[];
  };
}

@Component({
  selector: 'app-field-error',
  template: `@if (message(); as text) { <p class="field-error">{{ text }}</p> }`,
  host: { style: 'display: contents' },
})
export class FieldError {
  readonly field = input.required<FieldErrorSource>();
  readonly pattern = input('Ce format n’est pas accepté.');
  readonly message = computed(() => {
    const state = this.field()();
    if (!state.touched()) return '';
    const error = state.errors()[0];
    if (!error) return '';
    if (error.message) return error.message;
    switch (error.kind) {
      case 'required':
        return 'Ce champ est obligatoire.';
      case 'email':
        return 'Indiquez une adresse électronique valide.';
      case 'minLength':
        return `Au moins ${numberOf(error, 'minLength')} caractères.`;
      case 'maxLength':
        return `Au plus ${numberOf(error, 'maxLength')} caractères.`;
      case 'pattern':
        return this.pattern();
      default:
        return 'Cette valeur n’est pas acceptée.';
    }
  });
}

function numberOf(error: object, key: string) {
  const value = (error as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : 0;
}
