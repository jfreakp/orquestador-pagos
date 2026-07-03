import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminTokenService } from '../../admin/core/admin-token.service';

@Component({
  selector: 'app-monitor-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FormsModule],
  templateUrl: './monitor-shell.component.html',
  styleUrl: './monitor-shell.component.scss',
})
export class MonitorShellComponent {
  protected readonly tokenService = inject(AdminTokenService);
  protected tokenInput = this.tokenService.token();

  saveToken(): void {
    this.tokenService.setToken(this.tokenInput.trim());
  }
}
