const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    try {
        console.log('Borrando datos de prueba...');

        // Delete in order due to foreign key constraints
        await prisma.media.deleteMany({});
        await prisma.followUp.deleteMany({});
        await prisma.ticket.deleteMany({});

        console.log('¡Datos borrados con éxito!');
    } catch (error) {
        console.error('Error al borrar datos:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
