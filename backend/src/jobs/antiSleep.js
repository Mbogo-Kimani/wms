const cron = require('node-cron');
const axios = require('axios');

// Self-ping every 14 minutes to keep Render instance awake
cron.schedule('*/14 * * * *', async () => {
    const url = process.env.API_PING_URL || `http://localhost:${process.env.PORT || 5000}/api/auth/me`;
    console.log(`[Anti-Sleep] Pinging ${url}...`);
    try {
        await axios.get(url, { timeout: 5000 });
        console.log('[Anti-Sleep] Ping successful.');
    } catch (err) {
        // We expect a 401 if unauthorized, which is fine as it confirms the server is up
        console.log(`[Anti-Sleep] Ping received response (Status: ${err.response?.status || err.message})`);
    }
});
