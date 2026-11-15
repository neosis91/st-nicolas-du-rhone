import { Component, inject, OnInit, signal } from '@angular/core';
import { FormField, form as signalForm, required } from '@angular/forms/signals';
import { ApiService } from '../core/api.service';
import { readError } from '../core/format';
import { SettingsInput } from '../core/models';
import { ToastService } from '../core/toast';
import { FieldError } from './field-error';

function blankSettings(): SettingsInput {
  return Object.fromEntries(fields.map((field) => [field.key, ''])) as SettingsInput;
}

const fields: { key: keyof SettingsInput; label: string; area?: boolean }[] = [
  { key: 'name', label: 'Nom de la paroisse' },
  { key: 'shortName', label: 'Nom court' },
  { key: 'domain', label: 'Nom de domaine' },
  { key: 'siteUrl', label: 'Adresse du site' },
  { key: 'diocese', label: 'Diocèse' },
  { key: 'dioceseUrl', label: 'Site du diocèse' },
  { key: 'parishOnDioceseUrl', label: 'Fiche de la paroisse' },
  { key: 'donationsUrl', label: 'Page des dons' },
  { key: 'bequestsUrl', label: 'Page des legs' },
  { key: 'readingsUrl', label: 'Lectures du jour' },
  { key: 'sector', label: 'Secteur' },
  { key: 'bishop', label: 'Évêque' },
  { key: 'email', label: 'Courriel' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'street', label: 'Rue du secrétariat' },
  { key: 'postalCode', label: 'Code postal' },
  { key: 'city', label: 'Ville' },
  { key: 'hours', label: 'Permanence' },
  { key: 'mapUrl', label: 'Lien du plan' },
  { key: 'presbyteryStreet', label: 'Adresse du presbytère' },
  { key: 'denierEmail', label: 'Courriel du denier' },
  { key: 'publicationDirector', label: 'Directeur de la publication' },
  { key: 'heroLede', label: 'Texte d’accueil', area: true },
  { key: 'aboutText', label: 'Présentation de la paroisse', area: true },
  { key: 'teamIntro', label: 'Introduction de l’équipe', area: true },
  { key: 'teamCouncils', label: 'Conseils paroissiaux', area: true },
  { key: 'massIntro', label: 'Introduction des horaires', area: true },
  { key: 'sacramentIntro', label: 'Introduction des sacrements', area: true },
  { key: 'lifeIntro', label: 'Introduction de la vie paroissiale', area: true },
  { key: 'donateIntro', label: 'Introduction des dons', area: true },
  { key: 'welcomeDetail', label: 'Précision sur l’accueil' },
  { key: 'hostNote', label: 'Hébergeur', area: true },
];

@Component({
  selector: 'app-settings-form',
  imports: [FormField, FieldError],
  templateUrl: './settings-form.html',
})
export class SettingsFormPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly fields = fields;
  readonly error = signal('');
  private readonly model = signal(blankSettings());
  readonly form = signalForm(this.model, (path) => {
    for (const field of fields) required(path[field.key]);
  });

  ngOnInit() {
    this.api.settings().subscribe((settings) => {
      const value = blankSettings();
      for (const field of fields) value[field.key] = settings[field.key];
      this.form().reset(value);
    });
  }

  save() {
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    this.api.saveSettings(this.form().value()).subscribe({
      next: () => {
        this.toast.show('Coordonnées enregistrées.');
        this.error.set('');
      },
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }
}
