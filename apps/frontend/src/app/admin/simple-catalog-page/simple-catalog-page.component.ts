import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminApiService } from '../core/admin-api.service';
import { extractErrorMessage } from '../core/extract-error-message';

interface CatalogItem {
  id: number;
  code: string;
  name: string;
  isActive?: boolean;
}

const PAGE_SIZE = 10;

@Component({
  selector: 'app-simple-catalog-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './simple-catalog-page.component.html',
  styleUrl: './simple-catalog-page.component.scss',
})
export class SimpleCatalogPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly resourcePath = this.route.snapshot.data['resourcePath'] as string;
  protected readonly title = this.route.snapshot.data['title'] as string;
  protected readonly hasIsActive = this.route.snapshot.data['hasIsActive'] as boolean;

  protected readonly items = signal<CatalogItem[]>([]);
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
    isActive: [true],
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .list<CatalogItem>(this.resourcePath, {
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

  protected startEdit(item: CatalogItem): void {
    this.editingId.set(item.id);
    this.form.setValue({
      code: item.code,
      name: item.name,
      isActive: item.isActive ?? true,
    });
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({ code: '', name: '', isActive: true });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const dto = this.hasIsActive
      ? raw
      : { code: raw.code, name: raw.name };
    const editingId = this.editingId();

    const request = editingId
      ? this.api.update<CatalogItem>(this.resourcePath, editingId, dto)
      : this.api.create<CatalogItem>(this.resourcePath, dto);

    this.errorMessage.set(null);
    request.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (error) => this.errorMessage.set(extractErrorMessage(error)),
    });
  }

  protected remove(item: CatalogItem): void {
    if (!confirm(`¿Eliminar "${item.name}"?`)) {
      return;
    }
    this.api.remove(this.resourcePath, item.id).subscribe({
      next: () => this.load(),
      error: (error) => this.errorMessage.set(extractErrorMessage(error)),
    });
  }
}
