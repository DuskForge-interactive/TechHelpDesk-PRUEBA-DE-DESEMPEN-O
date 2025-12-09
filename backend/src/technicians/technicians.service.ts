import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Technician,
  TechnicianAvailability,
} from './entities/technician.entity';
import { User } from '../users/entities/user.entity';
import { CreateTechnicianDto } from './dto/create-technician.dto';

@Injectable()
export class TechniciansService {
  constructor(
    @InjectRepository(Technician)
    private readonly techRepo: Repository<Technician>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createForUser(dto: CreateTechnicianDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const exists = await this.techRepo.findOne({
      where: { userId: dto.userId },
    });

    if (exists) {
      throw new BadRequestException('Technician profile already exists');
    }

    const technician = this.techRepo.create({
      user,
      name: dto.name,
      specialty: dto.specialty,
      availability:
        dto.availability ?? TechnicianAvailability.AVAILABLE,
    });

    return this.techRepo.save(technician);
  }

  findAll() {
    return this.techRepo.find({
      relations: ['user'],
    });
  }

  async findByUserId(userId: string) {
    const tech = await this.techRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!tech) {
      throw new NotFoundException('Technician profile not found');
    }
    return tech;
  }
}
