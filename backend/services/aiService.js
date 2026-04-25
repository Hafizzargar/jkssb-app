const { GoogleGenerativeAI } = require("@google/generative-ai");
const DailyMCQ = require('../models/DailyMCQ');
const Blog = require('../models/Blog');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Validates the structure of AI-generated MCQs
 */
const validateMCQs = (questions) => {
  if (!Array.isArray(questions)) {
    console.log('⚠️ Gemini output is not an array:', questions);
    return [];
  }
  
  return questions.map(q => {
    // Normalize fields
    const question = q.question || q.text || q.q;
    const options = q.options || q.choices || q.answers;
    const correct = q.correct || q.correctAnswer || q.answer;
    const explanation = q.explanation || q.desc || q.reason || 'No explanation provided.';

    // Ensure options is an array of 4
    if (!Array.isArray(options) || options.length !== 4) return null;
    
    // Ensure correct is a single char (A, B, C, or D)
    let normalizedCorrect = String(correct).trim().toUpperCase().charAt(0);
    if (!['A', 'B', 'C', 'D'].includes(normalizedCorrect)) {
      // Try to find the letter in the string if it's like "A) Option"
      const match = String(correct).match(/^[A-D]/i);
      if (match) normalizedCorrect = match[0].toUpperCase();
      else return null; 
    }

    return {
      question: String(question),
      options: options.map(opt => String(opt)),
      correct: normalizedCorrect,
      explanation: String(explanation)
    };
  }).filter(q => q !== null);
};

/**
 * Generates MCQs using Gemini
 */
const generateMCQs = async (subject, difficulty = 'MEDIUM', count = 20) => {
  console.log(`♊ Gemini: Generating ${count} MCQs for ${subject}...`);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Generate exactly ${count} high-quality MCQs for the JKSSB exam. 
                    Subject: ${subject}, Difficulty: ${difficulty}. 
                    Output MUST be a valid JSON array of objects. 
                    NO markdown backticks, NO "json" prefix, just the raw array.
                    Structure:
                    [{ "question": "...", "options": ["A)...", "B)...", "C)...", "D)..."], "correct": "A", "explanation": "..." }]
                    Rules:
                    1. Provide exactly ${count} questions.
                    2. Options MUST start with "A) ", "B) ", etc.
                    3. Correct answer MUST be just the letter "A", "B", "C", or "D".
                    4. Return ONLY the JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('♊ Gemini Response length:', text.length);
    
    // Attempt to extract JSON array using regex if standard cleaning fails
    let questions = [];
    try {
      const cleanedJson = text.replace(/```json|```/gi, '').trim();
      questions = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.log('⚠️ standard JSON parse failed, trying regex extraction...');
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          questions = JSON.parse(jsonMatch[0]);
        } catch (innerError) {
          console.error('❌ Regex extraction also failed');
        }
      }
    }
    
    const validated = validateMCQs(questions);
    console.log(`✅ Validated ${validated.length} / ${count} questions.`);
    return validated;
  } catch (error) {
    console.error('❌ Gemini MCQ Error:', error);
    return [];
  }
};

/**
 * Generates Daily Blogs using Gemini
 */
const generateBlogs = async () => {
  console.log(`♊ Gemini: Generating daily news blogs...`);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Generate 3 current affairs blog posts for students in Jammu & Kashmir preparing for JKSSB exams.
                    One post for J&K news, one for India, and one for World.
                    Include a catchy title, a suggested high-quality image URL from Unsplash (e.g., https://images.unsplash.com/photo-...?auto=format&fit=crop&q=80&w=1000 based on subject), and the content.
                    Format strictly as a JSON array:
                    [{ "title": "...", "content": "...", "category": "J&K | INDIA | WORLD", "image": "unsplash_url" }]
                    Only return the JSON.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedJson = text.replace(/```json|```/gi, '').trim();
    const blogs = JSON.parse(cleanedJson);
    return blogs.map(b => ({
      ...b,
      image: b.image || `https://source.unsplash.com/featured/?${b.category.toLowerCase()},news`
    }));
  } catch (error) {
    console.error('❌ Gemini Blog Error:', error);
    return [];
  }
};

/**
 * Refines a blog title using Gemini
 */
const refineTitle = async (oldTitle, content) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Given the blog title: "${oldTitle}" and content: "${content.substring(0, 500)}...", 
                    suggest a more engaging, click-worthy, and SEO-friendly title for students.
                    Return ONLY the title string.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim().replace(/^"|"$/g, '');
  } catch (error) {
    console.error('❌ Gemini Refine Error:', error);
    return oldTitle;
  }
};

module.exports = { generateMCQs, generateBlogs, refineTitle };
