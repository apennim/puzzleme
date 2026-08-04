# 🧠 AI Memory OS User / Developer Guide

Welcome to the **AI Memory OS Project Toolkit**! This is a micro-OS architecture designed for seamless collaboration between Human and AI (e.g., Cursor, GitHub Copilot).

## 🚀 Step 1: Getting Started
1. **Open Project**: Import this unzipped folder into your IDE (e.g., Cursor).
2. **Initialize AI**: Open the AI Chat dialog and prompt exactly: "**Please read SETUP.md to initialize the environment, then follow AGENTS.md to introduce yourself.**"
3. **Docker Sandbox**: All code execution and package installation will happen safely inside a Docker container, keeping your local machine clean.

### 📤 1-Click Homework Submission Protocol
This toolkit includes a secure large-file submission system (up to 5GB, no LMS login required).
- **How to Use**:
  1. Place your assignment file (`.zip`, `.pdf`, or `.mp4`) into the `homework_submission/` directory.
  2. Tell your AI in the chat: **"Please submit my homework. The file is in homework_submission. The category is [e.g., Final Project], my Student ID is [Your ID], and my name is [Your Name]."**
  3. The AI will trigger the submission script. A browser window will pop up asking for your **Google (Gmail) login** for identity verification.
  4. Once authorized, the file uploads directly to the teacher's cloud drive!

