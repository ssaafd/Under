// netlify/functions/suno-callback.js
// This is a simplified in-memory store for demonstration.
// In a real application, you would use a persistent database (e.g., FaunaDB, Supabase, MongoDB Atlas).
const taskResults = {}; // This will NOT persist across cold starts of the function.

exports.handler = async (event, context) => {
    if (event.httpMethod!== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const callbackData = JSON.parse(event.body);
        const taskId = callbackData.data.task_id;

        console.log(`Received Suno Callback for Task ID: ${taskId}`);
        console.log('Callback Data:', JSON.stringify(callbackData, null, 2));

        // Store the result (in-memory for this example)
        taskResults[taskId] = callbackData;

        // In a real app, you'd update your database here:
        // await db.collection('sunoTasks').updateOne({ taskId: taskId }, { $set: callbackData }, { upsert: true });

        return {
            statusCode: 200,
            body: JSON.stringify({ status: 'received', message: 'Callback processed' }),
        };
    } catch (error) {
        console.error('Error processing Suno callback:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ status: 'error', message: 'Failed to process callback', error: error.message }),
        };
    }
};

// This function is for internal use by get-suno-details.js to retrieve results.
// It's a hack for demonstration purposes without a real DB.
// In a real app, get-suno-details would query the persistent DB.
exports.getTaskResult = (taskId) => {
    return taskResults[taskId];
};
