import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ example: 'Computador no enciende' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'El equipo del puesto 7 no enciende y hace un ruido extraño al darle power.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    enum: TicketPriority,
    example: TicketPriority.HIGH,
  })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiProperty({
    example: 1,
    description: 'ID de la categoría del problema',
  })
  @IsInt()
  @Min(1)
  categoryId: number;
}
