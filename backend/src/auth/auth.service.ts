import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'crypto';
import { compare, hash } from 'bcryptjs';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyRegisterDto,
} from './dto/auth.schemas';

type PendingPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  city?: string;
  street?: string;
  latitude?: number | null;
  longitude?: number | null;
  birthDate: string;
  email: string;
  passwordHash: string;
};

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  private signToken(user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
      },
    };
  }

  private hashCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  private generateCode() {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private normalizeRegister(dto: RegisterDto) {
    return {
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone.trim(),
      city: dto.city.trim(),
      street: dto.street.trim(),
      latitude: dto.latitude,
      longitude: dto.longitude,
      birthDate: dto.birthDate.trim(),
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
    };
  }

  async requestRegistration(dto: RegisterDto) {
    const data = this.normalizeRegister(dto);

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });

    if (existing) {
      const field = existing.email === data.email ? 'ელფოსტა' : 'ტელეფონის ნომერი';
      throw new ConflictException(`ეს ${field} უკვე გამოყენებულია`);
    }

    const code = this.generateCode();
    const passwordHash = await hash(data.password, 12);
    const payload: PendingPayload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      city: data.city,
      street: data.street,
      latitude: data.latitude,
      longitude: data.longitude,
      birthDate: data.birthDate,
      email: data.email,
      passwordHash,
    };

    await this.prisma.emailVerification.upsert({
      where: { email: data.email },
      create: {
        email: data.email,
        codeHash: this.hashCode(code),
        payload: payload as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
        attempts: 0,
      },
      update: {
        codeHash: this.hashCode(code),
        payload: payload as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
        attempts: 0,
      },
    });

    await this.email.sendVerificationCode(data.email, code);

    return {
      message: 'ვერიფიკაციის კოდი გაიგზავნა ელფოსტაზე',
      email: data.email,
    };
  }

  async verifyAndRegister(dto: VerifyRegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const code = dto.code.trim();

    const pending = await this.prisma.emailVerification.findUnique({
      where: { email },
    });

    if (!pending) {
      throw new BadRequestException('ვერიფიკაციის მოთხოვნა არ მოიძებნა');
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await this.prisma.emailVerification.delete({ where: { email } });
      throw new BadRequestException('კოდის ვადა ამოიწურა. მოითხოვე ახალი კოდი');
    }

    if (pending.attempts >= MAX_ATTEMPTS) {
      await this.prisma.emailVerification.delete({ where: { email } });
      throw new BadRequestException(
        'მცდელობების ლიმიტი ამოიწურა. მოითხოვე ახალი კოდი',
      );
    }

    if (pending.codeHash !== this.hashCode(code)) {
      await this.prisma.emailVerification.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('კოდი არასწორია');
    }

    const payload = pending.payload as PendingPayload;
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: payload.email }, { phone: payload.phone }],
      },
    });
    if (existing) {
      await this.prisma.emailVerification.delete({ where: { email } });
      throw new ConflictException('ეს ანგარიში უკვე არსებობს');
    }

    const parts = (payload.address ?? '')
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const city = payload.city?.trim() || parts[0] || 'თბილისი';
    const street =
      payload.street?.trim() || parts.slice(1).join(', ') || payload.address || city;

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          phone: payload.phone,
          email: payload.email,
          password: payload.passwordHash,
          birthDate: new Date(payload.birthDate),
          role: 'USER',
          emailVerified: true,
          addresses: {
            create: {
              title: 'მთავარი',
              city,
              street,
              latitude: payload.latitude ?? null,
              longitude: payload.longitude ?? null,
              isDefault: true,
            },
          },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      await tx.emailVerification.delete({ where: { email } });
      return created;
    });

    return {
      ...this.signToken(user),
      message: 'რეგისტრაცია წარმატებით გაიარე',
    };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return {
        message: 'თუ ეს ელფოსტა არსებობს, აღდგენის კოდი გაიგზავნა',
        email,
      };
    }

    const code = this.generateCode();

    await this.prisma.passwordReset.upsert({
      where: { email },
      create: {
        email,
        codeHash: this.hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
        attempts: 0,
      },
      update: {
        codeHash: this.hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
        attempts: 0,
      },
    });

    await this.email.sendPasswordResetCode(email, code);

    return {
      message: 'თუ ეს ელფოსტა არსებობს, აღდგენის კოდი გაიგზავნა',
      email,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const code = dto.code.trim();

    const pending = await this.prisma.passwordReset.findUnique({
      where: { email },
    });

    if (!pending) {
      throw new BadRequestException('აღდგენის მოთხოვნა არ მოიძებნა');
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await this.prisma.passwordReset.delete({ where: { email } });
      throw new BadRequestException('კოდის ვადა ამოიწურა. მოითხოვე ახალი კოდი');
    }

    if (pending.attempts >= MAX_ATTEMPTS) {
      await this.prisma.passwordReset.delete({ where: { email } });
      throw new BadRequestException(
        'მცდელობების ლიმიტი ამოიწურა. მოითხოვე ახალი კოდი',
      );
    }

    if (pending.codeHash !== this.hashCode(code)) {
      await this.prisma.passwordReset.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('კოდი არასწორია');
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      await this.prisma.passwordReset.delete({ where: { email } });
      throw new BadRequestException('ანგარიში ვერ მოიძებნა');
    }

    const passwordHash = await hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { email },
        data: { password: passwordHash },
      });
      await tx.passwordReset.delete({ where: { email } });
    });

    return {
      message: 'პაროლი წარმატებით შეიცვალა',
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('ელფოსტა ან პაროლი არასწორია');
    }

    const valid = await compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('ელფოსტა ან პაროლი არასწორია');
    }

    return this.signToken(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        emailVerified: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Unauthorized');
    }
    return {
      user: {
        ...user,
        name: `${user.firstName} ${user.lastName}`,
      },
    };
  }
}
