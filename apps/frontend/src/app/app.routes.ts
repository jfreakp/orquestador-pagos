import { Route } from '@angular/router';
import { adminAuthGuard } from './admin/core/admin-auth.guard';
import { AppShellComponent } from './shell/app-shell/app-shell.component';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [adminAuthGuard],
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
