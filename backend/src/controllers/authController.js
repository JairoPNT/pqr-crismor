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
    try {
        const body = req.body || {};
        let { username, name, email, phone, avatar, password, newPassword } = body;
        const passToHash = password || newPassword;

        console.log('--- ACTUALIZACIÓN DE PERFIL ---');
        console.log('Cuerpo de la petición:', { ...req.body, password: passToHash ? '******' : undefined });

        if (req.file) {
            console.log('Archivo recibido:', req.file);
            avatar = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (avatar) updateData.avatar = avatar;

        if (passToHash) {
            updateData.password = await hashPassword(passToHash);
        }

        console.log('Datos a actualizar en BD:', { ...updateData, password: updateData.password ? '******' : undefined });

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData
        });

        console.log('Usuario actualizado con éxito');

        res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            avatar: updatedUser.avatar,
            token: generateToken(updatedUser.id) // Retornar nuevo token o el mismo para persistencia
        });
    } catch (error) {
        console.error('ERROR EN UPDATEPROFILE:', error);
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
    try {
        const body = req.body || {};
        let { username, name, email, phone, avatar, role, password, newPassword } = body;
        const passToHash = password || newPassword;

        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'Solo el administrador puede modificar usuarios' });
        }

        if (req.file) {
            avatar = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (avatar) updateData.avatar = avatar;
        if (role) updateData.role = role;

        if (passToHash) {
            updateData.password = await hashPassword(passToHash);
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: { id: true, username: true, name: true, role: true, email: true, phone: true, avatar: true }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error('ERROR EN UPDATEUSER:', error);
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
        let { logoUrl, faviconUrl, horizontalLogoUrl } = req.body;

        // Process files if uploaded via upload.fields
        if (req.files) {
            const getFullUrl = (filePath) => {
                const protocol = req.headers['x-forwarded-proto'] || req.protocol;
                const host = req.get('host');
                // Ensure https for production/easypanel
                const finalProtocol = (host.includes('localhost') || host.includes('127.0.0.1')) ? protocol : 'https';
                return `${finalProtocol}://${host}/${filePath.replace(/\\/g, '/')}`;
            };

            if (req.files['logo'] && req.files['logo'][0]) {
                logoUrl = getFullUrl(req.files['logo'][0].path);
            }
            if (req.files['favicon'] && req.files['favicon'][0]) {
                faviconUrl = getFullUrl(req.files['favicon'][0].path);
            }
            if (req.files['horizontalLogo'] && req.files['horizontalLogo'][0]) {
                horizontalLogoUrl = getFullUrl(req.files['horizontalLogo'][0].path);
            }
        }

        const updates = [];
        if (logoUrl) {
            updates.push(prisma.systemSetting.upsert({
                where: { key: 'logoUrl' },
                update: { value: logoUrl },
                create: { key: 'logoUrl', value: logoUrl }
            }));
        }
        if (faviconUrl) {
            updates.push(prisma.systemSetting.upsert({
                where: { key: 'faviconUrl' },
                update: { value: faviconUrl },
                create: { key: 'faviconUrl', value: faviconUrl }
            }));
        }
        if (horizontalLogoUrl) {
            updates.push(prisma.systemSetting.upsert({
                where: { key: 'horizontalLogoUrl' },
                update: { value: horizontalLogoUrl },
                create: { key: 'horizontalLogoUrl', value: horizontalLogoUrl }
            }));
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        res.json({
            message: 'Configuración actualizada con éxito',
            logoUrl,
            faviconUrl,
            horizontalLogoUrl
        });
    } catch (error) {
        console.error('Error en updateSettings:', error);
        res.status(500).json({ message: 'Error al actualizar configuración', error: error.message });
    }
};

const registerUser = async (req, res) => {
    if (req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({ message: 'Solo el administrador puede crear nuevos usuarios' });
    }

    const { username, name, password, role, phone, email } = req.body;
    let avatar = req.body.avatar;

    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son obligatorios' });
    }

    try {
        if (req.file) {
            avatar = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
        }

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
                avatar,
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

const getActiveManagers = async (req, res) => {
    try {
        const daysAgo180 = new Date();
        daysAgo180.setDate(daysAgo180.getDate() - 180);

        // Buscar usuarios que tengan tickets actualizados en los últimos 180 días
        const activeUsers = await prisma.user.findMany({
            where: {
                role: 'GESTOR',
                tickets: {
                    some: {
                        updatedAt: { gte: daysAgo180 }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                role: true
            },
            take: 5 // Limitar a los 5 más recientes para el Home
        });

        res.json(activeUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener gestores activos', error: error.message });
    }
};

module.exports = {
    login,
    updateProfile,
    getUsers,
    updateUser,
    getActiveManagers,
    seedUsers,
    getSettings,
    updateSettings,
    registerUser
};
