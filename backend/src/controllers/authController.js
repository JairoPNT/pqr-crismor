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
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                avatar: user.avatar,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

const updateProfile = async (req, res) => {
    const { username, name, email, phone, avatar, password } = req.body;
    try {
        const updateData = { username, name, email, phone, avatar };
        if (password) {
            updateData.password = await hashPassword(password);
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData
        });

        res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            avatar: updatedUser.avatar,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar perfil', error: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
        const users = await prisma.user.findMany({
            select: { id: true, username: true, name: true, role: true, email: true, phone: true, avatar: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, name, email, phone, avatar, role, password } = req.body;

    try {
        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'Solo el administrador puede modificar usuarios' });
        }

        const updateData = { username, name, email, phone, avatar, role };
        if (password) {
            updateData.password = await hashPassword(password);
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: { id: true, username: true, name: true, role: true, email: true, phone: true, avatar: true }
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
    }
};

const seedUsers = async (req, res) => {
    try {
        const userCount = await prisma.user.count();

        if (userCount > 0) {
            return res.status(400).json({ message: 'Los usuarios ya han sido inicializados' });
        }

        const superAdminPassword = await hashPassword('jairo123');
        const gestorPassword = await hashPassword('cristhel123');

        await prisma.user.createMany({
            data: [
                { username: 'Jairo Pinto', password: superAdminPassword, role: 'SUPERADMIN', email: 'jairo@pnt.com' },
                { username: 'Cristhel Moreno', password: gestorPassword, role: 'GESTOR', email: 'cristhel@crismor.com' },
            ],
        });

        res.json({ message: 'Usuarios inicializados correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al inicializar usuarios', error: error.message });
    }
};

const getSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener configuración', error: error.message });
    }
};

const updateSettings = async (req, res) => {
    if (req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }

    try {
        let { logoUrl } = req.body;

        // If a file was uploaded, use its path
        if (req.file) {
            // Convert backslashes to forward slashes for the URL
            logoUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
        }

        if (!logoUrl) {
            return res.status(400).json({ message: 'Se requiere una URL o un archivo de imagen' });
        }

        await prisma.systemSetting.upsert({
            where: { key: 'logoUrl' },
            update: { value: logoUrl },
            create: { key: 'logoUrl', value: logoUrl }
        });

        res.json({ message: 'Configuración actualizada con éxito', logoUrl });
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar configuración', error: error.message });
    }
};

const registerUser = async (req, res) => {
    if (req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({ message: 'Solo el administrador puede crear nuevos usuarios' });
    }

    const { username, name, password, role, phone, email } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son obligatorios' });
    }

    try {
        const existingUser = await prisma.user.findFirst({
            where: { username: { equals: username, mode: 'insensitive' } }
        });

        if (existingUser) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                username,
                name: name || username,
                email,
                password: hashedPassword,
                role: role || 'GESTOR',
                phone
            }
        });

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role,
            email: newUser.email
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    }
};

module.exports = {
    login,
    updateProfile,
    getUsers,
    updateUser,
    seedUsers,
    getSettings,
    updateSettings,
    registerUser
};
