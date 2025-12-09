import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { Ticket, TicketPriority, TicketStatus } from './entities/ticket.entity';
import { Client } from '../clients/entities/client.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { Category } from '../categories/entities/category.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { BadRequestException } from '@nestjs/common';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

type MockRepo<T extends object = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

const createMockRepo = <T extends object = any>(): MockRepo<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketRepo: MockRepo<Ticket>;
  let clientRepo: MockRepo<Client>;
  let techRepo: MockRepo<Technician>;
  let categoryRepo: MockRepo<Category>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: createMockRepo<Ticket>(),
        },
        {
          provide: getRepositoryToken(Client),
          useValue: createMockRepo<Client>(),
        },
        {
          provide: getRepositoryToken(Technician),
          useValue: createMockRepo<Technician>(),
        },
        {
          provide: getRepositoryToken(Category),
          useValue: createMockRepo<Category>(),
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketRepo = module.get(getRepositoryToken(Ticket));
    clientRepo = module.get(getRepositoryToken(Client));
    techRepo = module.get(getRepositoryToken(Technician));
    categoryRepo = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createForClient', () => {
    it('debe crear un ticket cuando el cliente y la categoría existen', async () => {
      const userId = 'uuid-cliente-1';

      const mockClient: Partial<Client> = { userId };
      const mockCategory: Partial<Category> = { id: 1, name: 'Hardware' };

      clientRepo.findOne!.mockResolvedValue(mockClient);
      categoryRepo.findOne!.mockResolvedValue(mockCategory);

      const dto: CreateTicketDto = {
        title: 'PC no enciende',
        description: 'El equipo no responde al botón de encendido',
        priority: TicketPriority.HIGH,
        categoryId: 1,
      };

      const createdTicket: Partial<Ticket> = {
        id: 10,
        title: dto.title,
        description: dto.description,
        priority: dto.priority!,
        status: TicketStatus.OPEN,
        client: mockClient as Client,
        category: mockCategory as Category,
      };

      ticketRepo.create!.mockReturnValue(createdTicket);
      ticketRepo.save!.mockResolvedValue(createdTicket);

      const result = await service.createForClient(userId, dto);

      expect(clientRepo.findOne).toHaveBeenCalledWith({
        where: { userId },
      });

      expect(categoryRepo.findOne).toHaveBeenCalledWith({
        where: { id: dto.categoryId },
      });

      expect(ticketRepo.create).toHaveBeenCalledWith({
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        client: mockClient,
        category: mockCategory,
        status: TicketStatus.OPEN,
      });

      expect(ticketRepo.save).toHaveBeenCalledWith(createdTicket);
      expect(result).toEqual(createdTicket);
    });
  });

  describe('assignToTechnician', () => {
    it('debe lanzar error si el técnico ya tiene 5 tickets en progreso', async () => {
      const ticketId = 1;
      const technicianUserId = 'uuid-tech-1';

      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: TicketStatus.OPEN,
      };
      ticketRepo.findOne!.mockResolvedValue(mockTicket);

      const mockTech: Partial<Technician> = {
        userId: technicianUserId,
      };
      techRepo.findOne!.mockResolvedValue(mockTech);
      const mockQb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      ticketRepo.createQueryBuilder!.mockReturnValue(mockQb);

      const dto: AssignTicketDto = {
        technicianUserId,
      };

      await expect(service.assignToTechnician(ticketId, dto)).rejects.toThrow(
        BadRequestException,
      );

      expect(ticketRepo.findOne).toHaveBeenCalled();
      expect(techRepo.findOne).toHaveBeenCalled();
      expect(mockQb.getCount).toHaveBeenCalled();
      expect(ticketRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('debe permitir cambio OPEN -> IN_PROGRESS por técnico asignado', async () => {
      const ticketId = 1;
      const currentUser = { id: 'tech-123', role: UserRole.TECHNICIAN };

      const mockTech: Partial<Technician> = { userId: currentUser.id };
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: TicketStatus.OPEN,
        technician: mockTech as Technician,
      };

      ticketRepo.findOne!.mockResolvedValue(mockTicket as Ticket);
      ticketRepo.save!.mockImplementation(async (ticket) => ticket);

      const dto: UpdateTicketStatusDto = {
        status: TicketStatus.IN_PROGRESS,
      };

      const result = await service.updateStatus(ticketId, dto, currentUser);

      expect(ticketRepo.findOne).toHaveBeenCalled();
      expect(ticketRepo.save).toHaveBeenCalled();
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('debe lanzar error ante transición inválida OPEN -> RESOLVED', async () => {
      const ticketId = 2;
      const currentUser = { id: 'tech-123', role: UserRole.TECHNICIAN };

      const mockTech: Partial<Technician> = { userId: currentUser.id };
      const mockTicket: Partial<Ticket> = {
        id: ticketId,
        status: TicketStatus.OPEN,
        technician: mockTech as Technician,
      };

      ticketRepo.findOne!.mockResolvedValue(mockTicket as Ticket);

      const dto: UpdateTicketStatusDto = {
        status: TicketStatus.RESOLVED,
      };

      await expect(
        service.updateStatus(ticketId, dto, currentUser),
      ).rejects.toThrow(BadRequestException);

      expect(ticketRepo.save).not.toHaveBeenCalled();
    });
  });
});
