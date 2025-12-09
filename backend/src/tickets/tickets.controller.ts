import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // Cliente crea ticket
  @Post()
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Crear un ticket (CLIENT)' })
  @ApiResponse({ status: 201, description: 'Ticket creado correctamente' })
  create(
    @CurrentUser() user: any,
    @Body() dto: CreateTicketDto,
  ) {
    return this.ticketsService.createForClient(user.id, dto);
  }

  // Admin asigna ticket a técnico
  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Asignar ticket a un técnico (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Ticket asignado al técnico' })
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTicketDto,
  ) {
    return this.ticketsService.assignToTechnician(id, dto);
  }

  // Técnico o Admin cambian estado
  @Patch(':id/status')
  @Roles(UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar estado de un ticket' })
  @ApiResponse({ status: 200, description: 'Estado actualizado correctamente' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.updateStatus(id, dto, user);
  }

  // Listado según rol + filtros
  @Get()
  @ApiOperation({ summary: 'Listar tickets visibles para el usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Listado de tickets retornado' })
  findAll(
    @CurrentUser() user: any,
    @Query() filters: FilterTicketsDto,
  ) {
    return this.ticketsService.findAllForUser(user, filters);
  }

  // Detalle del ticket (respetando visibilidad por rol)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un ticket' })
  @ApiResponse({ status: 200, description: 'Detalle del ticket retornado' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.ticketsService.findOneForUser(id, user);
  }

  @Get('client/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar tickets por userId de cliente (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Tickets del cliente retornados' })
  findByClient(
    @Param('id') clientUserId: string,
    @Query() filters: FilterTicketsDto,
  ) {
    return this.ticketsService.findByClientUserId(clientUserId, filters);
  }

  @Get('technician/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar tickets por userId de técnico (ADMIN)' })
  @ApiResponse({
    status: 200,
    description: 'Tickets del técnico retornados',
  })
  findByTechnician(
    @Param('id') technicianUserId: string,
    @Query() filters: FilterTicketsDto,
  ) {
    return this.ticketsService.findByTechnicianUserId(
      technicianUserId,
      filters,
    );
  }
}
