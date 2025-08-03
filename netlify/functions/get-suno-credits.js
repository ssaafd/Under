// netlify/functions/get-suno-credits.js
const fetch = require('node-fetch');

// En-têtes CORS communs pour toutes les fonctions
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Permet à toutes les origines (pour le développement)
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // Cache les résultats preflight pendant 24 heures
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

    const SUNO_API_KEY = process.env.SUNO_API_KEY; // [2, 3]
    if (!SUNO_API_KEY) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Clé API Suno non configurée.' }) };
    }

    try {
        const response = await fetch('https://api.sunoapi.org/api/v1/credits', { //
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUNO_API_KEY}`, //
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Suno Credits API Error:', data);
            return {
                statusCode: response.status,
                headers: corsHeaders,
                body: JSON.stringify({ message: data.msg |

| 'Erreur de l\'API Suno pour les crédits', details: data }),
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ creditsRemaining: data.data.creditsRemaining, message: 'Crédits récupérés.' }),
        };

    } catch (error) {
        console.error('Erreur dans get-suno-credits:', error);
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Erreur interne du serveur.', error: error.message }) };
    }
};
