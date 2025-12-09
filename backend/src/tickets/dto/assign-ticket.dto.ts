import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignTicketDto {
  @ApiProperty({
    example: 'b373ab23-1b20-4a6d-b4a6-0ea9c663f4e8',
    description: 'ID del usuario técnico asignado',
  })
  @IsUUID()
  technicianUserId: string;
}
