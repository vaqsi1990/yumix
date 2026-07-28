import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.schemas';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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

  async register(dto: RegisterDto) {
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const phone = dto.phone.trim();
    const address = dto.address.trim();
    const birthDate = dto.birthDate.trim();
    const email = dto.email.trim().toLowerCase();
    const password = dto.password;

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existing) {
      const field = existing.email === email ? 'ელფოსტა' : 'ტელეფონის ნომერი';
      throw new ConflictException(`ეს ${field} უკვე გამოყენებულია`);
    }

    const hashedPassword = await hash(password, 12);
    const parts = address
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const city = parts[0] || 'თბილისი';
    const street = parts.slice(1).join(', ') || address;

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        password: hashedPassword,
        birthDate: new Date(birthDate),
        role: 'USER',
        addresses: {
          create: {
            title: 'მთავარი',
            city,
            street,
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

    return {
      ...this.signToken(user),
      message: 'რეგისტრაცია წარმატებით გაიარე',
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
