import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.createForUser(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.clientsService.findAll();
  }

  @Get('me')
  @Roles(UserRole.CLIENT)
  getMe(@CurrentUser() user: any) {
    return this.clientsService.findByUserId(user.id);
  }
}
