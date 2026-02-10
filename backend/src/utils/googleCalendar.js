const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URI para facilitar obtención de token
);

const getCalendarClient = () => {
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!refreshToken) {
        console.warn('Google Calendar Refresh Token not configured.');
        return null;
    }

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return google.calendar({ version: 'v3', auth: oauth2Client });
};

const getCalendarIds = (customId) => {
    if (!customId) {
        return [
            { id: process.env.GOOGLE_CALENDAR_ID || 'primary' },
            { id: process.env.GOOGLE_SECONDARY_CALENDAR_ID }
        ].filter(c => c.id);
    }

    if (Array.isArray(customId)) {
        return customId.map(id => ({ id }));
    }

    if (typeof customId === 'string' && customId.includes(',')) {
        return customId.split(',').map(id => ({ id: id.trim() }));
    }

    return [{ id: customId }];
};

const checkAvailability = async (startTime, endTime, customCalendarId = null) => {
    const calendar = getCalendarClient();
    if (!calendar) return { available: false, error: 'Configuración de calendario pendiente' };

    const calendarIds = getCalendarIds(customCalendarId);

    try {
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: new Date(startTime).toISOString(),
                timeMax: new Date(endTime).toISOString(),
                items: calendarIds
            }
        });

        const calendars = response.data.calendars;
        let busySlots = [];
        calendarIds.forEach(cal => {
            if (calendars[cal.id]) {
                busySlots = [...busySlots, ...calendars[cal.id].busy];
            }
        });

        return { available: busySlots.length === 0 };
    } catch (error) {
        console.error('Error checking Google Calendar availability:', error.message);
        return { available: false, error: error.message };
    }
};

const createCalendarEvent = async (training, customCalendarId = null) => {
    const calendar = getCalendarClient();
    if (!calendar) return null;

    try {
        const event = {
            summary: `Capacitación: ${training.description || 'Sin descripción'}`,
            description: `Capacitación reservada por Entidad. ID: ${training.id}`,
            start: { dateTime: new Date(training.startTime).toISOString() },
            end: { dateTime: new Date(training.endTime).toISOString() },
        };

        const response = await calendar.events.insert({
            calendarId: getCalendarIds(customCalendarId)[0].id,
            requestBody: event
        });

        return response.data.id;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error.message);
        return null;
    }
};

const getBusySlots = async (start, end, customCalendarId = null) => {
    const calendar = getCalendarClient();
    if (!calendar) return [];

    const calendarIds = getCalendarIds(customCalendarId);

    try {
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: new Date(start).toISOString(),
                timeMax: new Date(end).toISOString(),
                items: calendarIds
            }
        });

        const calendars = response.data.calendars;
        let busy = [];
        calendarIds.forEach(cal => {
            if (calendars[cal.id]) {
                busy = [...busy, ...calendars[cal.id].busy];
            }
        });

        return busy;
    } catch (error) {
        console.error('Error fetching busy slots:', error.message);
        return [];
    }
};

const getAvailableSlots = async (dateStr, durationHours, customCalendarId = null) => {
    const calendar = getCalendarClient();
    if (!calendar) return [];

    const workStart = new Date(`${dateStr}T08:00:00-05:00`);
    const workEnd = new Date(`${dateStr}T18:00:00-05:00`);

    const calendarIds = getCalendarIds(customCalendarId);
    console.log(`DEBUG: Buscando slots para ${dateStr}, IDs:`, JSON.stringify(calendarIds));

    try {
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: workStart.toISOString(),
                timeMax: workEnd.toISOString(),
                items: calendarIds
            }
        });

        const calendars = response.data.calendars;
        let busy = [];
        calendarIds.forEach(cal => {
            if (calendars[cal.id]) {
                busy = [...busy, ...calendars[cal.id].busy];
            }
        });

        console.log(`DEBUG: Bloques ocupados encontrados:`, busy.length, JSON.stringify(busy));

        const slots = [];
        let current = new Date(workStart);

        while (current.getTime() + durationHours * 3600000 <= workEnd.getTime()) {
            const slotStart = new Date(current);
            const slotEnd = new Date(current.getTime() + durationHours * 3600000);

            const isBusy = busy.some(b => {
                const bStart = new Date(b.start);
                const bEnd = new Date(b.end);
                return (slotStart < bEnd && slotEnd > bStart);
            });

            if (!isBusy) {
                const hours = slotStart.getUTCHours() - 5;
                const displayHours = hours < 0 ? hours + 24 : hours;
                const ampm = displayHours >= 12 ? 'PM' : 'AM';
                const h12 = displayHours % 12 || 12;
                const m = String(slotStart.getUTCMinutes()).padStart(2, '0');

                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString(),
                    label: `${h12}:${m} ${ampm}`
                });
            }

            current.setHours(current.getHours() + 1);
            current.setMinutes(0, 0, 0);
        }

        return slots;
    } catch (error) {
        console.error('Error calculating available slots:', error.message);
        return [];
    }
};

module.exports = { checkAvailability, createCalendarEvent, getBusySlots, getAvailableSlots };
