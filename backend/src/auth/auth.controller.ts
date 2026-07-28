import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  loginSchema,
  registerSchema,
  type LoginDto,
  type RegisterDto,
} from './dto/auth.schemas';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
  ) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto) {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
