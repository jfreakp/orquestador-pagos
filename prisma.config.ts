import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('libs', 'prisma', 'src', 'schema.prisma'),
  migrations: {
    path: path.join('libs', 'prisma', 'src', 'migrations'),
    seed: 'ts-node libs/prisma/src/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
