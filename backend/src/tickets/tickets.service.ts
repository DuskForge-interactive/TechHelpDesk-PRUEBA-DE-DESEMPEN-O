import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority } from './entities/ticket.entity';
import { Client } from '../clients/entities/client.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Technician)
    private readonly techRepo: Repository<Technician>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  // 1) Crear ticket como CLIENTE
  async createForClient(userId: string, dto: CreateTicketDto) {
    const client = await this.clientRepo.findOne({
      where: { userId },
    });

    if (!client) {
      throw new BadRequestException(
        'El usuario actual no tiene perfil de cliente',
      );
    }

    const category = await this.categoryRepo.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException('La categoría no existe');
    }

    const ticket = this.ticketRepo.create({
      title: dto.title,
      description: dto.description,
      priority: dto.priority ?? TicketPriority.MEDIUM,
      client,
      category,
      status: TicketStatus.OPEN,
    });

    return this.ticketRepo.save(ticket);
  }

  // 2) Asignar ticket a técnico (ADMIN)
  async assignToTechnician(ticketId: number, dto: AssignTicketDto) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['technician'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const technician = await this.techRepo.findOne({
      where: { userId: dto.technicianUserId },
    });

    if (!technician) {
      throw new BadRequestException('El técnico no existe');
    }

    // Regla: técnico no puede tener más de 5 tickets EN_PROGRESO
    const inProgressCount = await this.ticketRepo
      .createQueryBuilder('t')
      .innerJoin('t.technician', 'tech')
      .where('tech.user_id = :userId', { userId: technician.userId })
      .andWhere('t.status = :status', { status: TicketStatus.IN_PROGRESS })
      .getCount();

    if (inProgressCount >= 5) {
      throw new BadRequestException(
        'Este técnico ya tiene 5 tickets en progreso',
      );
    }

    ticket.technician = technician;

    // si está OPEN, podrías cambiarlo a IN_PROGRESS automáticamente si quieres
    return this.ticketRepo.save(ticket);
  }

  // 3) Cambiar estado del ticket (técnico/admin)
  async updateStatus(
    ticketId: number,
    dto: UpdateTicketStatusDto,
    currentUser: { id: string; role: UserRole },
  ) {
    const ticket = await this.ticketRepo.findOne({
      where: { id: ticketId },
      relations: ['technician'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    // Sólo el técnico asignado o el admin pueden cambiar estado
    if (currentUser.role === UserRole.TECHNICIAN) {
      if (!ticket.technician || ticket.technician.userId !== currentUser.id) {
        throw new ForbiddenException(
          'No puedes cambiar el estado de un ticket que no está asignado a ti',
        );
      }
    } else if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Sólo técnicos asignados o administradores pueden cambiar el estado',
      );
    }

    this.ensureValidTransition(ticket.status, dto.status);

    ticket.status = dto.status;
    return this.ticketRepo.save(ticket);
  }

  private ensureValidTransition(
    current: TicketStatus,
    next: TicketStatus,
  ): void {
    const transitions: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED],
      [TicketStatus.RESOLVED]: [TicketStatus.CLOSED],
      [TicketStatus.CLOSED]: [],
    };

    const allowed = transitions[current] ?? [];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transición inválida de ${current} a ${next}`,
      );
    }
  }

  // 4) Listar tickets según rol
  async findAllForUser(
    currentUser: { id: string; role: UserRole },
    filters: FilterTicketsDto,
  ) {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.client', 'client')
      .leftJoinAndSelect('t.technician', 'tech')
      .leftJoinAndSelect('t.category', 'category');

    if (filters.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      qb.andWhere('t.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (currentUser.role === UserRole.CLIENT) {
      qb.andWhere('client.user_id = :userId', { userId: currentUser.id });
    } else if (currentUser.role === UserRole.TECHNICIAN) {
      qb.andWhere('tech.user_id = :userId', { userId: currentUser.id });
    } else {
      // ADMIN ve todo, sin filtro extra
    }

    return qb.orderBy('t.created_at', 'DESC').getMany();
  }

  async findOneForUser(
    id: number,
    currentUser: { id: string; role: UserRole },
  ) {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['client', 'technician'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (currentUser.role === UserRole.CLIENT) {
      if (ticket.client.userId !== currentUser.id) {
        throw new ForbiddenException('No puedes ver este ticket');
      }
    }

    if (currentUser.role === UserRole.TECHNICIAN) {
      if (!ticket.technician || ticket.technician.userId !== currentUser.id) {
        throw new ForbiddenException('No puedes ver este ticket');
      }
    }

    return ticket;
  }

  async findByClientUserId(
    clientUserId: string,
    filters: FilterTicketsDto = {} as FilterTicketsDto,
  ): Promise<Ticket[]> {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.client', 'client')
      .leftJoinAndSelect('t.technician', 'tech')
      .leftJoinAndSelect('t.category', 'category')
      .where('client.user_id = :userId', { userId: clientUserId });

    if (filters.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      qb.andWhere('t.priority = :priority', { priority: filters.priority });
    }

    return qb.orderBy('t.created_at', 'DESC').getMany();
  }

  async findByTechnicianUserId(
    technicianUserId: string,
    filters: FilterTicketsDto = {} as FilterTicketsDto,
  ): Promise<Ticket[]> {
    const qb = this.ticketRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.client', 'client')
      .leftJoinAndSelect('t.technician', 'tech')
      .leftJoinAndSelect('t.category', 'category')
      .where('tech.user_id = :userId', { userId: technicianUserId });

    if (filters.status) {
      qb.andWhere('t.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      qb.andWhere('t.priority = :priority', { priority: filters.priority });
    }

    return qb.orderBy('t.created_at', 'DESC').getMany();
  }
}
