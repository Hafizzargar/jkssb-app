# Medx Institute - Premium NEET Assessment Platform

A robust, high-performance education platform specifically designed for NEET preparation. The platform features an AI-driven administration engine and a premium, gamified student experience.

---

## 🚀 Advanced Implementation Summary

### 1. 🎯 MCQ Mission Life-Cycle (Enhanced)
The MCQ system is designed for high-stakes, time-bound competition with the following workflow:
- **AI-Powered Generation**: Admin generates 20+ questions instantly via Gemini AI.
- **Precision Scheduling**: Missions are scheduled for specific time windows (e.g., 12:00 PM to 12:15 PM).
- **Dynamic Student Interface**: 
  - **Live Countdown**: Real-time timer per question and per mission.
  - **Auto-Submission**: Instant lock and sync if the user leaves the app or time expires.
- **Premium Results UI**: 
  - **Scorecard**: Glassmorphic performance summary with Correct/Wrong/Total counts.
  - **Review Modal**: Detailed post-mission review with side-by-side comparison of user answers vs. correct answers.
  - **Instant Leaderboard**: Real-time rank calculation showing top performers and "Hall of Fame" podium.

### 2. 📰 AI News & Blogs System
- **Gemini Content Engine**: Admin generates full-length educational blogs from simple keywords.
- **Draft & Publish**: A dedicated workflow to review, edit, and publish AI-generated content.
- **Student Feed**: High-density cards featuring "New" badges, reading time estimates, and subject tags.

### 3. 💰 Economics & Prize System (Dream11 Model)
A complete monetization and reward engine built for high-stakes competition:
- **Revenue Models**:
  - **Fixed Prizes**: Static reward amounts set by admin.
  - **Entry Fee Based**: Dynamic prize pools funded by user entries. Platform keeps a configurable commission (e.g., 20%), and the rest is distributed to winners.
- **Dynamic Reward Distribution**:
  - **Multi-Rank Support**: Define prizes for any number of ranks (Rank 1, 2, 3... N).
  - **Live Simulation**: Admin portal features a real-time economics calculator to preview total collection, platform profit, and prize pool before publishing.
- **Mission Integration**:
  - Toggle "Prize Mission" status for individual tests.
  - Custom entry fees per mission.
  - Visual gold trophy badges on the mission list for student awareness.

### 4. 👤 Profile & User Statistics
- **Performance Analytics**: Visual tracking of "Subject Mastery" and aggregate scores.
- **Rankings**: Global rank vs. Category-specific rank.
- **KYC-Style Security**: Admin approval workflow for new registrations to maintain platform integrity.

---

## 🛠️ Technical Excellence

### 📱 Mobile (React Native / Expo)
- **Advanced API Client**: Auto-IP detection for Real Device/Emulator connectivity + Global request interceptors.
- **Premium UI Components**: 
  - **Chip Picker**: Smooth horizontal subject selection.
  - **Dynamic Rank Editor**: Real-time management of reward lists.
- **Balanced Navigation**: Optimized bottom tab bar with even item distribution and iOS safe-area support.

### ⚙️ Backend (Node.js / MongoDB)
- **Flexible Prize Schema**: Robust model supporting both static and percentage-based economics.
- **Robust Controller Logic**: Advanced timing checks (IsTooEarly/IsTooLate) to prevent mission unauthorized access.
- **Negative Marking Support**: Configurable scoring logic with penalty support for wrong answers.
- **Session-Based Auth**: Secure session management with MongoDB storage and cookie-based validation.

---

## 📦 Installation & Setup

### 1. Backend
```bash
cd backend
npm install
# Create .env with MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm run dev
```

### 2. Mobile App
```bash
cd mobile
npm install
npx expo start
```

---

## 🛡️ Stability & Security
- **API Interceptors**: Global request/response logging for rapid debugging of "Network Errors".
- **Dynamic Routing**: Automatic detection of host IP to eliminate connection issues on physical devices.
- **Safety Checks**: Server-side validation for mission timing and duplicate submission prevention.

---
Developed with ❤️ by the adaptLearn Team.
#   j k s s b - a p p  