# LOVA - Personal Style Coach

**Repository:** [https://github.com/canduzcd-ops/Lova-v1](https://github.com/canduzcd-ops/Lova-v1)

LOVA is an AI-powered minimalist wardrobe manager and style consultant application. It helps users organize their wardrobe, get daily outfit suggestions based on AI analysis, and receive personalized style tips.

## Features

- **Wardrobe Management**: Upload and categorize your clothes.
- **AI Style Analysis**: Automatically tags and analyzes uploaded items using Google Gemini Vision.
- **Smart Outfit Generator**: Creates outfit combinations based on your wardrobe and style preferences.
- **Daily Style Briefing**: Provides a daily mantra, color palette, and specific style tips.
- **Premium Features**: Splash Studio (Video generation with Gemini Veo), detailed insights, and unlimited storage.

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **AI**: Google Gemini API (Gemini 2.5 Flash, Gemini Veo)
- **Backend/Auth**: Supabase
- **Icons**: Lucide React

## Setup & Run

### Cloud / AI Studio
No setup required. The application runs natively in the browser environment.

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/canduzcd-ops/Lova-v1.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file and add your API keys:
   ```
   API_KEY=your_google_gemini_api_key
   ```

4. Run the application:
   ```bash
   npm start
   ```

## License

All rights reserved.