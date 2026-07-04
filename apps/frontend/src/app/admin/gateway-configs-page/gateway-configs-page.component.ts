import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../core/admin-api.service';
import { extractErrorMessage } from '../core/extract-error-message';
import { booleanPillModifier } from '../../shared/status-pill';

interface GatewayConfigItem {
  id: number;
  gatewayId: number;
  channelId: number;
  isActive: boolean;
  hasCredentials: boolean;
}

interface CatalogRef {
  id: number;
  code: string;
  name: string;
}

const RESOURCE_PATH = 'gateway-configs';
const PAGE_SIZE = 10;

@Component({
  selector: 'app-gateway-configs-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gateway-configs-page.component.html',
  styleUrl: './gateway-configs-page.component.scss',
})
export class GatewayConfigsPageComponent {
  protected readonly booleanPillModifier = booleanPillModifier;

  private readonly api = inject(AdminApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly items = signal<GatewayConfigItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly editingId = signal<number | null>(null);

  protected readonly gateways = signal<CatalogRef[]>([]);
  protected readonly channels = signal<CatalogRef[]>([]);

  protected readonly gatewayCodeById = computed(
    () => new Map(this.gateways().map((g) => [g.id, g.code])),
  );
  protected readonly channelCodeById = computed(
    () => new Map(this.channels().map((c) => [c.id, c.code])),
  );

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / PAGE_SIZE)),
  );

  protected readonly form = this.fb.nonNullable.group({
    gatewayCode: ['', [Validators.required]],
    channelCode: ['', [Validators.required]],
    isActive: [true],
    replaceCredentials: [true],
    ahoritaClientCode: [''],
    ahoritaBankPublicKeyPem: [''],
    ahoritaClientPrivateKeyPem: [''],
    ahoritaMerchantHash: [''],
    placetopayLogin: [''],
    placetopaySecretKey: [''],
    genericCredentialsJson: [''],
  });

  constructor() {
    this.load();
    this.api
      .list<CatalogRef>('gateways', { pageSize: 100 })
      .subscribe((result) => this.gateways.set(result.items));
    this.api
      .list<CatalogRef>('channels', { pageSize: 100 })
      .subscribe((result) => this.channels.set(result.items));
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api
      .list<GatewayConfigItem>(RESOURCE_PATH, {
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

  protected startEdit(item: GatewayConfigItem): void {
    this.editingId.set(item.id);
    this.form.reset({
      gatewayCode: this.gatewayCodeById().get(item.gatewayId) ?? '',
      channelCode: this.channelCodeById().get(item.channelId) ?? '',
      isActive: item.isActive,
      replaceCredentials: false,
      ahoritaClientCode: '',
      ahoritaBankPublicKeyPem: '',
      ahoritaClientPrivateKeyPem: '',
      ahoritaMerchantHash: '',
      placetopayLogin: '',
      placetopaySecretKey: '',
      genericCredentialsJson: '',
    });
    this.form.controls.gatewayCode.disable();
    this.form.controls.channelCode.disable();
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.form.reset({
      gatewayCode: '',
      channelCode: '',
      isActive: true,
      replaceCredentials: true,
      ahoritaClientCode: '',
      ahoritaBankPublicKeyPem: '',
      ahoritaClientPrivateKeyPem: '',
      ahoritaMerchantHash: '',
      placetopayLogin: '',
      placetopaySecretKey: '',
      genericCredentialsJson: '',
    });
    this.form.controls.gatewayCode.enable();
    this.form.controls.channelCode.enable();
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const editingId = this.editingId();
    const needsCredentials = !editingId || raw.replaceCredentials;

    let credentialsPlain: Record<string, unknown> | undefined;
    if (needsCredentials) {
      try {
        credentialsPlain = this.buildCredentialsPlain(raw);
      } catch {
        this.errorMessage.set('El JSON de credenciales no es válido');
        return;
      }
    }

    this.errorMessage.set(null);

    const request = editingId
      ? this.api.update(RESOURCE_PATH, editingId, {
          isActive: raw.isActive,
          ...(credentialsPlain ? { credentialsPlain } : {}),
        })
      : this.api.create(RESOURCE_PATH, {
          gatewayCode: raw.gatewayCode,
          channelCode: raw.channelCode,
          isActive: raw.isActive,
          credentialsPlain,
        });

    request.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: (error) => this.errorMessage.set(extractErrorMessage(error)),
    });
  }

  protected remove(item: GatewayConfigItem): void {
    if (!confirm('¿Eliminar esta configuración de gateway?')) {
      return;
    }
    this.api.remove(RESOURCE_PATH, item.id).subscribe({
      next: () => this.load(),
      error: (error) => this.errorMessage.set(extractErrorMessage(error)),
    });
  }

  private buildCredentialsPlain(
    raw: ReturnType<typeof this.form.getRawValue>,
  ): Record<string, unknown> {
    switch (raw.gatewayCode) {
      case 'AHORITA':
        return {
          clientCode: raw.ahoritaClientCode,
          bankPublicKeyPem: raw.ahoritaBankPublicKeyPem,
          clientPrivateKeyPem: raw.ahoritaClientPrivateKeyPem,
          merchantHash: raw.ahoritaMerchantHash,
        };
      case 'PLACETOPAY':
        return { login: raw.placetopayLogin, secretKey: raw.placetopaySecretKey };
      default:
        return JSON.parse(raw.genericCredentialsJson || '{}');
    }
  }
}
