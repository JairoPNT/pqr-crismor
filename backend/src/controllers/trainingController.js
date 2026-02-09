const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkAvailability, createCalendarEvent } = require('../utils/googleCalendar');

const getAvailability = async (req, res) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ message: 'Faltan fechas de inicio o fin' });

    try {
        const result = await checkAvailability(start, end);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error consultando disponibilidad', error: error.message });
    }
};

const bookTraining = async (req, res) => {
    const { startTime, endTime, authCode, entityName } = req.body;

    if (!startTime || !endTime || !authCode) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    try {
        // Validar código de autorización
        const user = await prisma.user.findUnique({
            where: { authCode }
        });

        if (!user || user.role !== 'ENTIDAD') {
            return res.status(401).json({ message: 'Código de autorización inválido o no autorizado' });
        }

        // Validar disponibilidad de nuevo para evitar carreras
        const availability = await checkAvailability(startTime, endTime);
        if (!availability.available) {
            return res.status(409).json({ message: 'El horario ya no está disponible' });
        }

        // Crear registro en DB
        const training = await prisma.training.create({
            data: {
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                entityId: user.id
            }
        });

        // Intentar crear evento en Google Calendar
        const calendarEventId = await createCalendarEvent({
            startTime,
            endTime,
            entityName: entityName || user.name || user.username
        });

        if (calendarEventId) {
            await prisma.training.update({
                where: { id: training.id },
                data: { calendarEventId }
            });
        }

        res.status(201).json({
            message: 'Capacitación reservada con éxito',
            training
        });

    } catch (error) {
        console.error('Error booking training:', error);
        res.status(500).json({ message: 'Error al procesar la reserva', error: error.message });
    }
};

const getAllTrainings = async (req, res) => {
    try {
        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'No autorizado' });
        }

        const trainings = await prisma.training.findMany({
            include: { entity: { select: { name: true, username: true } } },
            orderBy: { startTime: 'desc' }
        });
        res.json(trainings);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener capacitaciones', error: error.message });
    }
};

const deleteTraining = async (req, res) => {
    const { id } = req.params;
    try {
        if (req.user.role !== 'SUPERADMIN') {
            return res.status(403).json({ message: 'No autorizado' });
        }

        await prisma.training.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Capacitación eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar capacitación', error: error.message });
    }
};

module.exports = { getAvailability, bookTraining, getAllTrainings, deleteTraining };
