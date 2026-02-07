const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const { triggerN8nWebhook } = require('../utils/n8n');

// Generate unique ticket ID (e.g., PQR1A2B3)
const generateTicketId = () => {
    return `PQR${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
};

const createTicket = async (req, res) => {
    try {
        const { patientName, contactMethod, city, phone, email, description } = req.body;

        // Validation
        if (!patientName || !city || !phone || !description) {
            return res.status(400).json({ message: 'Nombre, ciudad, teléfono y descripción son obligatorios' });
        }

        const ticketId = generateTicketId();

        const ticket = await prisma.ticket.create({
            data: {
                id: ticketId,
                patientName,
                contactMethod,
                city,
                phone,
                email,
                description,
                status: 'INICIADO', // Spanish: INICIADO, EN_SEGUIMIENTO, FINALIZADO
                revenue: 70000,   // Fixed commission
                media: {
                    create: req.files ? req.files.map(file => ({ url: file.path })) : [],
                },
            },
            include: { media: true },
        });

        // Trigger n8n notification
        triggerN8nWebhook(ticket, 'NEW_TICKET');

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create Ticket Error:', error);
        res.status(500).json({ message: 'Error interno al crear el ticket', error: error.message });
    }
};

const getTickets = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            orderBy: { createdAt: 'desc' },
            include: { followUps: true, media: true },
        });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener tickets', error: error.message });
    }
};

const getTicketByPublicId = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID de ticket es requerido' });

    const normalizedId = id.trim().toUpperCase().replace(/-/g, '');

    try {
        // Search for exact match or match without hyphens
        const ticket = await prisma.ticket.findFirst({
            where: {
                OR: [
                    { id: normalizedId },
                    { id: id.trim().toUpperCase() }
                ]
            },
            include: {
                followUps: { orderBy: { createdAt: 'desc' } },
                media: true
            },
        });

        if (!ticket) {
            return res.status(404).json({ message: 'No encontramos ningún caso con ese código. Por favor, verifica el número e intenta de nuevo.' });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error al consultar el ticket', error: error.message });
    }
};

const addFollowUp = async (req, res) => {
    const { id } = req.params;
    const { content, diagnosis, protocol, bonusInfo, status } = req.body;

    if (!diagnosis) {
        return res.status(400).json({ message: 'El diagnóstico es obligatorio para agregar un seguimiento' });
    }

    try {
        const followUp = await prisma.followUp.create({
            data: {
                ticketId: id,
                content: content || 'Actualización de seguimiento',
                diagnosis,
                protocol,
                bonusInfo,
            },
        });

        // Update ticket status (revenue is now fixed at creation)
        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: { status: status || 'EN_SEGUIMIENTO' },
        });

        // Trigger n8n notification for follow-up
        triggerN8nWebhook({ ...followUp, ticket: updatedTicket }, 'FOLLOW_UP');

        res.status(201).json(followUp);
    } catch (error) {
        console.error('Add FollowUp Error:', error);
        res.status(500).json({ message: 'Error al agregar seguimiento', error: error.message });
    }
};

const getStats = async (req, res) => {
    try {
        const totalTickets = await prisma.ticket.count();
        const resolvedTickets = await prisma.ticket.count({ where: { status: 'FINALIZED' } });
        const totalRevenueResult = await prisma.ticket.aggregate({
            _sum: { revenue: true }
        });

        const cityStats = await prisma.ticket.groupBy({
            by: ['city'],
            _count: { _all: true }
        });

        res.json({
            totalTickets,
            resolvedTickets,
            totalRevenue: totalRevenueResult._sum.revenue || 0,
            cityStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

module.exports = {
    createTicket,
    getTickets,
    getTicketByPublicId,
    addFollowUp,
    getStats
};
