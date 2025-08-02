// api/callback.js
export default async function handler(req, res) {
    try {
        const { code, msg, data } = req.body;
        const { task_id: taskId, callbackType, data: musicData } = data || {};
        const { trackId } = req.query;

        if (!trackId || !taskId) {
            return res.status(400).json({ error: 'trackId et taskId requis' });
        }

        console.log(`Callback reçu: taskId ${taskId}, type ${callbackType}, code ${code}, msg ${msg}`);

        if (code === 200 && callbackType === 'complete' && musicData?.length) {
            const { audio_url, image_url } = musicData[0];
            await fetch(`https://base44.app/api/apps/${process.env.BASE44_APP_ID}/entities/Track/${trackId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio_url, image_url, status: 'completed' })
            });
            console.log(`Mise à jour Track ${trackId} avec audio_url: ${audio_url}`);
        } else if (code !== 200) {
            await fetch(`https://base44.app/api/apps/${process.env.BASE44_APP_ID}/entities/Track/${trackId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'failed', error: msg })
            });
            console.error(`Échec pour taskId ${taskId}: ${msg}`);
        }

        res.status(200).json({ status: 'received' });

    } catch (error) {
        console.error('Erreur callback:', error);
        res.status(500).json({ error: error.message });
    }
}
