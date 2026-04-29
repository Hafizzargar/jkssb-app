const { GoogleGenerativeAI } = require("@google/generative-ai");
const DailyMCQ = require('../models/DailyMCQ');
const Blog = require('../models/Blog');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Validates the structure of AI-generated MCQs
 */
const validateMCQs = (questions) => {
  let list = questions;
  
  // Handle case where Gemini wraps the array in an object like { "questions": [...] }
  if (!Array.isArray(list) && typeof list === 'object' && list !== null) {
    list = list.questions || list.data || list.mcqs || Object.values(list).find(val => Array.isArray(val));
  }

  if (!Array.isArray(list)) {
    console.log('⚠️ Gemini output is not an array:', list);
    return [];
  }
  
  return list.map(q => {
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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `Generate exactly ${count} high-quality MCQs for the NEET (National Eligibility cum Entrance Test) exam for Medx Institute. 
                    Subject: ${subject}, Difficulty: ${difficulty}. 
                    Focus on Biology, Chemistry, or Physics as per the subject.
                    Output MUST be a valid JSON array of objects. 
                    Structure:
                    [{ "question": "...", "options": ["A)...", "B)...", "C)...", "D)..."], "correct": "A", "explanation": "..." }]
                    Rules:
                    1. Provide exactly ${count} questions.
                    2. Options MUST start with "A) ", "B) ", etc.
                    3. Correct answer MUST be just the letter "A", "B", "C", or "D".`;

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
    if (validated.length === 0 && questions.length > 0) {
      console.warn('⚠️ Gemini: All generated MCQs failed validation.');
    }
    console.log(`✅ Validated ${validated.length} / ${count} questions.`);
    return validated;
  } catch (error) {
    console.error('❌ Gemini MCQ Error:', error.message);
    if (error.message.includes('leaked')) {
      console.error('🛑 CRITICAL: YOUR API KEY HAS BEEN DEACTIVATED DUE TO A LEAK.');
    }
    return [];
  }
};

/**
 * Generates Daily Blogs using Gemini
 */
const generateBlogs = async (subject = 'JKSSB') => {
  console.log(`♊ Gemini: Generating daily news blogs for ${subject}...`);
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });
    const prompt = `Generate 3 engaging news blog posts for Medx Institute students preparing for NEET medical exams.
                    Write about recent developments, NEET preparation tips, exam updates, and medical field current affairs.
                    For each post include a catchy title, detailed content (at least 3 paragraphs), and a relevant high-quality medical/educational Unsplash image URL.
                    IMPORTANT: Use exactly "NEET" as the category for ALL 3 posts.
                    Format strictly as a valid JSON array with NO extra text:
                    [{ "title": "...", "content": "...", "category": "NEET", "image": "https://images.unsplash.com/photo-XXXXXXXXXX?auto=format&fit=crop&q=80&w=1000" }]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedJson = text.replace(/```json|```/gi, '').trim();
    const blogs = JSON.parse(cleanedJson);
    return blogs.map(b => ({
      ...b,
      image: b.image || `https://source.unsplash.com/featured/?${b.category.toLowerCase()},news`
    }));
  } catch (error) {
    console.error('❌ Gemini Blog Error:', error.message);
    if (error.message.includes('leaked')) {
      console.error('🛑 CRITICAL: YOUR API KEY HAS BEEN DEACTIVATED DUE TO A LEAK.');
    }
    return [];
  }
};

/**
 * Refines a blog title using Gemini
 */
const refineTitle = async (oldTitle, content) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
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

const ExamPattern = require('../models/ExamPattern');
const mongoose = require('mongoose');

/**
 * Generates a full NEET Mock distribution
 */
const generateNeetMock = async (mode = 'MINI', difficulty = 'MEDIUM', customSections = null) => {
  let sections = customSections || [];
  let total = 0;
  let label = mode;

  // 1. Try to fetch from DB if it's an ID and no custom sections provided
  if (!customSections && mongoose.Types.ObjectId.isValid(mode)) {
    const pattern = await ExamPattern.findById(mode);
    if (pattern) {
      sections = pattern.sections;
      total = pattern.total;
      label = pattern.label;
    }
  }

  // 2. Fallback to static patterns if not found or not an ID
  if (sections.length === 0) {
    const staticPatterns = {
      MINI: [{ name: 'Physics', count: 10 }, { name: 'Chemistry', count: 10 }, { name: 'Biology', count: 20 }],
      MEDIUM: [{ name: 'Physics', count: 20 }, { name: 'Chemistry', count: 20 }, { name: 'Biology', count: 40 }],
      FULL: [{ name: 'Physics', count: 45 }, { name: 'Chemistry', count: 45 }, { name: 'Biology', count: 90 }]
    };
    const p = staticPatterns[mode.toUpperCase()] || staticPatterns.MINI;
    sections = p;
  }

  // Ensure total is calculated correctly - use Number() to avoid string concatenation
  total = sections.reduce((acc, s) => acc + (Number(s.count) || 0), 0);

  console.log(`♊ Gemini: Generating NEET Mock (${label}) with ${total} questions...`);
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Generate ${total} high-quality NEET MCQs for Medx Institute.
                    Distribution:
                    ${sections.map(s => `- ${s.name}: ${s.count} questions`).join('\n')}
                    
                    Difficulty: ${difficulty}.
                    
                    Format strictly as a valid JSON array with NO extra text:
                    [{ "question": "[Subject] text", "options": ["A) opt", "B) opt", "C) opt", "D) opt"], "correct": "A", "explanation": "..." }]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedJson = text.replace(/```json|```/gi, '').trim();
    const questionsData = JSON.parse(cleanedJson);
    return validateMCQs(questionsData);
  } catch (error) {
    console.error('❌ Gemini Mock Error:', error.message);
    return [];
  }
};

module.exports = { generateMCQs, generateBlogs, refineTitle, generateNeetMock };
