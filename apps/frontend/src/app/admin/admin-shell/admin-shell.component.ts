import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AdminTokenService } from '../core/admin-token.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FormsModule],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  protected readonly tokenService = inject(AdminTokenService);
  protected tokenInput = this.tokenService.token();

  saveToken(): void {
    this.tokenService.setToken(this.tokenInput.trim());
  }
}
