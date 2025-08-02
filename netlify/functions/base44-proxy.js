// netlify/functions/base44-proxy.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod!== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const BASE44_APP_ID = process.env.BASE44_APP_ID;
    const BASE44_API_KEY = process.env.BASE44_API_KEY;

    if (!BASE44_APP_ID ||!BASE44_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Clés API Base44 non configurées.' }) };
    }

    const trackId = event.queryStringParameters.trackId;
    if (!trackId) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Track ID est requis.' }) };
    }

    const BASE44_API_URL = `https://base44.app/api/apps/${BASE44_APP_ID}/entities/Track/${trackId}`;

    try {
        const response = await fetch(BASE44_API_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${BASE44_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Base44 API Error:', data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: data.message |

| 'Erreur de l\'API Base44', details: data }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('Erreur dans base44-proxy:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Erreur interne du serveur.', error: error.message }) };
    }
};
