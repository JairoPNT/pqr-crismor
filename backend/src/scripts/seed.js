const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        const userCount = await prisma.user.count();

        if (userCount > 0) {
            console.log('Los usuarios ya han sido inicializados.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const superAdminPassword = await bcrypt.hash('jairo123', salt);
        const gestorPassword = await bcrypt.hash('cristhel123', salt);

        await prisma.user.createMany({
            data: [
                { username: 'Jairo Pinto', password: superAdminPassword, role: 'SUPERADMIN' },
                { username: 'Cristhel Moreno', password: gestorPassword, role: 'GESTOR' },
            ],
        });

        console.log('Usuarios inicializados correctamente (Jairo Pinto / Cristhel Moreno)');
    } catch (error) {
        console.error('Error al inicializar usuarios:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
