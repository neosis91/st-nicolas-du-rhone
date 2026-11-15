import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormField, form as signalForm, minLength, pattern, required } from '@angular/forms/signals';
import { ApiService } from '../core/api.service';
import { readError, slugify, slugPattern, toDatetimeLocal } from '../core/format';
import { AdminFormResult } from './admin-dialog';
import { FieldError } from './field-error';

function blankArticle() {
  return {
    title: '',
    slug: '',
    category: 'Annonce',
    excerpt: '',
    body: '',
    sourceLabel: '',
    sourceUrl: '',
    published: true,
    publishedAt: toDatetimeLocal(new Date().toISOString()),
  };
}
import { CloseButton } from './close-button';
import { DeleteButton } from './delete-button';

@Component({
  selector: 'app-article-form',
  imports: [FormField, FieldError, CloseButton, DeleteButton],
  templateUrl: './article-form.html',
})
export class ArticleFormPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly dialogRef = inject(DialogRef<AdminFormResult>);
  private readonly data = inject<{ id: string }>(DIALOG_DATA);
  readonly error = signal('');
  readonly editingId = signal<string | null>(null);
  private readonly model = signal(blankArticle());
  readonly form = signalForm(this.model, (path) => {
    required(path.title);
    minLength(path.title, 3);
    required(path.slug);
    pattern(path.slug, slugPattern);
    required(path.category);
    required(path.excerpt);
    minLength(path.excerpt, 10);
    required(path.body);
    minLength(path.body, 10);
    required(path.publishedAt);
  });

  ngOnInit() {
    this.load(this.data.id);
  }

  close() {
    this.dialogRef.close();
  }

  fillSlug() {
    if (this.form.slug().value().trim()) return;
    this.form.slug().value.set(slugify(this.form.title().value()));
  }

  save() {
    this.fillSlug();
    if (this.form().invalid()) {
      this.form().markAsTouched();
      return;
    }
    const value = this.form().value();
    const payload = {
      ...value,
      publishedAt: new Date(value.publishedAt).toISOString(),
      sourceLabel: value.sourceLabel.trim() || null,
      sourceUrl: value.sourceUrl.trim() || null,
    };
    const id = this.editingId();
    const request = id ? this.api.updateArticle(id, payload) : this.api.createArticle(payload);
    request.subscribe({
      next: () => this.dialogRef.close('saved'),
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove() {
    const id = this.editingId();
    if (!id || !confirm('Supprimer cette actualité ?')) return;
    this.api.deleteArticle(id).subscribe({
      next: () => this.dialogRef.close('deleted'),
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  private load(id: string | null) {
    if (!id || id === 'nouveau') {
      this.editingId.set(null);
      return;
    }
    this.editingId.set(id);
    this.api.adminArticle(id).subscribe((article) => {
      this.form().reset({
        title: article.title,
        slug: article.slug,
        category: article.category,
        excerpt: article.excerpt,
        body: article.body,
        sourceLabel: article.sourceLabel ?? '',
        sourceUrl: article.sourceUrl ?? '',
        published: article.published,
        publishedAt: toDatetimeLocal(article.publishedAt),
      });
    });
  }
}
