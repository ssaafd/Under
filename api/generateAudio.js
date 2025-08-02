// api/generateAudio.js
export default async function handler(req, res) {
    try {
        const { prompt, trackId, style, title, customMode, instrumental, model, negativeTags } = req.body;

        if (!trackId || !prompt || !customMode || !instrumental || !model) {
            return res.status(400).json({ error: 'trackId, prompt, customMode, instrumental, et model requis' });
        }

        const callbackUrl = `https://${req.headers.host}/api/callback?trackId=${trackId}`;
        const payload = {
            prompt,
            style: customMode ? style : undefined,
            title: customMode ? title : undefined,
            customMode,
            instrumental,
            model,
            negativeTags,
            callBackUrl: callbackUrl
        };

        const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.BASE44_API_KEY}` // Renommé en BASE44_API_KEY
            },
            body: JSON.stringify(payload)
        });

        if (!sunoResponse.ok) {
            const errorText = await sunoResponse.text();
            console.error(`Erreur Suno: ${sunoResponse.status}, ${errorText}`);
            return res.status(sunoResponse.status).json({ error: 'Erreur Suno', details: errorText });
        }

        const { data: { taskId } } = await sunoResponse.json();
        await fetch(`https://base44.app/api/apps/${process.env.BASE44_APP_ID}/entities/Track/${trackId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ suno_id: taskId })
        });

        res.status(202).json({ taskId, callbackUrl, message: 'Génération en cours' });

    } catch (error) {
        console.error('Erreur globale:', error);
        res.status(500).json({ error: error.message });
    }
}
