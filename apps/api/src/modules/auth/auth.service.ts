import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../database/prisma.service";
import type {
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  AuthResponseDto,
} from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Неверный email или пароль");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((ur) => ur.role.code),
      },
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        "Пользователь с таким email уже существует",
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
      include: { roles: { include: { role: true } } },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((ur) => ur.role.code),
      },
    };
  }

  async refreshTokens(
    dto: RefreshTokenDto,
  ): Promise<Omit<AuthResponseDto, "user">> {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>("jwt.secret"),
      });

      const session = await this.prisma.session.findFirst({
        where: {
          userId: payload.sub,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!session) {
        throw new UnauthorizedException("Сессия не найдена или истекла");
      }

      const tokens = await this.generateTokens(payload.sub, payload.email);

      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException("Недействительный refresh токен");
    }
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, terminatedAt: null },
      data: { terminatedAt: new Date() },
    });
  }

  async getProfile(userId: string) {
    return this.validateUser(userId);
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const permissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => ({
        subject: rp.permission.subject,
        action: rp.permission.action,
      })),
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      filialId: user.filialId,
      isSuperadmin: user.isSuperadmin,
      roles: user.roles.map((ur) => ur.role.code),
      permissions,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.secret"),
        expiresIn: this.configService.get<string>("jwt.accessTokenExpiresIn"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>("jwt.secret"),
        expiresIn: this.configService.get<string>("jwt.refreshTokenExpiresIn"),
      }),
    ]);

    const accessTokenExpiresIn = this.parseExpiresIn(
      this.configService.get<string>("jwt.accessTokenExpiresIn") || "15m",
    );

    return { accessToken, refreshToken, expiresIn: accessTokenExpiresIn };
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([mhd])$/);
    if (!match) return 900;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "m":
        return value * 60;
      case "h":
        return value * 3600;
      case "d":
        return value * 86400;
      default:
        return 900;
    }
  }
}
