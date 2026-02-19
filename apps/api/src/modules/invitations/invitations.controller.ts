import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    sub: string;
    email: string;
    role: string;
    organizationId: string;
    name?: string;
  };
}

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enviar invitación a un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Invitación enviada exitosamente' })
  @ApiResponse({ status: 409, description: 'Usuario o invitación ya existe' })
  async createInvitation(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateInvitationDto,
  ) {
    const orgId = req.user.organizationId;
    const invitedById = req.user.sub;
    const inviterName = req.user.name || req.user.email;

    return this.invitationsService.createInvitation(
      orgId,
      invitedById,
      inviterName,
      dto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar invitaciones pendientes' })
  @ApiResponse({ status: 200, description: 'Lista de invitaciones pendientes' })
  async listInvitations(@Request() req: AuthenticatedRequest) {
    return this.invitationsService.listInvitations(req.user.organizationId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revocar una invitación pendiente' })
  @ApiResponse({ status: 200, description: 'Invitación revocada' })
  @ApiResponse({ status: 404, description: 'Invitación no encontrada' })
  async revokeInvitation(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.invitationsService.revokeInvitation(
      req.user.organizationId,
      id,
    );
  }

  @Public()
  @Post('accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar invitación y crear cuenta' })
  @ApiResponse({ status: 200, description: 'Cuenta creada exitosamente' })
  @ApiResponse({ status: 401, description: 'Invitación inválida o expirada' })
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.acceptInvitation(
      dto.token,
      dto.name,
      dto.password,
    );
  }
}
