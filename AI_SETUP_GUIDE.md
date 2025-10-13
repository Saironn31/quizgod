# AI Quiz Generator Setup Guide

## 🤖 Google Gemini API Integration

The AI Quiz Generator now uses Google Gemini API for direct quiz generation with the following features:

### ✨ Features

1. **PDF Upload Support**
   - Upload study materials in PDF format
   - Automatic text extraction
   - Generate questions based on PDF content

2. **Customizable Generation**
   - Choose number of questions (1-50+)
   - Select difficulty level (Easy, Medium, Hard)
   - Write custom prompts for advanced control

3. **Smart Question Parsing**
   - Automatic detection of questions and answers
   - Supports multiple choice format
   - Identifies correct answers marked with asterisk (*)

4. **Real-time Generation**
   - Direct API integration - no copying/pasting needed
   - Instant results displayed in the interface
   - Auto-save draft functionality

## 🔑 Setup Instructions

### Step 1: Get Your Free Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Step 2: Add API Key to Your Project

1. Open your `.env.local` file in the project root
2. Find or add this line:
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key
4. Save the file

### Step 3: Restart Your Development Server

```bash
npm run dev
```

## 📖 How to Use

### Basic Usage

1. Navigate to **AI Quiz Generator** from the sidebar
2. Fill in:
   - Quiz Title (required)
   - Subject (required)
   - Topic/Content (required if no PDF)
3. Click **"Generate Questions with AI"**
4. Review generated questions
5. Click **"Create Quiz"** to save

### Using PDF Upload

1. Click **"Upload PDF File"** button
2. Select your PDF study material
3. Wait for text extraction (shows character count)
4. Topic field will auto-fill with PDF preview
5. Click **"Generate Questions with AI"**

### Advanced Options

1. Click **"Advanced: Custom Prompt"**
2. Write your own prompt to control generation
3. Example custom prompt:
   ```
   Create 10 challenging questions about quantum physics.
   Include explanations for each answer.
   Focus on wave-particle duality and uncertainty principle.
   ```

### Customization Options

- **Number of Questions**: 1-50+ questions per quiz
- **Difficulty Level**: Easy, Medium, or Hard
- **Class Assignment**: Optionally add to a class
- **Custom Prompts**: Full control over AI generation

## 📝 Question Format

The AI generates questions in this format:

```
1. What is the capital of France?
A) London
B) Paris*
C) Berlin
D) Madrid

2. Which planet is closest to the sun?
A) Venus
B) Mercury*
C) Earth
D) Mars
```

**Note:** The asterisk (*) marks the correct answer.

## 🆓 API Limits

Google Gemini offers a generous free tier:
- **60 requests per minute**
- **1,500 requests per day**
- **1 million tokens per minute**

This is more than enough for personal use!

## 🛠️ Troubleshooting

### "Please configure your Gemini API key"

- Make sure you added the API key to `.env.local`
- Restart your development server after adding the key
- Check that the key doesn't have extra spaces

### "Failed to generate questions"

- Check your internet connection
- Verify your API key is valid
- Try reducing the number of questions
- Check if you've exceeded free tier limits

### "No valid questions found"

- The AI response format might be incorrect
- Try being more specific in your topic/prompt
- Reduce complexity if using custom prompts

### PDF Upload Issues

- Ensure PDF is not password-protected
- Try PDFs with selectable text (not scanned images)
- Check that `pdf.worker.min.js` exists in `/public` folder

## 🔒 Security Notes

- API keys should never be committed to GitHub
- `.env.local` is already in `.gitignore`
- Don't share your API key publicly
- Regenerate key if accidentally exposed

## 💡 Tips for Best Results

1. **Be Specific**: Clear topics generate better questions
2. **Use PDFs**: Study materials create more accurate quizzes
3. **Adjust Difficulty**: Match quiz difficulty to your audience
4. **Review Questions**: Always check AI-generated content before using
5. **Save Drafts**: Form auto-saves, so you won't lose progress

## 🆘 Support

If you need help:
1. Check this guide first
2. Review error messages carefully
3. Verify all setup steps were completed
4. Check the [Google AI Studio Documentation](https://ai.google.dev/docs)

## 🎓 Example Use Cases

### For Students
- Generate practice quizzes from textbook PDFs
- Create study guides from lecture notes
- Test knowledge on specific topics

### For Teachers
- Quick quiz creation from course materials
- Differentiated difficulty levels
- Class-specific assessments

### For Self-Learners
- Test comprehension of articles/papers
- Create flashcard-style quizzes
- Track learning progress

---

**Ready to create amazing quizzes with AI? Get your API key and start generating!** 🚀
