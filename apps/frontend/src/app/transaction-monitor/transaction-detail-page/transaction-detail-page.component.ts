import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService } from '../../admin/core/admin-api.service';
import { extractErrorMessage } from '../../admin/core/extract-error-message';
import { formatJsonHtml } from '../core/format-json-html';
import { TransactionDetail } from '../core/monitor-models';

const RESOURCE_PATH = 'transactions';

@Component({
  selector: 'app-transaction-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transaction-detail-page.component.html',
  styleUrl: './transaction-detail-page.component.scss',
})
export class TransactionDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(AdminApiService);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly publicId = this.route.snapshot.paramMap.get('publicId') ?? '';

  protected readonly transaction = signal<TransactionDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly activeJsonTab = signal<'plain' | 'encrypted'>('plain');

  protected readonly requestPlainHtml = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      formatJsonHtml(this.transaction()?.requestPlain),
    ),
  );
  protected readonly responsePlainHtml = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(
      formatJsonHtml(this.transaction()?.responsePlain),
    ),
  );

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.getById<TransactionDetail>(RESOURCE_PATH, this.publicId).subscribe({
      next: (result) => {
        this.transaction.set(result);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(extractErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  protected setJsonTab(tab: 'plain' | 'encrypted'): void {
    this.activeJsonTab.set(tab);
  }
}
