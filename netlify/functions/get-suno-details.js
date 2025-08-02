// netlify/functions/get-suno-details.js
// In a real application, this would query your persistent database.
// For this example, we're importing the in-memory store from suno-callback.
// This is a hack and will not work reliably across cold starts.
const { getTaskResult } = require('./suno-callback'); // This import is problematic for true persistence

exports.handler = async (event, context) => {
    if (event.httpMethod!== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const taskId = event.queryStringParameters.taskId;
    if (!taskId) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Task ID is required.' }) };
    }

    // Simulate fetching from a database.
    // In a real scenario, you'd query your actual database here.
    // Example: const result = await db.collection('sunoTasks').findOne({ taskId: taskId });
    const result = getTaskResult(taskId); // This will only work if suno-callback was invoked recently and is still warm.

    if (result) {
        return {
            statusCode: 200,
            body: JSON.stringify(result),
        };
    } else {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Task not found or not yet completed.', callbackType: 'pending', msg: 'En cours...' }),
        };
    }
};
