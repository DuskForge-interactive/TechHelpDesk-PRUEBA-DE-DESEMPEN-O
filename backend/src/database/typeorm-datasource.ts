import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  schema: 'helpdesk',
  synchronize: false,
  logging: false,
  entities: [__dirname + '/..*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  ssl: {
    rejectUnauthorized: false,
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

