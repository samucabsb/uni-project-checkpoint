import { PrismaClient } from '@prisma/client';

// Instância global do Prisma — reutilizada em toda a aplicação
export const prisma = new PrismaClient();
