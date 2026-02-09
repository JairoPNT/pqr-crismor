const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seed() {
    try {
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('skinhealth123', salt);

        await prisma.user.upsert({
            where: { authCode: 'SKN0001' },
            update: {},
            create: {
                username: 'SkinHealth',
                name: 'Carlos Fiallo',
                password: password,
                role: 'ENTIDAD',
                authCode: 'SKN0001'
            }
        });

        console.log('Usuario de ENTIDAD (SkinHealth) creado/actualizado correctamente con código SKN0001');
    } catch (error) {
        console.error('Error al crear usuario de entidad:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
