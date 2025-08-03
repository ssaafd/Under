// netlify/functions/get-suno-credits.js
const fetch = require('node-fetch'); // [9, 10]

// En-têtes CORS obligatoires (selon votre diagnostic)
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache les résultats preflight pendant 24 heures
};

exports.handler = async (event, context) => {
    // Réponse immédiate pour les requêtes OPTIONS (pré-vérification du navigateur)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204, // Code 204 pour OPTIONS sans contenu
            headers: corsHeaders,
            body: '',
        };
    }

    if (event.httpMethod!== 'GET') {
        return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
    }

    const SUNO_API_KEY = process.env.SUNO_API_KEY; // [1, 2]
    if (!SUNO_API_KEY) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Clé API Suno non configurée.' }) };
    }

    try {
        const response = await fetch('https://api.sunoapi.org/api/v1/credits', { // S_R19, S_R24, S_R55, S_R56, S_R57
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SUNO_API_KEY}`, // S_R19, S_R24, S_R69, S_R70, S_R71
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Suno Credits API Error:', data);
            return {
                statusCode: response.status,
                headers: corsHeaders, // CRITIQUE : Ajouter ça
                body: JSON.stringify({ message: data.msg |

| 'Erreur de l\'API Suno pour les crédits', details: data }),
            };
        }

        return {
            statusCode: 200,
            headers: corsHeaders, // CRITIQUE : Ajouter ça
            body: JSON.stringify({ creditsRemaining: data.data.creditsRemaining, message: 'Crédits récupérés.' }),
        };

    } catch (error) {
        console.error('Erreur dans get-suno-credits:', error);
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Erreur interne du serveur.', error: error.message }) };
    }
};
