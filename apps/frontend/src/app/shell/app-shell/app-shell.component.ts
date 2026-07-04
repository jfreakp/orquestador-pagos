import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminTokenService } from '../../admin/core/admin-token.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FormsModule],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  protected readonly tokenService = inject(AdminTokenService);
  protected tokenInput = this.tokenService.token();

  protected saveToken(): void {
    this.tokenService.setToken(this.tokenInput.trim());
  }
}
