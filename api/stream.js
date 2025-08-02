// api/stream.js
export default async function handler(req, res) {
    try {
        const { trackId, download } = req.query;
        
        if (!trackId) {
            return res.status(400).json({ error: 'trackId manquant' });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

        const response = await fetch(`https://base44.app/api/apps/${process.env.BASE44_APP_ID}/entities/Track/${trackId}`);
        if (!response.ok) return res.status(404).json({ error: 'Track non trouvé' });

        const track = await response.json();
        if (!track.audio_url) return res.status(404).json({ error: 'Audio non disponible' });

        let audioResponse = await fetch(track.audio_url);
        if (!audioResponse.ok && audioResponse.status === 404) {
            const regenResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.BASE44_API_KEY}` // Renommé en BASE44_API_KEY
                },
                body: JSON.stringify({
                    prompt: track.prompt || 'Régénération automatique',
                    customMode: true,
                    instrumental: true,
                    model: track.model || 'V3_5',
                    callBackUrl: `https://${req.headers.host}/api/callback?trackId=${trackId}`
                })
            });
            if (!regenResponse.ok) throw new Error('Régénération échouée');
            const { data: { taskId } } = await regenResponse.json();
            await new Promise(resolve => setTimeout(resolve, 30000)); // Attendre 30s
            const updatedTrack = await (await fetch(`https://base44.app/api/apps/${process.env.BASE44_APP_ID}/entities/Track/${trackId}`)).json();
            audioResponse = await fetch(updatedTrack.audio_url);
        }

        if (!audioResponse.ok) return res.status(500).json({ error: 'Audio inaccessible' });

        res.setHeader('Content-Type', 'audio/mpeg');
        if (download === 'true') {
            const filename = track.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.mp3"`);
        }
        const audioBuffer = await audioResponse.arrayBuffer();
        res.send(Buffer.from(audioBuffer));

    } catch (error) {
        console.error('Erreur:', error);
        res.status(500).json({ error: error.message });
    }
    }
