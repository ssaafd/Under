// netlify/functions/suno-callback.js

// Ceci est un stockage en mémoire simplifié pour la démonstration.
// Dans une application réelle, vous utiliseriez une base de données persistante (ex: FaunaDB, Supabase, MongoDB Atlas).
const taskResults = {}; // Cette variable NE persistera PAS entre les "cold starts" de la fonction.

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

    if (event.httpMethod!== 'POST') {
        return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
    }

    try {
        const callbackData = JSON.parse(event.body);
        const taskId = callbackData.data.task_id; // S_R4, S_R6, S_R18

        console.log(`Received Suno Callback for Task ID: ${taskId}`);
        console.log('Callback Data:', JSON.stringify(callbackData, null, 2));

        // Stocke le résultat (en mémoire pour cet exemple)
        taskResults[taskId] = callbackData; // S_R1, S_R2, S_R4

        // Dans une application réelle, vous mettriez à jour votre base de données ici :
        // Exemple: await db.collection('sunoTasks').updateOne({ taskId: taskId }, { $set: callbackData }, { upsert: true });

        return {
            statusCode: 200,
            headers: corsHeaders, // CRITIQUE : Ajouter ça
            body: JSON.stringify({ status: 'received', message: 'Callback processed' }),
        };
    } catch (error) {
        console.error('Error processing Suno callback:', error);
        return {
            statusCode: 500,
            headers: corsHeaders, // CRITIQUE : Ajouter ça
            body: JSON.stringify({ status: 'error', message: 'Failed to process callback', error: error.message }),
        };
    }
};

// Cette fonction est exportée pour être utilisée par get-suno-details.js.
// C'est une astuce pour la démonstration sans base de données réelle.
// Dans une application réelle, get-suno-details interrogerait la base de données persistante.
exports.getTaskResult = (taskId) => {
    return taskResults[taskId];
};
