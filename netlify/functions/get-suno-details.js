// netlify/functions/get-suno-details.js
// In a real application, this would query your persistent database.
// For this example, we're importing the in-memory store from suno-callback.js.
// This is a hack and will not work reliably across cold starts.
const { getTaskResult } = require('./suno-callback'); // S_R1, S_R2, S_R3

// En-têtes CORS obligatoires (selon votre diagnostic)
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, User-Agent',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const taskId = event.queryStringParameters.taskId;
    if (!taskId) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Task ID is required.' }) };
    }

    // Simule la récupération depuis une base de données.
    // Dans un scénario réel, vous interrogeriez votre base de données réelle ici.
    // Exemple: const result = await db.collection('sunoTasks').findOne({ taskId: taskId });
    const result = getTaskResult(taskId); // Cela ne fonctionnera que si suno-callback a été invoqué récemment et est toujours "chaud".

    if (result) {
        return {
            statusCode: 200,
            headers: corsHeaders, // CRITIQUE : Ajouter ça
            body: JSON.stringify(result),
        };
    } else {
        return {
            statusCode: 404,
            headers: corsHeaders, // CRITIQUE : Ajouter ça
            body: JSON.stringify({ message: 'Task not found or not yet completed.', callbackType: 'pending', msg: 'En cours...' }),
        };
    }
};
