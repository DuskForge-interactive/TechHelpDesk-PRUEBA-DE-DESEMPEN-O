import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TechnicianAvailability } from '../entities/technician.entity';

export class CreateTechnicianDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'John Tech' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Hardware' })
  @IsString()
  specialty: string;

  @ApiPropertyOptional({ enum: TechnicianAvailability })
  @IsOptional()
  @IsEnum(TechnicianAvailability)
  availability?: TechnicianAvailability;
}
