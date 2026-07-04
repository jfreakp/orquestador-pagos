import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../core/admin-api.service';
import { extractErrorMessage } from '../core/extract-error-message';
import { pemPublicKeyValidator } from './pem-public-key.validator';
import { booleanPillModifier } from '../../shared/status-pill';

interface ClientSystemItem {
  id: number;
  code: string;
  name: string;
  publicKey: string;
  isActive: boolean;
}

const RESOURCE_PATH = 'client-systems';
const PAGE_SIZE = 10;

@Component({
  selector: 'app-client-systems-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-systems-page.component.html',
  styleUrl: './client-systems-page.component.scss',
})
export class ClientSystemsPageComponent {
  protected readonly booleanPillModifier = booleanPillModifier;

  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<ClientSystemItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / PAGE_SIZE)),
  );

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required]],
    name: ['', [Validators.required]],
    publicKey: ['', [Validators.required, pemPublicKeyValidator]],
    isActive: [true],
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .list<ClientSystemItem>(RESOURCE_PATH, {
        page: this.page(),
        pageSize: PAGE_SIZE,
      })
      .subscribe({
        next: (result) => {
          this.items.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(extractErrorMessage(error));
          this.loading.set(false);
        },
      });
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  protected startEdit(item: ClientSystemItem): void {
    this.editingId.set(item.id);
    this.form.setValue({
      code: item.code,
      name: item.name,
      publicKey: item.publicKey,
      isActive: item.isActive,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ code: '', name: '', publicKey: '', isActive: true });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.form.getRawValue();
    const editingId = this.editingId();
    const request = editingId
      ? this.api.update<ClientSystemItem>(RESOURCE_PATH, editingId, dto)
      : this.api.create<ClientSystemItem>(RESOURCE_PATH, dto);

    this.errorMessage.set(null);
    request.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (error) => this.errorMessage.set(extractErrorMessage(error)),
    });
  }

  protected remove(item: ClientSystemItem): void {
    if (!confirm(`¿Eliminar el sistema "${item.name}"?`)) {
      return;
    }
    this.api.remove(RESOURCE_PATH, item.id).subscribe({
      next: () => this.load(),
      error: (error) => this.errorMessage.set(extractErrorMessage(error)),
    });
  }

  protected truncate(value: string, length = 40): string {
    return value.length > length ? `${value.slice(0, length)}…` : value;
  }
}
