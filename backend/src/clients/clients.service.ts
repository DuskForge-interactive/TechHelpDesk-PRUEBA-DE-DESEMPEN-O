import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createForUser(dto: CreateClientDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const exists = await this.clientRepo.findOne({
      where: { userId: dto.userId },
    });

    if (exists) {
      throw new BadRequestException('Client profile already exists');
    }

    const client = this.clientRepo.create({
      userId: user.id,
      user,
      company: dto.company ?? null,
      contactEmail: dto.contactEmail ?? user.email,
    });

    return this.clientRepo.save(client);
  }

  findAll() {
    return this.clientRepo.find({
      relations: ['user'],
    });
  }

  async findByUserId(userId: string) {
    const client = await this.clientRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    return client;
  }
}
