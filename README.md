# HLD Designer

A collaborative High-Level Design (HLD) canvas application with AI-powered insights for system design interviews and architecture planning.

## Features

- 🎨 **Interactive Canvas**: Draw system architecture diagrams with rectangles, circles, text, arrows, and lines
- 🔐 **Firebase Authentication**: Secure user authentication and authorization
- 💾 **Cloud Storage**: Save and manage multiple design projects in Firebase Firestore
- 🤖 **AI-Powered Insights**: Get real-time feedback on your designs using your own LLM API key
- 🔑 **User-Owned API Keys**: Each user provides their own LLM API key during registration (stored securely in Firestore)
- 📚 **System Design Topics**: Organized topics covering requirements, architecture, scaling, data, APIs, security, and monitoring
- 🔍 **Smart Questions**: Pre-defined questions for each topic to guide your design process
- 💡 **Interactive Interview Mode**: Ask questions and get expert-level insights on your current design

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **Canvas**: Konva + React Konva
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **AI Integration**: OpenAI/Custom LLM API
- **Build Tool**: Vite
- **Routing**: React Router

## Project Structure

```
src/
├── components/
│   ├── auth/              # Authentication components
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── canvas/            # Canvas drawing components
│   │   ├── Canvas.tsx
│   │   └── Toolbar.tsx
│   ├── design/            # Design management
│   │   └── DesignsList.tsx
│   ├── insights/          # AI insights panel
│   │   └── InsightPanel.tsx
│   ├── layout/            # Layout components
│   │   └── Header.tsx
│   └── topics/            # System design topics
│       └── TopicsList.tsx
├── config/
│   └── firebase.ts        # Firebase configuration
├── data/
│   └── systemDesignTopics.ts  # System design topics data
├── pages/
│   ├── AuthPage.tsx       # Authentication page
│   └── DesignerPage.tsx   # Main designer page
├── services/
│   ├── authService.ts     # Authentication service
│   ├── designService.ts   # Design persistence service
│   └── llmService.ts      # LLM integration service
├── store/
│   ├── authStore.ts       # Auth state management
│   ├── canvasStore.ts     # Canvas state management
│   └── designStore.ts     # Design state management
├── types/
│   └── index.ts           # TypeScript type definitions
├── App.tsx                # Main app component
├── main.tsx               # Entry point
└── index.css              # Global styles
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Add security rules to Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /designs/{designId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null;
    }
  }
}
```

5. Copy your Firebase configuration

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Override the default LLM API URL (defaults to OpenAI)
# VITE_LLM_API_URL=https://api.openai.com/v1/chat/completions
```

**Note:** LLM API keys are now provided by users during registration and stored securely in their Firestore profile.

### 4. Run Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

## Usage Guide

### User Registration

1. Click "Create Account" on the login page
2. Fill in your details:
   - Display Name
   - Email Address
   - Password
   - **LLM API Key** (OpenAI, Anthropic, or compatible provider)
3. Your API key is securely stored and only used for generating design insights

### Creating a Design

1. Sign up or log in with your email
2. A new design is automatically created
3. Use the toolbar to select drawing tools
4. Click on the canvas to add elements
5. Drag elements to reposition them
6. Click "Save" to persist your design

### Drawing Tools

- **Select**: Select and manipulate elements
- **Rectangle**: Draw rectangular components
- **Circle**: Draw circular nodes
- **Text**: Add text labels (double-click to edit)
- **Arrow**: Draw directional arrows
- **Line**: Draw connecting lines

### Getting AI Insights

1. Draw your architecture on the canvas
2. Browse system design topics in the left panel
3. Click on a predefined question OR type your own
4. Click "Get Insights" to receive AI-powered feedback
5. Review suggestions and improve your design

### Managing Designs

- Click "My Designs" to view all saved designs
- Click on a design to load it
- Delete unwanted designs with the trash icon
- Create new designs with the "+" button

## System Design Topics

The application covers these essential topics:

1. **Requirements Gathering**: Functional and non-functional requirements
2. **System Architecture**: High-level design and component architecture
3. **Scalability & Performance**: Scaling strategies and optimization
4. **Data Management**: Database design and data flow
5. **API Design**: API endpoints and protocols
6. **Security & Privacy**: Authentication, authorization, and data protection
7. **Monitoring & Observability**: Logging, metrics, and alerting

## Contributing

This is a production-ready application. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for personal or commercial projects.
