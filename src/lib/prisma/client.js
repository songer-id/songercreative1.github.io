/**
 * POS BY SONGER CREATIVE - PRISMA CLIENT SINGLETON INSTANCE
 * Location: D:\pos-songer-creative\src\lib\prisma\client.js
 */

const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error', 'warn']
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
