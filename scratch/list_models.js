const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: './backend/.env' });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(key);
    
    const modelsToTest = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-pro"
    ];

    for (const modelName of modelsToTest) {
        try {
            console.log(`🔍 Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Test");
            console.log(`✅ ${modelName} works!`);
        } catch (e) {
            console.error(`❌ ${modelName} failed: ${e.message}`);
        }
    }
}

listModels();
