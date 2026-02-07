const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

const login = async (req, res) => {
    const usernameParam = req.body.username?.trim();
    const { password } = req.body;

    try {
        const user = await prisma.user.findFirst({
            where: {
                username: {
                    equals: usernameParam,
                    mode: 'insensitive'
                }
            },
        });

        if (user && (await comparePassword(password, user.password))) {
            res.json({
                id: user.id,
                username: user.username,
                role: user.role,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

const seedUsers = async (req, res) => {
    try {
        const userCount = await prisma.user.count();

        if (userCount > 0) {
            return res.status(400).json({ message: 'Los usuarios ya han sido inicializados' });
        }

        const superAdminPassword = await hashPassword('jairo123'); // Default password for now
        const gestorPassword = await hashPassword('cristhel123');

        await prisma.user.createMany({
            data: [
                { username: 'Jairo Pinto', password: superAdminPassword, role: 'SUPERADMIN' },
                { username: 'Cristhel Moreno', password: gestorPassword, role: 'GESTOR' },
            ],
        });

        res.json({ message: 'Usuarios inicializados correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al inicializar usuarios', error: error.message });
    }
};

module.exports = {
    login,
    seedUsers,
};
