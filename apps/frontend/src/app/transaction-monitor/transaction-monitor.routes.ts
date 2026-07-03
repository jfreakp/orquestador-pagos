import { Route } from '@angular/router';
import { MonitorShellComponent } from './monitor-shell/monitor-shell.component';
import { TransactionDetailPageComponent } from './transaction-detail-page/transaction-detail-page.component';
import { TransactionErrorDetailPageComponent } from './transaction-error-detail-page/transaction-error-detail-page.component';
import { TransactionErrorsListPageComponent } from './transaction-errors-list-page/transaction-errors-list-page.component';
import { TransactionsListPageComponent } from './transactions-list-page/transactions-list-page.component';

export const transactionMonitorRoutes: Route[] = [
  {
    path: '',
    component: MonitorShellComponent,
    children: [
      { path: '', redirectTo: 'transactions', pathMatch: 'full' },
      { path: 'transactions', component: TransactionsListPageComponent },
      {
        path: 'transactions/:publicId',
        component: TransactionDetailPageComponent,
      },
      {
        path: 'transaction-errors',
        component: TransactionErrorsListPageComponent,
      },
      {
        path: 'transaction-errors/:id',
        component: TransactionErrorDetailPageComponent,
      },
    ],
  },
];
