const axios = require('axios');
require('dotenv').config({ path: './backend/.env' });

async function testModel(modelName) {
    const key = process.env.GEMINI_API_KEY;
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hi" }] }]
        });
        console.log(`✅ ${modelName} works!`);
        return true;
    } catch (e) {
        console.log(`❌ ${modelName} failed: ${e.response ? e.response.status : e.message}`);
        if (e.response && e.response.data) {
            console.log("   Reason:", e.response.data.error.message);
        }
        return false;
    }
}

async function runTests() {
    await testModel("gemini-1.5-flash");
    await testModel("gemini-1.5-flash-latest");
    await testModel("gemini-2.0-flash");
    await testModel("gemini-flash-latest");
    await testModel("gemini-pro");
}

runTests();
