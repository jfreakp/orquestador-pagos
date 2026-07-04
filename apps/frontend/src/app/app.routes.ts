import { Route } from '@angular/router';
import { AppShellComponent } from './shell/app-shell/app-shell.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'admin' },
      {
        path: 'admin',
        loadChildren: () =>
          import('./admin/admin.routes').then((m) => m.adminRoutes),
      },
      {
        path: 'transaction-monitor',
        loadChildren: () =>
          import('./transaction-monitor/transaction-monitor.routes').then(
            (m) => m.transactionMonitorRoutes,
          ),
      },
    ],
  },
];
