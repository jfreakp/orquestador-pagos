import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../admin/core/admin-api.service';
import { extractErrorMessage } from '../../admin/core/extract-error-message';
import { TransactionListItem } from '../core/monitor-models';

const RESOURCE_PATH = 'transactions';
const PAGE_SIZE = 10;

@Component({
  selector: 'app-transactions-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './transactions-list-page.component.html',
  styleUrl: './transactions-list-page.component.scss',
})
export class TransactionsListPageComponent {
  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<TransactionListItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / PAGE_SIZE)),
  );

  protected readonly filtersForm = this.fb.nonNullable.group({
    gatewayCode: [''],
    statusCode: [''],
    channelCode: [''],
    clientSystemCode: [''],
    dateFrom: [''],
    dateTo: [''],
  });

  constructor() {
    this.load();
  }

  protected applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  protected clearFilters(): void {
    this.filtersForm.reset({
      gatewayCode: '',
      statusCode: '',
      channelCode: '',
      clientSystemCode: '',
      dateFrom: '',
      dateTo: '',
    });
    this.applyFilters();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const filters = this.filtersForm.getRawValue();

    this.api
      .list<TransactionListItem>(RESOURCE_PATH, {
        ...filters,
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
}
