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
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreTierDto } from './dto/update-store-tier.dto';
import { UpdateStoreDepartmentsDto } from './dto/update-store-departments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('stores')
@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Crear tienda (Solo Operations Manager)' })
  @ApiResponse({ status: 201, description: 'Tienda creada' })
  create(@Body() createStoreDto: CreateStoreDto, @Request() req: any) {
    return this.storesService.create(req.user.organizationId, createStoreDto, req.user.id, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tiendas' })
  @ApiQuery({ name: 'regionId', required: false })
  findAll(@Request() req: any, @Query('regionId') regionId?: string) {
    return this.storesService.findAll(req.user.organizationId, regionId);
  }

  @Get('regions')
  @ApiOperation({ summary: 'Listar regiones' })
  findAllRegions(@Request() req: any) {
    return this.storesService.findAllRegions(req.user.organizationId);
  }

  @Get('departments')
  @ApiOperation({ summary: 'Listar departamentos' })
  findAllDepartments(@Request() req: any) {
    return this.storesService.findAllDepartments(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tienda por ID' })
  @ApiResponse({ status: 200, description: 'Tienda encontrada' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.storesService.findOne(req.user.organizationId, id);
  }

  @Patch(':id')
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Actualizar tienda (Solo Operations Manager)' })
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto, @Request() req: any) {
    return this.storesService.update(req.user.organizationId, id, updateStoreDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Desactivar tienda (Solo Operations Manager)' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.storesService.remove(req.user.organizationId, id, req.user.id, req.user.role);
  }

  @Patch(':id/tier')
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Actualizar tier de tienda (Solo Operations Manager)' })
  @ApiResponse({ status: 200, description: 'Tier actualizado' })
  updateTier(
    @Param('id') id: string,
    @Body() dto: UpdateStoreTierDto,
    @Request() req: any,
  ) {
    return this.storesService.updateStoreTier(req.user.organizationId, id, dto.tier, dto.override ?? false, req.user.id, req.user.role);
  }

  @Get(':id/departments')
  @ApiOperation({ summary: 'Obtener departamentos de una tienda' })
  getStoreDepartments(@Request() req: any, @Param('id') id: string) {
    return this.storesService.getStoreDepartments(req.user.organizationId, id);
  }

  @Patch(':id/departments')
  @Roles('OPERATIONS_MANAGER')
  @ApiOperation({ summary: 'Actualizar departamentos activos de una tienda' })
  @ApiResponse({ status: 200, description: 'Departamentos actualizados' })
  updateStoreDepartments(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDepartmentsDto,
    @Request() req: any,
  ) {
    return this.storesService.updateStoreDepartments(req.user.organizationId, id, dto.departmentIds, req.user.id, req.user.role);
  }
}
