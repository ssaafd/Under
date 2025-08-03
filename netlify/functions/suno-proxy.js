// netlify/functions/suno-proxy.js
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

    if (event.httpMethod!== 'POST') {
        return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ message: 'Méthode non autorisée.' }) };
    }

    const SUNO_API_KEY = process.env.SUNO_API_KEY; // [2, 3]
    if (!SUNO_API_KEY) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Clé API Suno non configurée sur Netlify.' }) };
    }

    // L'URL de votre site Netlify pour le callback
    const siteUrl = process.env.URL |

| 'https://undergroundstudioapp.netlify.app'; // [3]
    const callbackUrl = `${siteUrl}/.netlify/functions/suno-callback`; //

    try {
        const requestBody = JSON.parse(event.body);

        // Logique pour la génération de musique
        if (requestBody.prompt &&!requestBody.lyricsPrompt) { //
            const { prompt, style, title, customMode, instrumental, model, negativeTags } = requestBody;

            // Validations des paramètres selon la documentation Sunoapi.org
            if (!customMode && prompt.length > 400) {
                return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Le prompt en mode non personnalisé ne doit pas dépasser 400 caractères.' }) };
            }
            if (customMode) {
                if (!instrumental &&!prompt) {
                    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Le prompt est requis en mode personnalisé si non instrumental.' }) };
                }
                if (!style ||!title) {
                    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Le style et le titre sont requis en mode personnalisé.' }) };
                }
                if (model === 'V3_5' |

| model === 'V4') {
                    if (prompt.length > 3000) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Le prompt pour V3_5/V4 ne doit pas dépasser 3000 caractères.' }) };
                    if (style.length > 200) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Le style pour V3_5/V4 ne doit pas dépasser 200 caractères.' }) };
                } else if (model === 'V4_5') {
                    if (prompt.length > 5000) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Le prompt pour V4_5 ne doit pas dépasser 5000 caractères.' }) };
                    if (style.length > 1000) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Le style pour V4_5 ne doit pas dépasser 1000 caractères.' }) };
                }
                if (title.length > 80) return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Le titre ne doit pas dépasser 80 caractères.' }) };
            }

            const sunoPayload = {
                prompt,
                customMode,
                instrumental,
                model,
                callBackUrl: callbackUrl, // L'API Sunoapi.org enverra les résultats ici
            };

            if (customMode) {
                sunoPayload.style = style;
                sunoPayload.title = title;
            }
            if (negativeTags) {
                sunoPayload.negativeTags = negativeTags;
            }

            console.log('Envoi à Suno API:', JSON.stringify(sunoPayload, null, 2));

            const response = await fetch('https://api.sunoapi.org/api/v1/generate', { //
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUNO_API_KEY}`, //
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sunoPayload),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Erreur Suno API (génération musique):', data);
                return {
                    statusCode: response.status,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: data.msg |

| 'Erreur de l\'API Suno', details: data }),
                };
            }

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ taskId: data.data.taskId, message: 'Génération musicale lancée.' }),
            };
        }
        // Logique pour la génération de paroles (si l'API Sunoapi.org a un endpoint dédié)
        else if (requestBody.lyricsPrompt) { //
            const { lyricsPrompt } = requestBody;
            const sunoPayload = {
                theme: lyricsPrompt,
            };

            const response = await fetch('https://api.sunoapi.org/api/v1/lyrics', { // Endpoint hypothétique pour les paroles
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${SUNO_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sunoPayload),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('Erreur Suno API (génération paroles):', data);
                return {
                    statusCode: response.status,
                    headers: corsHeaders,
                    body: JSON.stringify({ message: data.msg |

| 'Erreur de l\'API Suno pour les paroles', details: data }),
                };
            }

            // Si l'API paroles renvoie les paroles directement, les renvoyer. Sinon, renvoyer le taskId.
            if (data.data && data.data.lyricsData && data.data.lyricsData.length > 0) {
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({ taskId: data.data.taskId, lyrics: data.data.lyricsData.text, message: 'Paroles générées.' }),
                };
            } else {
                return {
                    statusCode: 200,
                    headers: corsHeaders,
                    body: JSON.stringify({ taskId: data.data.taskId, message: 'Génération de paroles lancée.' }),
                };
            }
        }
        else {
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: 'Requête invalide: prompt ou lyricsPrompt manquant.' }) };
        }

    } catch (error) {
        console.error('Erreur dans suno-proxy:', error);
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: 'Erreur interne du serveur.', error: error.message }) };
    }
};
