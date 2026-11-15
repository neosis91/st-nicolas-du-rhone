import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { formatDate, readError } from '../core/format';
import { ParishMessage } from '../core/models';
import { DeleteButton } from './delete-button';

@Component({
  selector: 'app-messages-admin',
  imports: [DeleteButton],
  templateUrl: './messages.html',
})
export class MessagesAdmin implements OnInit {
  private readonly api = inject(ApiService);
  readonly messages = signal<ParishMessage[]>([]);
  readonly openId = signal<string | null>(null);
  readonly formatDate = formatDate;
  readonly error = signal('');

  ngOnInit() {
    this.reload();
  }

  toggle(id: string) {
    this.openId.set(this.openId() === id ? null : id);
  }

  markRead(message: ParishMessage) {
    this.api.markMessageRead(message.id).subscribe({
      next: () => this.reload(),
      error: (error: unknown) => this.error.set(readError(error)),
    });
  }

  remove(message: ParishMessage) {
    if (!confirm('Supprimer ce message ?')) return;
    this.api.deleteMessage(message.id).subscribe({ next: () => this.reload() });
  }

  private reload() {
    this.api.messages().subscribe((messages) => this.messages.set(messages));
  }
}
