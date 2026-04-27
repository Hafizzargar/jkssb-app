require('dotenv').config({ path: 'c:/Users/hafez/OneDrive/Desktop/adaptLearn/backend/.env' });
const { generateBlogs } = require('c:/Users/hafez/OneDrive/Desktop/adaptLearn/backend/services/aiService');

async function debugBlogs() {
    console.log("🧪 Starting Blog Generation Debug...");
    try {
        const blogs = await generateBlogs();
        console.log("📊 Result count:", blogs.length);
        if (blogs.length === 0) {
            console.log("❌ Returned an empty array.");
        } else {
            console.log("✅ Successfully generated blogs!");
            console.log(JSON.stringify(blogs, null, 2));
        }
    } catch (e) {
        console.error("💥 Fatal Error during debug:", e.message);
    }
}

debugBlogs();
