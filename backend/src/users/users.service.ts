import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }

  async findOneById(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) {
      throw new BadRequestException('El correo ya está registrado');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: dto.role,
      isActive: dto.isActive ?? true,
    });
    return this.userRepo.save(user);
  }

  findAll() {
    return this.userRepo.find();
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOneById(id);

    if (dto.email && dto.email !== user.email) {
      const emailTaken = await this.userRepo.findOne({
        where: { email: dto.email },
      });
      if (emailTaken && emailTaken.id !== id) {
        throw new BadRequestException('El correo ya está registrado');
      }
      user.email = dto.email;
    }

    if (dto.name) {
      user.name = dto.name;
    }

    if (dto.role) {
      user.role = dto.role;
    }

    if (typeof dto.isActive === 'boolean') {
      user.isActive = dto.isActive;
    }

    if (dto.password) {
      user.passwordHash = await this.hashPassword(dto.password);
    }

    return this.userRepo.save(user);
  }

  async remove(id: string) {
    const user = await this.findOneById(id);
    await this.userRepo.remove(user);
    return { deleted: true };
  }

  private hashPassword(plain: string) {
    return bcrypt.hash(plain, 10);
  }
}
