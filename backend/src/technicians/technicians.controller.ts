import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TechniciansService } from './technicians.service';
import { CreateTechnicianDto } from './dto/create-technician.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('technicians')
@ApiBearerAuth()
@Controller('technicians')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TechniciansController {
  constructor(
    private readonly techniciansService: TechniciansService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateTechnicianDto) {
    return this.techniciansService.createForUser(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.techniciansService.findAll();
  }

  @Get('me')
  @Roles(UserRole.TECHNICIAN)
  getMe(@CurrentUser() user: any) {
    return this.techniciansService.findByUserId(user.id);
  }
}
