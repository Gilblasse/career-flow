
// Simple validation script

async function testServer() {
    console.log('Testing GET / ...');
    try {
        const res = await fetch('http://localhost:3001/');
        const text = await res.text();
        console.log(`Response: ${res.status} ${res.statusText}`);
        console.log(`Body: ${text}`);
    } catch (e) {
        console.error('Check failed:', e.message);
    }
}

testServer();
