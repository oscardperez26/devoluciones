import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginSchema, type AdminLoginDto } from './dto/admin-login.dto';

@Controller({ path: 'admin/auth', version: '1' })
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(AdminLoginSchema)) dto: AdminLoginDto) {
    return this.adminAuthService.login(dto);
  }
}
