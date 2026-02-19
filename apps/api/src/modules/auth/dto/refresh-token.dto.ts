import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de actualización',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token de actualización es requerido' })
  refreshToken: string;
}
