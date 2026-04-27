const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function listAllModels() {
    const key = process.env.GEMINI_API_KEY;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await axios.get(url);
        console.log("📊 Models available to this key:");
        response.data.models.forEach(m => {
            console.log(`- ${m.name}`);
        });
    } catch (e) {
        console.error("❌ Failed to list models:");
        if (e.response) {
            console.error(JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e.message);
        }
    }
}

listAllModels();
