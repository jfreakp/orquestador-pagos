import { Route } from '@angular/router';
import { ClientSystemsPageComponent } from './client-systems-page/client-systems-page.component';
import { GatewayConfigsPageComponent } from './gateway-configs-page/gateway-configs-page.component';
import { SimpleCatalogPageComponent } from './simple-catalog-page/simple-catalog-page.component';

export const adminRoutes: Route[] = [
  { path: '', redirectTo: 'gateways', pathMatch: 'full' },
  {
    path: 'gateways',
    component: SimpleCatalogPageComponent,
    data: { resourcePath: 'gateways', title: 'Gateways', hasIsActive: true },
  },
  {
    path: 'channels',
    component: SimpleCatalogPageComponent,
    data: { resourcePath: 'channels', title: 'Canales', hasIsActive: true },
  },
  {
    path: 'transaction-statuses',
    component: SimpleCatalogPageComponent,
    data: {
      resourcePath: 'transaction-statuses',
      title: 'Estados de transacción',
      hasIsActive: false,
    },
  },
  {
    path: 'gateway-operation-types',
    component: SimpleCatalogPageComponent,
    data: {
      resourcePath: 'gateway-operation-types',
      title: 'Tipos de operación',
      hasIsActive: false,
    },
  },
  {
    path: 'error-categories',
    component: SimpleCatalogPageComponent,
    data: {
      resourcePath: 'error-categories',
      title: 'Categorías de error',
      hasIsActive: false,
    },
  },
  { path: 'client-systems', component: ClientSystemsPageComponent },
  { path: 'gateway-configs', component: GatewayConfigsPageComponent },
];
