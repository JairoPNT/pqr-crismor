const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.findMany({
            select: { username: true, role: true }
        });
        console.log('Usuarios en la base de datos:');
        console.table(users);
    } catch (error) {
        console.error('Error al consultar usuarios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

check();
