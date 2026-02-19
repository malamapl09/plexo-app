import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { CreateInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  async createInvitation(
    orgId: string,
    invitedById: string,
    inviterName: string,
    dto: CreateInvitationDto,
  ) {
    const tp = this.prisma.forTenant(orgId);

    // Check if user already exists with that email in this org
    const existingUser = await tp.user.findFirst({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(
        'Ya existe un usuario con este correo en la organización',
      );
    }

    // Check if a pending invitation already exists for this email in this org
    const existingInvitation = await tp.invitation.findFirst({
      where: {
        email: dto.email.toLowerCase(),
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw new ConflictException(
        'Ya existe una invitación pendiente para este correo',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await tp.invitation.create({
      data: {
        email: dto.email.toLowerCase(),
        role: dto.role,
        storeId: dto.storeId || null,
        departmentId: dto.departmentId || null,
        token,
        expiresAt,
        invitedById,
      },
    });

    // Fetch org name for the email
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    });

    const appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    const inviteUrl = `${appUrl}/accept-invite?token=${token}`;

    await this.emailService.sendInvitation(
      dto.email,
      org?.name || 'Plexo',
      inviterName,
      inviteUrl,
    );

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      storeId: invitation.storeId,
      departmentId: invitation.departmentId,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    };
  }

  async listInvitations(orgId: string) {
    const tp = this.prisma.forTenant(orgId);

    return tp.invitation.findMany({
      where: {
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        storeId: true,
        departmentId: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvitation(orgId: string, invitationId: string) {
    const tp = this.prisma.forTenant(orgId);

    const invitation = await tp.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    await tp.invitation.delete({ where: { id: invitationId } });

    return { message: 'Invitación revocada exitosamente' };
  }

  async acceptInvitation(token: string, name: string, password: string) {
    // Find invitation by token — not accepted, not expired
    const invitation = await this.prisma.invitation.findFirst({
      where: {
        token,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: { select: { id: true, name: true } },
      },
    });

    if (!invitation) {
      throw new UnauthorizedException('Invitación inválida o expirada');
    }

    const orgId = invitation.organizationId;
    const tp = this.prisma.forTenant(orgId);

    // Double-check the email is not already registered (race condition guard)
    const existingUser = await tp.user.findFirst({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'Ya existe una cuenta con este correo. Por favor inicia sesión.',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user with the invitation's role/store/department
    const user = await tp.user.create({
      data: {
        email: invitation.email,
        passwordHash,
        name,
        role: invitation.role,
        storeId: invitation.storeId || null,
        departmentId: invitation.departmentId || null,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        storeId: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Mark invitation as accepted
    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });

    return {
      message: 'Cuenta creada exitosamente. Ya puedes iniciar sesión.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
