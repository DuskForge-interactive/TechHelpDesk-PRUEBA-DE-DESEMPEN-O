import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';

export enum TechnicianAvailability {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFF = 'OFF',
}

@Entity({ schema: 'helpdesk', name: 'technicians' })
export class Technician {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  specialty: string;

  @Column({
    type: 'enum',
    enum: TechnicianAvailability,
    default: TechnicianAvailability.AVAILABLE,
  })
  availability: TechnicianAvailability;

  @OneToMany(() => Ticket, (ticket) => ticket.technician)
  tickets: Ticket[];
}
