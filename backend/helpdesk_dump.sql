-- TechHelpDesk base schema + seed
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS helpdesk;

CREATE TYPE helpdesk.user_role AS ENUM ('ADMIN', 'TECHNICIAN', 'CLIENT');
CREATE TYPE helpdesk.ticket_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE helpdesk.ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE helpdesk.technician_availability AS ENUM ('AVAILABLE', 'BUSY', 'OFF');

CREATE TABLE IF NOT EXISTS helpdesk.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role helpdesk.user_role NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS helpdesk.categories (
  id serial PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE IF NOT EXISTS helpdesk.clients (
  user_id uuid PRIMARY KEY REFERENCES helpdesk.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text NULL,
  contact_email text NOT NULL,
  CONSTRAINT clients_user_unique UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS helpdesk.technicians (
  user_id uuid PRIMARY KEY REFERENCES helpdesk.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  specialty text NOT NULL,
  availability helpdesk.technician_availability NOT NULL DEFAULT 'AVAILABLE'
);

CREATE TABLE IF NOT EXISTS helpdesk.tickets (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  status helpdesk.ticket_status NOT NULL DEFAULT 'OPEN',
  priority helpdesk.ticket_priority NOT NULL DEFAULT 'MEDIUM',
  client_id uuid NOT NULL REFERENCES helpdesk.clients(user_id) ON DELETE CASCADE,
  technician_id uuid NULL REFERENCES helpdesk.technicians(user_id) ON DELETE SET NULL,
  category_id integer NOT NULL REFERENCES helpdesk.categories(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sample data
INSERT INTO helpdesk.users (id, name, email, password_hash, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin', 'admin@helpdesk.test', '$2b$10$LPd8kx1j.z8V3xofO0lzu.Np9B0w.zAV/QXpVZl8vGeOawx2UY8ue', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO helpdesk.users (id, name, email, password_hash, role)
VALUES
  ('00000000-0000-0000-0000-000000000002', 'Client One', 'client@helpdesk.test', '$2b$10$LPd8kx1j.z8V3xofO0lzu.Np9B0w.zAV/QXpVZl8vGeOawx2UY8ue', 'CLIENT'),
  ('00000000-0000-0000-0000-000000000003', 'Tech One', 'tech@helpdesk.test', '$2b$10$LPd8kx1j.z8V3xofO0lzu.Np9B0w.zAV/QXpVZl8vGeOawx2UY8ue', 'TECHNICIAN')
ON CONFLICT (id) DO NOTHING;

INSERT INTO helpdesk.categories (id, name) VALUES (1, 'Hardware'), (2, 'Software')
ON CONFLICT (id) DO NOTHING;

INSERT INTO helpdesk.clients (user_id, name, company, contact_email)
VALUES ('00000000-0000-0000-0000-000000000002', 'Client One', 'Tech Corp', 'client@helpdesk.test')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO helpdesk.technicians (user_id, name, specialty, availability)
VALUES ('00000000-0000-0000-0000-000000000003', 'Tech One', 'Hardware', 'AVAILABLE')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO helpdesk.tickets (title, description, status, priority, client_id, technician_id, category_id)
VALUES
  ('Equipo no enciende', 'El equipo del puesto 7 no inicia.', 'OPEN', 'HIGH', '00000000-0000-0000-0000-000000000002', NULL, 1),
  ('Error en sistema', 'Aplicación se cierra inesperadamente.', 'IN_PROGRESS', 'MEDIUM', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 2)
ON CONFLICT DO NOTHING;
