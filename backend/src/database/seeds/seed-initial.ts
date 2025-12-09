import 'dotenv/config';
import dataSource from '../typeorm-datasource';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { Client } from '../../clients/entities/client.entity';
import {
  Technician,
  TechnicianAvailability,
} from '../../technicians/entities/technician.entity';
import { Category } from '../../categories/entities/category.entity';
import { Ticket, TicketPriority, TicketStatus } from '../../tickets/entities/ticket.entity';
import * as bcrypt from 'bcrypt';

async function runSeed() {
  await dataSource.initialize();
  console.log('✅ DataSource inicializado');

  const userRepo = dataSource.getRepository(User);
  const clientRepo = dataSource.getRepository(Client);
  const technicianRepo = dataSource.getRepository(Technician);
  const categoryRepo = dataSource.getRepository(Category);
  const ticketRepo = dataSource.getRepository(Ticket);

  const adminPasswordHash = await bcrypt.hash('Admin123*', 10);
  const techPasswordHash = await bcrypt.hash('Tech123*', 10);
  const clientPasswordHash = await bcrypt.hash('Client123*', 10);

  let admin = await userRepo.findOne({ where: { email: 'admin@helpdesk.com' } });
  if (!admin) {
    admin = userRepo.create({
      name: 'Admin Principal',
      email: 'admin@helpdesk.com',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepo.save(admin);
    console.log('👑 Admin creado');
  }


  let techUser = await userRepo.findOne({ where: { email: 'tech1@helpdesk.com' } });
  if (!techUser) {
    techUser = userRepo.create({
      name: 'Técnico Soporte 1',
      email: 'tech1@helpdesk.com',
      passwordHash: techPasswordHash,
      role: UserRole.TECHNICIAN,
      isActive: true,
    });
    await userRepo.save(techUser);
    console.log('🛠 Técnico (user) creado');
  }
  if (!techUser) {
    throw new Error('No se pudo crear o recuperar el usuario técnico base');
  }

  let technician = await technicianRepo.findOne({
    where: { user: { id: techUser.id } },
    relations: ['user'],
  });

  if (!technician) {
    technician = await technicianRepo.save(
      technicianRepo.create({
        user: techUser,
        specialty: 'Redes y Servidores',
        availability: TechnicianAvailability.AVAILABLE,
      }),
    );
    console.log('🛠 Técnico (profile) creado');
  }
  if (!technician) {
    throw new Error('No se pudo crear o recuperar el técnico base');
  }


  let clientUser = await userRepo.findOne({ where: { email: 'client1@empresa.com' } });
  if (!clientUser) {
    clientUser = userRepo.create({
      name: 'Cliente Demo',
      email: 'client1@empresa.com',
      passwordHash: clientPasswordHash,
      role: UserRole.CLIENT,
      isActive: true,
    });
    await userRepo.save(clientUser);
    console.log('👤 Cliente (user) creado');
  }
  if (!clientUser) {
    throw new Error('No se pudo crear o recuperar el usuario cliente base');
  }

  let client = await clientRepo.findOne({
    where: { user: { id: clientUser.id } },
    relations: ['user'],
  });

  if (!client) {
    client = await clientRepo.save(
      clientRepo.create({
        user: clientUser,
        company: 'Empresa Demo S.A.S.',
        contactEmail: 'soporte@empresademo.com',
      }),
    );
    console.log('👤 Cliente (profile) creado');
  }
  if (!client) {
    throw new Error('No se pudo crear o recuperar el cliente base');
  }


  const categoriesData = [
    { name: 'Hardware', description: 'Problemas de equipos físicos' },
    { name: 'Software', description: 'Errores de aplicaciones o sistema operativo' },
    { name: 'Red', description: 'Conectividad, internet, VPN, etc.' },
  ];

  for (const c of categoriesData) {
    const exists = await categoryRepo.findOne({ where: { name: c.name } });
    if (!exists) {
      await categoryRepo.save(categoryRepo.create(c));
      console.log(`📁 Categoría creada: ${c.name}`);
    }
  }

  const hardwareCategory = await categoryRepo.findOne({ where: { name: 'Hardware' } });


  const existingTicket = await ticketRepo.findOne({
    where: { title: 'Computador no enciende' },
  });

  if (!existingTicket && hardwareCategory && client && technician) {
    const ticket = ticketRepo.create({
      title: 'Computador no enciende',
      description: 'El equipo del puesto 7 no enciende y hace un ruido extraño.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.HIGH,
      client,
      technician,
      category: hardwareCategory,
    });

    await ticketRepo.save(ticket);
    console.log('🎫 Ticket demo creado');
  } else {
    console.log('🎫 Ticket demo ya existía o faltaban datos base');
  }

  await dataSource.destroy();
  console.log('✅ Seed completado');
}

runSeed().catch((err) => {
  console.error('❌ Error en seed:', err);
  dataSource.destroy();
  process.exit(1);
});
