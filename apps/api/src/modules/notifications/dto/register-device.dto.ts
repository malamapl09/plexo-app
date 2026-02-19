import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';

export enum DevicePlatform {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WEB = 'WEB',
}

export class RegisterDeviceDto {
  @ApiProperty({
    description: 'FCM device token',
    example: 'dGVzdF90b2tlbl8xMjM0NTY3ODkw',
  })
  @IsString()
  @MinLength(10)
  token: string;

  @ApiProperty({
    description: 'Device platform',
    enum: DevicePlatform,
    example: DevicePlatform.ANDROID,
  })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @ApiPropertyOptional({
    description: 'Device name/model',
    example: 'Samsung Galaxy S21',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;

  @ApiPropertyOptional({
    description: 'App version',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class UnregisterDeviceDto {
  @ApiProperty({
    description: 'FCM device token to unregister',
  })
  @IsString()
  token: string;
}
