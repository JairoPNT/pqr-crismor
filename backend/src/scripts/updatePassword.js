const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = 'JairoPNT';
    const newPassword = 'P3rro f3o g4to lind*';

    console.log(`Actualizando contraseña para: ${username}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        const user = await prisma.user.update({
            where: { username: username },
            data: { password: hashedPassword }
        });
        console.log(`¡Éxito! Contraseña actualizada para ${user.username}.`);
    } catch (error) {
        console.error('Error al actualizar:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
