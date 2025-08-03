// netlify/functions/base44-proxy.js
const fetch = require('node-fetch');

// En-têtes CORS communs pour toutes les fonctions
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Permet à toutes les origines (pour le développement)
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // Cache les résultats preflight pendant 24 heures
};

exports.handler = async (event, context) => {
    // Gère la requête OPTIONS (preflight) pour CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: '', // Corps vide pour les requêtes OPTIONS
        };
    }

    // Assurez-vous que la méthode est GET pour cette fonction
    if (event.httpMethod!== 'GET') {
        return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ message: 'Méthode non autorisée. Seules les requêtes GET sont acceptées.' }) };
    }

    const BASE44_APP_ID = process.env.BASE44_APP_ID; // [3]
    const BASE44_API_KEY = process.env.BASE44_API_KEY; // [3, 5]

    if (!BASE44_APP_ID ||!BASE44_API_KEY) {
        console.error('Erreur de configuration: Clés API Base44 non définies.');
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Erreur de configuration du serveur: Clés API Base44 manquantes.' }) };
    }

    const trackId = event.queryStringParameters.trackId;
    if (!trackId) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Track ID est requis pour la récupération Base44.' }) };
    }

    // L'URL de l'API Base44 pour récupérer une entité "Track"
    // Note: Base44.app est une plateforme de création d'applications/gestion d'entités, pas un hébergeur de fichiers audio.
    // L'entité 'Track' et son champ 'audio_url' doivent exister dans votre configuration Base44.
    const BASE44_API_URL = `https://base44.app/api/apps/${BASE44_APP_ID}/entities/Track/${trackId}`; // [3]

    try {
        console.log(`Tentative de récupération de Base44: ${BASE44_API_URL}`);
        const response = await fetch[3, 4];

        const data = await response.json();
        console.log('Réponse de Base44 API:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('Erreur de l\'API Base44:', data);
            return {
                statusCode: response.status,
                headers: corsHeaders,
                body: JSON.stringify({ message: data.message |

| 'Erreur de l\'API Base44', details: data }),
            };
        }

        // Vérifiez si l'URL audio est présente dans la réponse de Base44
        if (!data.audio_url) { // Assurez-vous que votre entité 'Track' dans Base44 a bien un champ 'audio_url'
            console.warn(`Avertissement: L'entité Base44 pour Track ID ${trackId} ne contient pas de champ 'audio_url'.`);
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(data), // Renvoie les données complètes de l'entité Base44
        };

    } catch (error) {
        console.error('Erreur dans base44-proxy:', error);
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Erreur interne du serveur.', error: error.message }) };
    }
};
