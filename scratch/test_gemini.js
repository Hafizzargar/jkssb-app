const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './backend/.env' });

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ GEMINI_API_KEY is missing from .env");
        process.exit(1);
    }
    console.log("🔑 Key found (length):", key.length);

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say 'API is working'");
        console.log("📡 Response:", result.response.text());
    } catch (error) {
        console.error("❌ Gemini API Call Failed:");
        console.error(error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
}

testGemini();
