import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginResponseDto } from './admin-login-response.dto';
import { LoginDto } from './dto/login.dto';

// Intentionally has no guard: this is the endpoint that issues the session
// used by AdminAuthGuard everywhere else in /admin.
@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AdminLoginResponseDto> {
    return this.adminAuthService.login(dto.username, dto.password);
  }
}
