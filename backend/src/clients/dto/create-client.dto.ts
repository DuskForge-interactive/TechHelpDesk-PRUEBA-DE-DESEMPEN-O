import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'Jane Client' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Tech Corp' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({ example: 'client@company.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
