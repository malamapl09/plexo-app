import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Crear nuevo usuario (Solo Operations Manager)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Usuario ya existe' })
  create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(req.user.organizationId, createUserDto, req.user.id, req.user.role);
  }

  @Get()
  @Roles('OPERATIONS_MANAGER', 'HQ_TEAM', 'REGIONAL_SUPERVISOR')
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Request() req: any,
    @Query('role') role?: string,
    @Query('storeId') storeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.usersService.findAll(req.user.organizationId, { role, storeId, departmentId, isActive });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.usersService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Actualizar usuario (Solo Operations Manager)' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    return this.usersService.update(req.user.organizationId, id, updateUserDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Desactivar usuario (Solo Operations Manager)' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.usersService.remove(req.user.organizationId, id, req.user.id, req.user.role);
  }
}
