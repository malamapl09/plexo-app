import { ApiProperty } from '@nestjs/swagger';

class UserInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ description: 'Whether user is a super administrator' })
  isSuperAdmin: boolean;

  @ApiProperty({ required: false, nullable: true })
  storeId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  storeName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  departmentId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  departmentName?: string | null;

  @ApiProperty({ description: 'List of module keys this user can access', type: [String] })
  moduleAccess: string[];
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'Token de acceso JWT (válido por 15 minutos)',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de actualización (válido por 7 días)',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Información del usuario autenticado',
    type: UserInfo,
  })
  user: UserInfo;
}
