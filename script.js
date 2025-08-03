const consoleEl = document.getElementById('console');
const promptInput = document.getElementById('prompt');
const audio1 = document.getElementById('audio1');
const download1 = document.getElementById('download1');
const creditsDisplay = document.getElementById('credits-display');

// --- Logique de la Console (styles inline pour la lisibilité) ---
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const p = document.createElement('p');
    let color = 'lime'; // Vert par défaut
    if (type === 'info') color = 'cyan';
    else if (type === 'success') color = 'lime';
    else if (type === 'error') color = 'red';
    else if (type === 'warning') color = 'yellow';

    p.style.margin = '0';
    p.style.padding = '2px 0';
    p.style.color = color;
    p.style.wordBreak = 'break-word'; // Empêche le débordement des longues lignes

    const timestampSpan = document.createElement('span');
    timestampSpan.style.color = 'gray';
    timestampSpan.style.marginRight = '5px';
    timestampSpan.textContent = `[${timestamp}]`;
    p.appendChild(timestampSpan);

    const messageSpan = document.createElement('span');
    messageSpan.innerHTML = message; // Utilise innerHTML pour interpréter les balises <a>
    p.appendChild(messageSpan);

    consoleEl.appendChild(p);
    consoleEl.scrollTop = consoleEl.scrollHeight; // Défilement automatique vers le bas // S_R34
}

// --- Interaction API (via Fonctions Netlify) ---
// URL FIXE de votre site Netlify où les fonctions sont déployées.
// C'est CRITIQUE pour résoudre le problème de "Failed to fetch" si votre frontend est sur base44.app
const NETLIFY_FUNCTIONS_BASE_URL = 'https://undergroundstudioapp.netlify.app/.netlify/functions'; // S_R22

async function callNetlifyFunction(endpoint, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'SimpleSunoTestApp/1.0', // Ajouté pour correspondre aux headers CORS du backend
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        log(`REQUÊTE: ${method} à ${NETLIFY_FUNCTIONS_BASE_URL}/${endpoint}`, 'info');
        const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/${endpoint}`, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            log(`ERREUR FONCTION NETLIFY (${response.status}): ${errorData.message |

| response.statusText}`, 'error');
            throw new Error(`Erreur API (${response.status}): ${errorData.message |

| response.statusText}`);
        }
        log(`RÉPONSE: Statut ${response.status} de ${NETLIFY_FUNCTIONS_BASE_URL}/${endpoint}`, 'info');
        return await response.json();
    } catch (error) {
        log(`ERREUR RÉSEAU/FONCTION: ${error.message}`, 'error');
        throw error;
    }
}

async function generateMusic() {
    const prompt = promptInput.value;
    if (!prompt) {
        log("ERREUR: Le prompt est requis pour générer de la musique.", 'error');
        return;
    }

    log("INIT: Préparation de la génération musicale avec Suno AI...", 'info');
    const startTime = Date.now();

    try {
        // Appel à la fonction Netlify 'suno-proxy'
        const data = await callNetlifyFunction('suno-proxy', 'POST', {
            prompt: prompt,
            customMode: false, // Mode simple pour le test
            instrumental: false, // S_R19
            model: 'V3_5', // Modèle de base pour le test // S_R19
        });

        log(`SUCCÈS: Tâche de génération lancée. ID de tâche: ${data.taskId}.`, 'success');
        log(`INFO: La musique sera disponible via le callback. Sondage en cours...`, 'info');

        // Nous allons sonder les résultats via get-suno-details
        pollForMusicResults(data.taskId, startTime);

    } catch (error) {
        log(`ÉCHEC GÉNÉRATION MUSIQUE: ${error.message}`, 'error');
    }
}

async function pollForMusicResults(taskId, startTime) {
    log(`DÉBUT DU SONDAGE pour la tâche ${taskId}...`, 'info');
    let attempts = 0;
    const maxAttempts = 60; // Sonde pendant 10 minutes max (60 * 10 secondes)
    const pollInterval = 10000; // 10 secondes

    const intervalId = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(intervalId);
            log(`SONDAGE TERMINÉ: La tâche ${taskId} n'a pas été complétée dans le temps imparti.`, 'warning');
            return;
        }

        log(`SONDAGE: Vérification du statut de la tâche ${taskId} (Tentative ${attempts}/${maxAttempts})...`, 'info');
        try {
            // Appel à la fonction Netlify 'get-suno-details'
            const result = await callNetlifyFunction(`get-suno-details?taskId=${taskId}`);

            if (result && result.data && result.data.callbackType === 'complete') {
                clearInterval(intervalId);
                const endTime = Date.now();
                const duration = ((endTime - startTime) / 1000).toFixed(2);
                log(`SUCCÈS: Musique générée pour la tâche ${taskId} en ${duration} secondes.`, 'success');

                const musicData = result.data.data; // Tableau de 2 musiques
                if (musicData && musicData.length > 0) {
                    audio1.src = musicData.audio_url |

| '';
                    download1.href = musicData.audio_url |

| '';
                    download1.download = `suno_music_${musicData.id}.mp3`;
                    log(`LIEN MUSIQUE: <a href="${musicData.audio_url}" target="_blank" style="color: cyan; text-decoration: underline;">${musicData.audio_url}</a>`, 'success');
                    log(`COMMENTAIRE: Modèle: ${musicData.model_name}, Titre: "${musicData.title |

| 'N/A'}", Tags: "${musicData.tags |
| 'N/A'}"`, 'info');
                } else {
                    log("AVERTISSEMENT: Aucune URL audio trouvée dans la réponse de Suno.", 'warning');
                }

            } else if (result && result.data && result.data.callbackType === 'error') {
                clearInterval(intervalId);
                log(`ÉCHEC GÉNÉRATION MUSIQUE pour la tâche ${taskId}: ${result.msg}`, 'error');
            } else {
                log(`STATUT TÂCHE ${taskId}: ${result.msg |

| 'En cours...'}`, 'info');
            }
        } catch (error) {
            clearInterval(intervalId);
            log(`ERREUR LORS DU SONDAGE pour la tâche ${taskId}: ${error.message}`, 'error');
        }
    }, pollInterval);
}

async function getRemainingCredits() {
    log("INIT: Récupération des crédits Suno AI...", 'info');
    try {
        // Appel à la fonction Netlify 'get-suno-credits'
        const data = await callNetlifyFunction('get-suno-credits');
        creditsDisplay.textContent = data.creditsRemaining;
        log(`SUCCÈS: Crédits restants: ${data.creditsRemaining}.`, 'success');
    } catch (error) {
        log(`ÉCHEC RÉCUPÉRATION CRÉDITS: ${error.message}`, 'error');
    }
}

// --- Chargement Initial ---
document.addEventListener('DOMContentLoaded', () => {
    log("CONSOLE: Générateur simple démarré. Entrez un prompt et générez!", 'info');
    getRemainingCredits(); // Récupère les crédits au chargement
});
    localStorage.setItem('musicArchive', JSON.stringify(archive)); // S_R33, S_R35, S_R39, S_R44, S_R46
}

function saveConsoleLogHistory() {
    localStorage.setItem('consoleLogHistory', JSON.stringify(consoleLogHistory)); // S_R33, S_R35, S_R39, S_R44, S_R46
}

function saveMetrics() {
    localStorage.setItem('metrics', JSON.stringify(metrics)); // S_R33, S_R35, S_R39, S_R44, S_R46
}

// --- Logique de la Console CRT (avec styles inline) ---
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { timestamp, message, type };
    consoleLogHistory.push(logEntry);
    if (consoleLogHistory.length > 200) { // Garde l'historique de la console gérable
        consoleLogHistory.shift();
    }
    renderConsole();
    saveConsoleLogHistory();
}

function renderConsole() {
    consoleEl.innerHTML = '';
    consoleLogHistory.forEach(entry => {
        const p = document.createElement('p');
        // Styles inline pour les messages de la console
        let color = '#00ff00'; // Couleur par défaut (vert lime)
        let textShadow = '0 0 5px #00ff00'; // Lueur par défaut
        if (entry.type === 'info') {
            color = '#00aaff'; // Bleu clair
            textShadow = '0 0 5px #00aaff';
        } else if (entry.type === 'success') {
            color = '#00cc00'; // Vert plus foncé
            textShadow = '0 0 5px #00cc00';
        } else if (entry.type === 'error') {
            color = '#ff0000'; // Rouge
            textShadow = '0 0 5px #ff0000';
        } else if (entry.type === 'warning') {
            color = '#ffff00'; // Jaune
            textShadow = '0 0 5px #ffff00';
        }

        p.style.margin = '0';
        p.style.padding = '2px 0';
        p.style.color = color;
        p.style.textShadow = textShadow;
        p.style.wordBreak = 'break-word'; // Empêche le débordement des longues lignes

        // Ajout de l'horodatage
        const timestampSpan = document.createElement('span');
        timestampSpan.style.color = '#888'; // Gris
        timestampSpan.style.fontSize = '0.9em';
        timestampSpan.style.marginRight = '5px';
        timestampSpan.textContent = `[${entry.timestamp}]`; // Utilise le timestamp de l'entrée
        p.appendChild(timestampSpan);

        // Ajout du message (gère les liens si présents)
        const messageSpan = document.createElement('span');
        messageSpan.innerHTML = entry.message; // Utilise innerHTML pour interpréter les balises <a>
        p.appendChild(messageSpan);

        consoleEl.appendChild(p);
    });
    consoleEl.scrollTop = consoleEl.scrollHeight; // Défilement automatique vers le bas // S_R45, S_R47
}

// --- Interaction API (via Fonctions Netlify) ---
// *** LIGNE CLÉ MODIFIÉE POUR L'URL FIXE DE NETLIFY ***
// Utilise l'URL fixe de votre site Netlify où les fonctions sont déployées.
const NETLIFY_FUNCTIONS_BASE_URL = 'https://undergroundstudioapp.netlify.app/.netlify/functions'; // S_R6

async function callNetlifyFunction(endpoint, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            // 'User-Agent': 'UndergroundStudioApp/1.0', // Ajouté pour correspondre aux headers CORS du backend
            // Aucune clé API sensible ici, elles sont gérées par les fonctions Netlify
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        log(`REQUÊTE: ${method} à ${NETLIFY_FUNCTIONS_BASE_URL}/${endpoint}`, 'info');
        const response = await fetch(`${NETLIFY_FUNCTIONS_BASE_URL}/${endpoint}`, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            log(`ERREUR FONCTION NETLIFY (${response.status}): ${errorData.message |

| response.statusText}`, 'error');
            throw new Error(`Erreur API (${response.status}): ${errorData.message |

| response.statusText}`);
        }
        log(`RÉPONSE: Statut ${response.status} de ${NETLIFY_FUNCTIONS_BASE_URL}/${endpoint}`, 'info');
        return await response.json();
    } catch (error) {
        log(`ERREUR RÉSEAU/FONCTION: ${error.message}`, 'error');
        throw error; // Re-throw pour être capturé par la fonction appelante
    }
}

async function generateMusic() {
    const prompt = promptInput.value;
    const style = styleInput.value;
    const title = titleInput.value;
    const customMode = customModeCheckbox.checked;
    const instrumental = instrumentalCheckbox.checked;
    const model = modelSelect.value;
    const negativeTags = negativeTagsInput.value;

    // Validations (basées sur la documentation Sunoapi.org) // S_R16
    if (!prompt &&!customMode) {
        log("ERREUR: Le prompt est requis en mode non personnalisé.", 'error');
        return;
    }
    if (customMode &&!instrumental &&!prompt) {
        log("ERREUR: Le prompt est requis en mode personnalisé si non instrumental.", 'error');
        return;
    }
    if (customMode && (!style ||!title)) {
        log("ERREUR: Le style et le titre sont requis en mode personnalisé.", 'error');
        return;
    }
    // Ajoutez ici des validations de longueur de prompt/style/titre si vous le souhaitez, basées sur S_R16

    log("INIT: Préparation de la génération musicale avec Suno AI...", 'info');
    const startTime = Date.now();

    try {
        // Appel à la fonction Netlify 'suno-proxy'
        const data = await callNetlifyFunction('suno-proxy', 'POST', {
            prompt, style, title, customMode, instrumental, model, negativeTags,
            // callBackUrl est défini par la fonction Netlify elle-même pour des raisons de sécurité
        });

        log(`SUCCÈS: Tâche de génération lancée. ID de tâche: ${data.taskId}.`, 'success');
        log(`INFO: La musique sera disponible via le callback. Sondage en cours...`, 'info');

        // Nous allons sonder les résultats via get-suno-details
        pollForMusicResults(data.taskId, prompt, startTime);

    } catch (error) {
        log(`ÉCHEC GÉNÉRATION MUSIQUE: ${error.message}`, 'error');
        metrics.failedTasks++;
        saveMetrics();
        updateMetricsDisplay();
    }
}

async function pollForMusicResults(taskId, originalPrompt, startTime) {
    log(`DÉBUT DU SONDAGE pour la tâche ${taskId}...`, 'info');
    let attempts = 0;
    const maxAttempts = 60; // Sonde pendant 10 minutes max (60 * 10 secondes)
    const pollInterval = 10000; // 10 secondes

    const intervalId = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
            clearInterval(intervalId);
            log(`SONDAGE TERMINÉ: La tâche ${taskId} n'a pas été complétée dans le temps imparti.`, 'warning');
            metrics.failedTasks++;
            saveMetrics();
            updateMetricsDisplay();
            return;
        }

        log(`SONDAGE: Vérification du statut de la tâche ${taskId} (Tentative ${attempts}/${maxAttempts})...`, 'info');
        try {
            // Appel à la fonction Netlify 'get-suno-details'
            const result = await callNetlifyFunction(`get-suno-details?taskId=${taskId}`);

            if (result && result.data && result.data.callbackType === 'complete') {
                clearInterval(intervalId);
                const endTime = Date.now();
                const duration = ((endTime - startTime) / 1000).toFixed(2);
                log(`SUCCÈS: Musique générée pour la tâche ${taskId} en ${duration} secondes.`, 'success');

                const musicData = result.data.data; // Tableau de 2 musiques
                if (musicData && musicData.length > 0) {
                    // Musique 1
                    audio1.src = musicData.audio_url |

| '';
                    download1.href = musicData.audio_url |

| '';
                    download1.download = `music_1_${musicData.id}.mp3`;
                    log(`LIEN MUSIQUE 1: <a href="${musicData.audio_url}" target="_blank" style="color: #00aaff; text-decoration: underline;">${musicData.audio_url}</a>`, 'success');
                    log(`COMMENTAIRE TEXTURE 1: Modèle: ${musicData.model_name}, Titre: "${musicData.title}", Tags: "${musicData.tags}"`, 'info');

                    // Musique 2 (si disponible)
                    if (musicData.length > 1) {
                        audio2.src = musicData.[1]audio_url |

| '';
                        download2.href = musicData.[1]audio_url |

| '';
                        download2.download = `music_2_${musicData.[1]id}.mp3`;
                        log(`LIEN MUSIQUE 2: <a href="${musicData.[1]audio_url}" target="_blank" style="color: #00aaff; text-decoration: underline;">${musicData.[1]audio_url}</a>`, 'success');
                        log(`COMMENTAIRE TEXTURE 2: Modèle: ${musicData.[1]model_name}, Titre: "${musicData.[1]title}", Tags: "${musicData.[1]tags}"`, 'info');
                    }

                    // Ajout à l'archive locale
                    musicData.forEach(music => {
                        archive.push({
                            id: music.id,
                            url: music.audio_url,
                            prompt: music.prompt,
                            title: music.title,
                            model: music.model_name,
                            tags: music.tags,
                            duration: music.duration,
                            type: 'suno_generated'
                        });
                    });
                    saveArchive();
                    updateArchiveDisplay();
                }

                metrics.successTasks++;
                metrics.totalGenerationTime += parseFloat(duration);
                metrics.generationCount++;
                updateMetricsDisplay();
                saveMetrics();

            } else if (result && result.data && result.data.callbackType === 'error') {
                clearInterval(intervalId);
                log(`ÉCHEC GÉNÉRATION MUSIQUE pour la tâche ${taskId}: ${result.msg}`, 'error');
                metrics.failedTasks++;
                saveMetrics();
                updateMetricsDisplay();
            } else {
                log(`STATUT TÂCHE ${taskId}: ${result.msg |

| 'En cours...'}`, 'info');
            }
        } catch (error) {
            clearInterval(intervalId);
            log(`ERREUR LORS DU SONDAGE pour la tâche ${taskId}: ${error.message}`, 'error');
            metrics.failedTasks++;
            saveMetrics();
            updateMetricsDisplay();
        }
    }, pollInterval);
}


async function generateLyrics() {
    const prompt = promptInput.value;
    if (!prompt) {
        log("ERREUR: Le prompt est requis pour la génération de paroles.", 'error');
        return;
    }

    log("INIT: Génération de paroles avec Suno AI...", 'info');
    try {
        // Appel à la fonction Netlify 'suno-proxy' pour les paroles
        const data = await callNetlifyFunction('suno-proxy', 'POST', {
            lyricsPrompt: prompt, // Utilise un champ différent pour indiquer une requête de paroles
        });
        log(`SUCCÈS: Tâche de génération de paroles lancée. ID de tâche: ${data.taskId}.`, 'success');
        
        if (data.lyrics) { // Si la fonction proxy renvoie les paroles directement
            log(`PAROLES GÉNÉRÉES: <pre style="white-space: pre-wrap; word-break: break-all; color: #00ff00; text-shadow: 0 0 5px #00ff00;">${data.lyrics}</pre>`, 'success');
            promptInput.value = data.lyrics; // Optionnel: met les paroles générées dans le champ prompt
        } else {
            log(`INFO: Les paroles seront disponibles via le callback. Vous pouvez aussi interroger le statut avec l'ID de tâche.`, 'info');
            // Si l'API paroles est asynchrone, vous devrez implémenter un sondage similaire à celui de la musique.
        }
    } catch (error) {
        log(`ÉCHEC GÉNÉRATION PAROLES: ${error.message}`, 'error');
        metrics.failedTasks++;
        saveMetrics();
        updateMetricsDisplay();
    }
}

async function getRemainingCredits() {
    log("INIT: Récupération des crédits Suno AI...", 'info');
    try {
        // Appel à la fonction Netlify 'get-suno-credits'
        const data = await callNetlifyFunction('get-suno-credits');
        creditsDisplay.textContent = `Crédits: ${data.creditsRemaining}`;
        metricCredits.textContent = data.creditsRemaining;
        log(`SUCCÈS: Crédits restants: ${data.creditsRemaining}.`, 'success');
    } catch (error) {
        log(`ÉCHEC RÉCUPÉRATION CRÉDITS: ${error.message}`, 'error');
    }
}

async function retrieveAndArchiveBase44() {
    const trackId = base44TrackIdInput.value;
    if (!trackId) {
        log("ERREUR: L'ID de piste Base44 est requis.", 'error');
        return;
    }

    log(`INIT: Récupération de la piste ${trackId} depuis Base44...`, 'info');
    try {
        // Appel à la fonction Netlify 'base44-proxy'
        const data = await callNetlifyFunction(`base44-proxy?trackId=${trackId}`);
        log(`SUCCÈS: Piste ${trackId} récupérée de Base44.`, 'success');

        if (data.audio_url) {
            archive.push({
                id: trackId,
                url: data.audio_url,
                prompt: data.prompt |

| 'Récupéré de Base44',
                title: data.title |

| `Piste Base44 ${trackId}`,
                type: 'base44'
            });
            saveArchive();
            updateArchiveDisplay();
            log(`ARCHIVE: Piste ${trackId} ajoutée à l'archive.`, 'success');
        } else {
            log(`AVERTISSEMENT: Aucune URL audio trouvée pour la piste ${trackId} de Base44.`, 'warning');
        }
    } catch (error) {
        log(`ÉCHEC RÉCUPÉRATION BASE44: ${error.message}`, 'error');
    }
}

// --- Gestion de l'Archive (LocalStorage) --- // S_R33, S_R35, S_R37, S_R39, S_R46
function updateArchiveDisplay(filter = '') {
    archiveDisplay.innerHTML = '';
    const filteredArchive = archive.filter(item =>
        (item.prompt && item.prompt.toLowerCase().includes(filter.toLowerCase())) ||
        (item.title && item.title.toLowerCase().includes(filter.toLowerCase())) ||
        (item.id && item.id.toLowerCase().includes(filter.toLowerCase()))
    );

    if (filteredArchive.length === 0 && filter) {
        archiveDisplay.innerHTML = '<p style="color: #00ff00; text-shadow: 0 0 5px #00ff00;">Aucun résultat trouvé pour votre recherche.</p>';
        return;
    } else if (filteredArchive.length === 0) {
        archiveDisplay.innerHTML = '<p style="color: #00ff00; text-shadow: 0 0 5px #00ff00;">L\'archive est vide. Générez ou récupérez de la musique!</p>';
        return;
    }

    filteredArchive.forEach(item => {
        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.style.paddingBottom = '5px';
        div.style.borderBottom = '1px dashed rgba(0, 255, 0, 0.2)';
        div.style.fontSize = '0.95em';

        div.innerHTML = `
            <strong style="color: #00ff00; text-shadow: 0 0 3px #00ff00;">${item.title |

| 'Titre Inconnu'}</strong> (ID: ${item.id})<br>
            Prompt: ${item.prompt}<br>
            ${item.model? `Modèle: ${item.model}<br>` : ''}
            ${item.duration? `Durée: ${item.duration.toFixed(2)}s<br>` : ''}
            <audio controls src="${item.url}" style="width: calc(100% - 20px); margin-top: 5px; filter: sepia(100%) saturate(200%) hue-rotate(90deg) brightness(70%) contrast(150%);"></audio>
            <a href="${item.url}" download="${item.title |

| 'track'}_${item.id}.mp3" class="download-link" style="color: #00cc00; text-decoration: none; font-size: 0.9em; display: inline-block; margin-top: 5px; border: 1px dashed #00cc00; padding: 5px 10px;">Télécharger</a>
        `;
        archiveDisplay.appendChild(div);
    });
}

function clearArchive() {
    if (confirm("Êtes-vous sûr de vouloir effacer toute l'archive? Cette action est irréversible.")) {
        archive =;
        saveArchive();
        updateArchiveDisplay();
        log("ARCHIVE: Toute l'archive a été effacée.", 'warning');
    }
}

function searchArchive() {
    const filter = archiveSearchInput.value;
    updateArchiveDisplay(filter);
    log(`ARCHIVE: Recherche effectuée pour "${filter}".`, 'info');
}

// --- Affichage des Métriques ---
function updateMetricsDisplay() {
    metricSuccessTasks.textContent = metrics.successTasks;
    metricFailedTasks.textContent = metrics.failedTasks;
    if (metrics.generationCount > 0) {
        metricAvgTime.textContent = `${(metrics.totalGenerationTime / metrics.generationCount).toFixed(2)}s`;
    } else {
        metricAvgTime.textContent = 'N/A';
    }
    saveMetrics(); // Sauvegarde les métriques à chaque mise à jour
}

// --- Chargement Initial ---
document.addEventListener('DOMContentLoaded', () => {
    renderConsole();
    updateArchiveDisplay();
    updateMetricsDisplay();
    getRemainingCredits(); // Récupère les crédits au chargement
    log("CONSOLE: Système d'administration démarré. Bienvenue!", 'info');
});

// --- Écouteurs d'événements pour les éléments de l'interface utilisateur ---
customModeCheckbox.addEventListener('change', () => {
    const isCustom = customModeCheckbox.checked;
    styleInput.disabled =!isCustom;
    titleInput.disabled =!isCustom;
    if (!isCustom) {
        styleInput.value = '';
        titleInput.value = '';
    }
});

// État initial pour les champs du mode personnalisé
customModeCheckbox.dispatchEvent(new Event('change'));
