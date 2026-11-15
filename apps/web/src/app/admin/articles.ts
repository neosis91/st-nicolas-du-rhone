import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ApiService } from '../core/api.service';
import { formatDate } from '../core/format';
import { ArticleRecord } from '../core/models';
import { ToastService } from '../core/toast';
import { bindRoutedForm } from './admin-dialog';
import { EditButton } from './edit-button';
import { ArticleFormPage } from './article-form';

@Component({
  selector: 'app-articles-admin',
  imports: [RouterLink, RouterOutlet, EditButton],
  templateUrl: './articles.html',
})
export class ArticlesAdmin implements OnInit {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  readonly articles = signal<ArticleRecord[]>([]);
  readonly formatDate = formatDate;

  constructor() {
    bindRoutedForm(ArticleFormPage, ['/admin/actualites'], (result) => {
      this.toast.show(result === 'deleted' ? 'Supprimé.' : 'Enregistré.');
      this.reload();
    });
  }

  ngOnInit() {
    this.reload();
  }

  private reload() {
    this.api.adminArticles().subscribe((articles) => this.articles.set(articles));
  }
}
