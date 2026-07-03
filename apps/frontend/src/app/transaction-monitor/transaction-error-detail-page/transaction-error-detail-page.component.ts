import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../admin/core/admin-api.service';
import { extractErrorMessage } from '../../admin/core/extract-error-message';
import { formatJsonHtml } from '../core/format-json-html';
import { TransactionErrorDetail } from '../core/monitor-models';

const RESOURCE_PATH = 'transaction-errors';

@Component({
  selector: 'app-transaction-error-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transaction-error-detail-page.component.html',
  styleUrl: './transaction-error-detail-page.component.scss',
})
export class TransactionErrorDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AdminApiService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly id = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly error = signal<TransactionErrorDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly detailsHtml = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      formatJsonHtml(this.error()?.details),
    ),
  );

  constructor() {
    this.api.getById<TransactionErrorDetail>(RESOURCE_PATH, this.id).subscribe({
      next: (result) => {
        this.error.set(result);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(extractErrorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
