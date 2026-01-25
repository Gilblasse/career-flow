import app from './server.js';
import Logger from './services/logger.js';
import http from 'http';

// Simple test to start server, make requests, and check results
async function verifyServer() {
    Logger.info('--- Starting API Verification ---');

    // Start server
    const server = app.listen(3002, () => {
        Logger.info('Test Server running on port 3002');
    });

    try {
        // 1. GET Profile
        const getRes = await fetch('http://localhost:3002/api/profile');
        const profile = await getRes.json();
        Logger.info(`GET /api/profile Response: ${getRes.status}`);

        if (getRes.status !== 200 || !profile.contact) {
            throw new Error('GET Profile failed');
        }

        // 2. POST Profile (Update Name)
        const updatedProfile = { ...profile };
        updatedProfile.contact.firstName = 'TestUpdate';

        const postRes = await fetch('http://localhost:3002/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProfile)
        });
        const postData = await postRes.json();
        Logger.info(`POST /api/profile Response: ${postRes.status} ${JSON.stringify(postData)}`);

        if (postRes.status !== 200 || !postData.success) {
            throw new Error('POST Profile failed');
        }

        // 3. Verify Update
        const verifyRes = await fetch('http://localhost:3002/api/profile');
        const verifyProfile = await verifyRes.json();

        if (verifyProfile.contact.firstName !== 'TestUpdate') {
            throw new Error('Profile update was not persisted');
        }
        Logger.info('Profile update verification successful');

        // Restore Name
        updatedProfile.contact.firstName = 'Emmanuel'; // Reset
        await fetch('http://localhost:3002/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProfile)
        });

    } catch (e) {
        Logger.error('Verification failed', e);
    } finally {
        server.close();
        Logger.info('--- API Verification Complete ---');
    }
}

verifyServer();
