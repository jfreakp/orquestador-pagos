import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const gateways = [
    { code: 'AHORITA', name: 'Ahorita / Banco de Loja' },
    { code: 'DEUNA', name: 'Deuna' },
    { code: 'PLACETOPAY', name: 'PlaceToPay' },
  ];
  for (const gateway of gateways) {
    await prisma.gateway.upsert({
      where: { code: gateway.code },
      update: {},
      create: gateway,
    });
  }

  const channels = [
    { code: 'WEB', name: 'Web' },
    { code: 'OFICINA', name: 'Oficina' },
    { code: 'APP', name: 'App móvil' },
  ];
  for (const channel of channels) {
    await prisma.channel.upsert({
      where: { code: channel.code },
      update: {},
      create: channel,
    });
  }

  const transactionStatuses = [
    { code: 'PENDING', name: 'Pendiente' },
    { code: 'APPROVED', name: 'Aprobada' },
    { code: 'REJECTED', name: 'Rechazada' },
    { code: 'ERROR', name: 'Error' },
    { code: 'REVERSED', name: 'Reversada' },
    { code: 'EXPIRED', name: 'Expirada' },
  ];
  for (const status of transactionStatuses) {
    await prisma.transactionStatus.upsert({
      where: { code: status.code },
      update: {},
      create: status,
    });
  }

  const gatewayOperationTypes = [
    { code: 'CREATE_PAYMENT', name: 'Crear pago' },
    { code: 'QUERY_STATUS', name: 'Consultar estado' },
    { code: 'REFUND', name: 'Reembolso' },
    { code: 'AUTHORIZE_ACCESS', name: 'Autorizar acceso' },
    { code: 'REFRESH_TOKEN', name: 'Refrescar token' },
    { code: 'REVOKE_TOKEN', name: 'Revocar token' },
    { code: 'GENERATE_PAYMENT_LINK', name: 'Generar link de cobro' },
    {
      code: 'PAYMENT_WEBHOOK_NOTIFICATION',
      name: 'Notificación webhook de pago',
    },
  ];
  for (const operationType of gatewayOperationTypes) {
    await prisma.gatewayOperationType.upsert({
      where: { code: operationType.code },
      update: {},
      create: operationType,
    });
  }

  const errorCategories = [
    { code: 'COMMUNICATION', name: 'Comunicación' },
    { code: 'BUSINESS', name: 'Negocio' },
    { code: 'INTERNAL', name: 'Interno' },
    { code: 'AUTH', name: 'Autenticación' },
  ];
  for (const category of errorCategories) {
    await prisma.errorCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
