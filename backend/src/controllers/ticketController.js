const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
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
                status: 'INICIAL',
                isArchived: false,
                revenue: 70000,
                assignedToId: req.user.id, // Initial assignee
                creatorId: req.user.id, // STORE THE CREATOR
                media: {
                    create: req.files ? req.files.map(file => ({ url: file.path })) : [],
                },
            },
            include: { media: true, assignedTo: true },
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
        const { archived } = req.query;
        const where = {};

        // Default to not archived if not specified
        if (archived === 'true') {
            where.isArchived = true;
        } else if (archived === 'false') {
            where.isArchived = false;
        } else {
            where.isArchived = false; // Default behavior
        }

        // If not SUPERADMIN, show tickets where user is assignee OR creator
        if (req.user.role !== 'SUPERADMIN') {
            where.OR = [
                { assignedToId: req.user.id },
                { creatorId: req.user.id }
            ];
        }

        const tickets = await prisma.ticket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { followUps: true, media: true, assignedTo: true },
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
        const ticket = await prisma.ticket.findFirst({
            where: {
                OR: [
                    { id: normalizedId },
                    { id: id.trim().toUpperCase() }
                ]
            },
            include: {
                followUps: { orderBy: { createdAt: 'desc' } },
                media: true,
                assignedTo: { select: { username: true } } // ONLY include the name for privacy
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

const reassignTicket = async (req, res) => {
    const { id } = req.params;
    const { assignedToId } = req.body;

    try {
        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'Solo el administrador puede reasignar tickets' });
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data: { assignedToId: parseInt(assignedToId) },
            include: { assignedTo: true }
        });

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error al reasignar ticket', error: error.message });
    }
};

const addFollowUp = async (req, res) => {
    const { id } = req.params;
    const { content, diagnosis, protocol, bonusInfo, status } = req.body;

    if (!diagnosis) {
        return res.status(400).json({ message: 'El diagnóstico es obligatorio para agregar un seguimiento' });
    }

    try {
        // Check ownership
        const ticket = await prisma.ticket.findUnique({ where: { id } });
        if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

        if (req.user.role !== 'SUPERADMIN' && ticket.assignedToId !== req.user.id) {
            return res.status(403).json({ message: 'No tienes permiso para gestionar este ticket' });
        }

        const followUp = await prisma.followUp.create({
            data: {
                ticketId: id,
                content: content || 'Actualización de seguimiento',
                diagnosis,
                protocol,
                bonusInfo,
                media: {
                    create: req.files ? req.files.map(file => ({
                        url: file.path,
                        ticketId: id // Ensure it also belongs to the ticket
                    })) : [],
                }
            },
        });

        // Update ticket status
        const updatedStatus = status || 'EN_SEGUIMIENTO';
        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: { status: updatedStatus },
        });

        // IF FINALIZADO: Delete associated media files and records
        if (updatedStatus === 'FINALIZADO') {
            try {
                const mediaToDelete = await prisma.media.findMany({
                    where: { ticketId: id }
                });

                for (const item of mediaToDelete) {
                    const filePath = path.resolve(item.url);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Eliminado archivo: ${filePath}`);
                    }
                }

                await prisma.media.deleteMany({
                    where: { ticketId: id }
                });
                console.log(`Registros de media eliminados para el ticket: ${id}`);
            } catch (mediaError) {
                console.error('Error al limpiar media del ticket cerrado:', mediaError);
            }
        }

        triggerN8nWebhook({ ...followUp, ticket: updatedTicket }, 'FOLLOW_UP');

        res.status(201).json(followUp);
    } catch (error) {
        console.error('Add FollowUp Error:', error);
        res.status(500).json({ message: 'Error al agregar seguimiento', error: error.message });
    }
};

const getStats = async (req, res) => {
    const { city, gestorId, status } = req.query;

    try {
        const where = {};
        if (city) where.city = city;
        if (gestorId) where.assignedToId = parseInt(gestorId);
        if (status) {
            if (status === 'PROCESO') {
                where.status = { in: ['INICIADO', 'EN_SEGUIMIENTO'] };
            } else if (status === 'CERRADO') {
                where.status = 'FINALIZADO';
            } else {
                where.status = status;
            }
        }

        const totalTickets = await prisma.ticket.count({ where });
        const resolvedTickets = await prisma.ticket.count({
            where: { ...where, status: 'FINALIZADO' }
        });

        const revenue = await prisma.ticket.aggregate({
            where,
            _sum: { revenue: true }
        });

        const cityStats = await prisma.ticket.groupBy({
            where: { ...where, isArchived: false }, // Only count active for main stats? 
            by: ['city'],
            _count: { _all: true }
        });

        res.json({
            totalTickets,
            resolvedTickets,
            totalRevenue: revenue._sum.revenue || 0,
            cityStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
    }
};

const archiveTicket = async (req, res) => {
    const { id } = req.params;
    const { archived } = req.body; // true to archive, false to restore

    try {
        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'Solo el administrador puede archivar tickets' });
        }

        const ticket = await prisma.ticket.update({
            where: { id },
            data: { isArchived: archived === true },
        });

        res.json({ message: archived ? 'Ticket archivado correctamente' : 'Ticket restaurado correctamente', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar estado de archivo', error: error.message });
    }
};

const deleteTicket = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'Solo el administrador puede eliminar tickets' });
        }

        // 1. Get media to delete files
        const mediaToDelete = await prisma.media.findMany({
            where: { ticketId: id }
        });

        // 2. Delete physical files
        for (const item of mediaToDelete) {
            const filePath = path.resolve(item.url);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Eliminado archivo: ${filePath}`);
                } catch (err) {
                    console.error(`Error al borrar archivo físico: ${filePath}`, err);
                }
            }
        }

        // 3. Delete from database (Relations)
        await prisma.media.deleteMany({ where: { ticketId: id } });
        await prisma.followUp.deleteMany({ where: { ticketId: id } });

        // 4. Delete the Ticket
        await prisma.ticket.delete({ where: { id } });

        res.json({ message: 'Ticket y archivos eliminados correctamente' });
    } catch (error) {
        console.error('Delete Ticket Error:', error);
        res.status(500).json({ message: 'Error al eliminar el ticket', error: error.message });
    }
};

const sendReport = async (req, res) => {
    const { ticketId, email, pdfBase64, patientName } = req.body;

    if (!email || !pdfBase64) {
        return res.status(400).json({ message: 'Email y contenido del reporte son obligatorios' });
    }

    try {
        // Trigger n8n with the PDF data
        await triggerN8nWebhook({
            ticketId,
            email,
            pdfBase64,
            patientName,
            sentBy: req.user.username
        }, 'SEND_REPORT');

        res.json({ message: 'Reporte enviado con éxito' });
    } catch (error) {
        console.error('Send Report Error:', error);
        res.status(500).json({ message: 'Error al enviar el reporte' });
    }
};

module.exports = {
    createTicket,
    getTickets,
    getTicketByPublicId,
    addFollowUp,
    getStats,
    reassignTicket,
    archiveTicket,
    deleteTicket,
    sendReport
};
