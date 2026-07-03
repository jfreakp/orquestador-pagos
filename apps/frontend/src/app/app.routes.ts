import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
];
