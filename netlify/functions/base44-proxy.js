// netlify/functions/base44-proxy.js
const fetch = require('node-fetch');

// En-têtes CORS communs pour toutes les fonctions
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Permet à toutes les origines (pour le développement)
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event, context) => {
    // Gère la requête OPTIONS (preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '',
        };
    }

    if (event.httpMethod!== 'GET') {
        return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
    }

    const BASE44_APP_ID = process.env.BASE44_APP_ID; // [2]
    const BASE44_API_KEY = process.env.BASE44_API_KEY; // [2, 3]

    if (!BASE44_APP_ID ||!BASE44_API_KEY) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Clés API Base44 non configurées.' }) };
    }

    const trackId = event.queryStringParameters.trackId;
    if (!trackId) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Track ID est requis.' }) };
    }

    // L'URL de l'API Base44 pour récupérer une entité "Track" [2]
    const BASE44_API_URL = `https://base44.app/api/apps/${BASE44_APP_ID}/entities/Track/${trackId}`;

    try {
        const response = await fetch[2, 3];

        const data = await response.json();

        if (!response.ok) {
            console.error('Base44 API Error:', data);
            return {
                statusCode: response.status,
                headers: corsHeaders,
                body: JSON.stringify({ message: data.message |

| 'Erreur de l\'API Base44', details: data }),
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error('Erreur dans base44-proxy:', error);
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Erreur interne du serveur.', error: error.message }) };
    }
};
