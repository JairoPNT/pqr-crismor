const axios = require('axios');

const triggerN8nWebhook = async (data, type) => {
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        await axios.post(webhookUrl, {
            ...data,
            triggerType: type,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error triggering n8n webhook:', error.message);
    }
};

module.exports = { triggerN8nWebhook };
