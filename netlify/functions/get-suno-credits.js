// netlify/functions/get-suno-credits.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod!== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const SUNO_API_KEY = process.env.SUNO_API_KEY;
    if (!SUNO_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ message: 'Clé API Suno non configurée.' }) };
    }

    try {
        const response = await fetch('https://api.sunoapi.org/api/v1/credits', { // Assuming a /credits endpoint
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUNO_API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Suno Credits API Error:', data);
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: data.msg |

| 'Erreur de l\'API Suno pour les crédits', details: data }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ creditsRemaining: data.data.creditsRemaining, message: 'Crédits récupérés.' }),
        };

    } catch (error) {
        console.error('Erreur dans get-suno-credits:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Erreur interne du serveur.', error: error.message }) };
    }
};
