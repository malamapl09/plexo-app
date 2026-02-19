import { IsString, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCorrectiveActionDto {
  @ApiProperty({ description: 'User UUID to assign action to' })
  @IsUUID()
  assignedToId: string;

  @ApiProperty({ description: 'Due date (YYYY-MM-DD)' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Action description' })
  @IsString()
  description: string;
}
