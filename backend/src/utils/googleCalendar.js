const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

const getCalendarClient = () => {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        console.warn('Google Calendar credentials not fully configured.');
        return null;
    }

    const auth = new google.auth.JWT(
        clientEmail,
        null,
        privateKey,
        SCOPES
    );

    return google.calendar({ version: 'v3', auth });
};

const checkAvailability = async (startTime, endTime) => {
    const calendar = getCalendarClient();
    if (!calendar) return { available: false, error: 'Configuración de calendario pendiente' };

    try {
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: new Date(startTime).toISOString(),
                timeMax: new Date(endTime).toISOString(),
                items: [{ id: process.env.GOOGLE_CALENDAR_ID }]
            }
        });

        const busySlots = response.data.calendars[process.env.GOOGLE_CALENDAR_ID].busy;
        return { available: busySlots.length === 0 };
    } catch (error) {
        console.error('Error checking Google Calendar availability:', error.message);
        return { available: false, error: error.message };
    }
};

const createCalendarEvent = async (training) => {
    const calendar = getCalendarClient();
    if (!calendar) return null;

    try {
        const event = {
            summary: `Capacitación: ${training.entityName}`,
            description: `Capacitación reservada por ${training.entityName}`,
            start: { dateTime: new Date(training.startTime).toISOString() },
            end: { dateTime: new Date(training.endTime).toISOString() },
        };

        const response = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            requestBody: event
        });

        return response.data.id;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error.message);
        return null;
    }
};

module.exports = { checkAvailability, createCalendarEvent };
