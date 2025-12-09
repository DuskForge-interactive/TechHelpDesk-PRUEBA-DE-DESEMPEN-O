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

@Entity({ schema: 'helpdesk', name: 'clients' })
export class Client {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  company: string | null;

  @Column({ type: 'text', name: 'contact_email' })
  contactEmail: string;

  @OneToMany(() => Ticket, (ticket) => ticket.client)
  tickets: Ticket[];
}
