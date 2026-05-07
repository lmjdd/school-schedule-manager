import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create new PrismaClient, replacing any stale cached version
const freshClient = new PrismaClient({
  log: ['query'],
})

export const db = freshClient

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = freshClient
}
