# BroskisBot Setup Guide

## Overview
BroskisBot is the AI-powered virtual assistant for Broski's Kitchen. It helps customers with menu information, locations, events, and general inquiries about the restaurant.

## Features
- 🤖 AI-powered responses using OpenAI GPT-4
- 📚 Context-aware responses based on restaurant content
- 💬 Real-time chat interface
- 📱 Mobile-responsive design
- 🎯 Quick action buttons for common queries
- 💾 Chat history persistence
- 🔄 Loading states and error handling

## Setup Instructions

### 1. OpenAI API Key Configuration

**Required:** You need a valid OpenAI API key for BroskisBot to function.

1. **Get an OpenAI API Key:**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign up or log in to your account
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Configure the API Key:**
   - Open `.env.local` in the project root
   - Replace the placeholder with your actual API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-openai-api-key-here
   ```

3. **Restart the Development Server:**
   ```bash
   npm run dev
   ```

### 2. Testing BroskisBot

1. **Open the Application:**
   - Navigate to `https://broskiskitchen.com`
   - Look for the floating chat button (robot icon) in the bottom-right corner

2. **Test Basic Functionality:**
   - Click the chat button to open BroskisBot
   - Try the quick action buttons
   - Send a custom message like "Tell me about your menu"

3. **Expected Behavior:**
   - ✅ Chat opens with welcome message
   - ✅ Quick actions work
   - ✅ AI responds to custom messages
   - ✅ Loading indicator shows while processing
   - ✅ Chat history persists between sessions

## Troubleshooting

### Common Issues

#### 1. "AI services are not properly configured"
**Cause:** OpenAI API key is missing or invalid

**Solution:**
- Check `.env.local` file
- Ensure `OPENAI_API_KEY` is set to a valid key starting with `sk-`
- Restart the development server

#### 2. "Authentication issues with AI services"
**Cause:** Invalid or expired API key

**Solution:**
- Verify your API key is correct
- Check your OpenAI account billing and usage limits
- Generate a new API key if needed

#### 3. "High demand" or Rate Limit Errors
**Cause:** OpenAI API rate limits exceeded

**Solution:**
- Wait a few minutes before trying again
- Check your OpenAI usage dashboard
- Consider upgrading your OpenAI plan if needed

#### 4. Chat Button Not Appearing
**Cause:** Component not properly imported or rendered

**Solution:**
- Check that `ChatBot` is imported in `layout.tsx`
- Verify the component is rendered in the layout
- Check browser console for JavaScript errors

#### 5. Messages Not Persisting
**Cause:** localStorage issues or browser restrictions

**Solution:**
- Check browser console for localStorage errors
- Try clearing browser cache and localStorage
- Ensure cookies/localStorage are enabled

### Debug Mode

To enable debug logging:

1. **Check Server Logs:**
   ```bash
   npm run dev
   ```
   Look for console warnings about API key configuration

2. **Check Browser Console:**
   - Open browser developer tools (F12)
   - Look for errors in the Console tab
   - Check Network tab for failed API requests

3. **Test API Endpoint Directly:**
   ```bash
   curl -X POST https://broskiskitchen.com/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","text":"Hello"}],"userId":"test"}'
   ```

## Architecture

### Components
- **ChatBot.tsx** - Main chat interface component
- **ChatMessage.tsx** - Individual message display
- **WelcomeMessage.tsx** - Initial welcome screen with quick actions
- **ChatContext.tsx** - React context for chat state management

### Services
- **openai-chat.ts** - OpenAI API integration
- **vectorStore.ts** - Content search and retrieval
- **contentIndexer.ts** - Restaurant content indexing

### API Routes
- **/api/chat** - Main chat endpoint for processing messages

## Content Management

BroskisBot uses a vector store to search through restaurant content:

- Menu information
- Location details
- Event information
- General restaurant info

The content is automatically indexed from the website's data files in `/src/data/`.

## Performance Considerations

- **API Costs:** Each message costs OpenAI API credits
- **Rate Limits:** OpenAI has rate limits based on your plan
- **Response Time:** Typical response time is 2-5 seconds
- **Content Indexing:** Happens once on server startup

## Security

- ✅ API key stored in environment variables
- ✅ No sensitive data logged
- ✅ Input validation on API endpoints
- ✅ Error messages don't expose internal details

## Support

If you continue to experience issues:

1. Check this troubleshooting guide
2. Review the browser console for errors
3. Verify your OpenAI API key and billing status
4. Test with a simple message first
5. Check the development server logs

## API Key Security

⚠️ **Important Security Notes:**
- Never commit your actual API key to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Monitor your OpenAI usage dashboard
- Set up billing alerts to avoid unexpected charges

---

**Last Updated:** December 2024
**Version:** 1.0.0