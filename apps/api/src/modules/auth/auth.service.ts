import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ModuleAccessService } from '../module-access/module-access.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { ALL_MODULES } from '../../common/constants/modules';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private moduleAccessService: ModuleAccessService,
    private emailService: EmailService,
  ) {}

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: {
        store: true,
        department: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId, user.isPlatformAdmin);

    // Store refresh token hash in database (for invalidation)
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    // Audit log
    await this.auditService.log(user.organizationId, {
      entityType: 'USER',
      entityId: user.id,
      action: 'LOGIN',
      performedById: user.id,
      performedByRole: user.role,
    });

    // Get module access for role (super admins get all modules)
    const moduleAccess = user.isSuperAdmin
      ? ALL_MODULES
      : await this.moduleAccessService.getAccessibleModules(user.organizationId, user.role);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
        storeId: user.storeId,
        storeName: user.store?.name,
        departmentId: user.departmentId,
        departmentName: user.department?.name,
        organizationId: user.organizationId,
        moduleAccess,
      },
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.getRefreshSecret(),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          store: true,
          department: true,
        },
      });

      if (!user || !user.isActive || !user.refreshTokenHash) {
        throw new UnauthorizedException('Token de actualización inválido');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshTokenHash,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Token de actualización inválido');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role, user.organizationId, user.isPlatformAdmin);

      // Update refresh token hash
      const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: newRefreshTokenHash },
      });

      const moduleAccess = user.isSuperAdmin
        ? ALL_MODULES
        : await this.moduleAccessService.getAccessibleModules(user.organizationId, user.role);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          storeId: user.storeId,
          storeName: user.store?.name,
          departmentId: user.departmentId,
          departmentName: user.department?.name,
          organizationId: user.organizationId,
          moduleAccess,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token de actualización inválido');
      }
      throw error;
    }
  }

  async logout(userId: string, userRole: string, orgId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    // Audit log
    await this.auditService.log(orgId, {
      entityType: 'USER',
      entityId: userId,
      action: 'LOGOUT',
      performedById: userId,
      performedByRole: userRole as any,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { store: true, department: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const moduleAccess = user.isSuperAdmin
      ? ALL_MODULES
      : await this.moduleAccessService.getAccessibleModules(user.organizationId, user.role);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      storeId: user.storeId,
      storeName: user.store?.name,
      departmentId: user.departmentId,
      departmentName: user.department?.name,
      organizationId: user.organizationId,
      moduleAccess,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), isActive: true },
    });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return { message: 'Si el correo existe, recibirá un enlace para restablecer su contraseña' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    await this.emailService.sendPasswordReset(user.email, resetUrl);

    return { message: 'Si el correo existe, recibirá un enlace para restablecer su contraseña' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        refreshTokenHash: null, // Invalidate all sessions
      },
    });

    return { message: 'Contraseña actualizada exitosamente' };
  }

  private getRefreshSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET environment variable is not set');
    }
    return secret;
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    organizationId: string,
    isPlatformAdmin = false,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: Record<string, any> = { sub: userId, email, role, org: organizationId };
    if (isPlatformAdmin) {
      payload.platformAdmin = true;
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.getRefreshSecret(),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
