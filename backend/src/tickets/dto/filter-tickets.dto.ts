import { IsEnum, IsOptional } from 'class-validator';
import { TicketStatus, TicketPriority } from '../entities/ticket.entity';

export class FilterTicketsDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
