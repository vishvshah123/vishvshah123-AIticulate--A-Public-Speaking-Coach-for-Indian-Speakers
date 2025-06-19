# AIticulate Technical Documentation

## Application Architecture

### Core Class Structure

```javascript
class AIticulate {
    constructor() {
        // Initialize speech recognition, settings, and data structures
    }
    
    // Speech Recognition Methods
    initializeSpeechRecognition()  // Sets up Web Speech API
    startRecording()               // Begins speech capture
    stopRecording()                // Ends speech capture and analyzes
    
    // Analysis Methods
    analyzeSpeech(transcript)      // Performs comprehensive speech analysis
    detectFillerWords(text)        // Identifies um, uh, like, etc.
    checkPronunciation(text)       // Finds Indian English pronunciation issues
    calculateSpeakingRate()        // Computes words per minute
    
    // Chatbot Methods
    handleUserMessage(message)     // Processes user chat input
    generateResponse(message)      // Creates AI coach responses
    getCoachingAdvice()           // Provides personalized feedback
    
    // UI Methods
    showScreen(screenId)          // Navigation between app sections
    updateProgress()              // Updates progress tracking
    displayFeedback()             // Shows analysis results
}
```

### Key Features Implementation

#### 1. Speech Recognition System
```javascript
initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configuration for Indian English
        this.recognition.lang = 'en-IN';  // Indian English
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        // Event handlers for real-time processing
        this.recognition.onresult = (event) => {
            // Process speech results in real-time
        };
    }
}
```

#### 2. Indian English Pronunciation Analysis
```javascript
checkPronunciation(text) {
    const issues = [];
    const words = text.toLowerCase().split(' ');
    
    // Check for TH sound issues
    const thWords = ['think', 'this', 'that', 'weather', 'breath'];
    words.forEach(word => {
        if (thWords.some(thWord => word.includes(thWord))) {
            // Detect potential t/d substitutions
            issues.push({
                type: 'th_sounds',
                word: word,
                suggestion: this.appData.common_pronunciation_challenges.th_sounds.practice_tip
            });
        }
    });
    
    // Check for V/W confusion
    const vwWords = ['very', 'wine', 'vest', 'west', 'value', 'water'];
    // Implementation for V/W detection
    
    return issues;
}
```

#### 3. Fluency Metrics Calculation
```javascript
calculateSpeakingRate() {
    const words = this.transcript.trim().split(/\s+/).length;
    const minutes = this.speechData.duration / 60000; // Convert ms to minutes
    const wpm = Math.round(words / minutes);
    
    let assessment = '';
    if (wpm < 120) assessment = 'too slow';
    else if (wpm > 150) assessment = 'too fast';
    else assessment = 'good pace';
    
    return { wpm, assessment, words };
}
```

#### 4. AI Chatbot Engine
```javascript
handleUserMessage(message) {
    const lowerMessage = message.toLowerCase();
    let response = '';
    
    // Intent recognition for coaching topics
    if (lowerMessage.includes('pronunciation') || lowerMessage.includes('accent')) {
        response = this.getRandomResponse(this.appData.coaching_responses.pronunciation_feedback);
    } else if (lowerMessage.includes('fluency') || lowerMessage.includes('speaking rate')) {
        response = this.getRandomResponse(this.appData.coaching_responses.fluency_feedback);
    } else if (lowerMessage.includes('interview') || lowerMessage.includes('job')) {
        response = this.generateInterviewQuestions();
    } else {
        response = this.getRandomResponse(this.appData.coaching_responses.greeting);
    }
    
    return response;
}
```

#### 5. Progress Tracking System
```javascript
updateProgress() {
    const sessions = JSON.parse(localStorage.getItem('aiticulate_sessions') || '[]');
    
    sessions.push({
        date: new Date().toISOString(),
        speakingRate: this.speechData.speakingRate,
        fillerWordsCount: this.speechData.fillerWords.length,
        pronunciationIssues: this.speechData.pronunciationIssues.length,
        duration: this.speechData.duration,
        goal: this.userGoal
    });
    
    localStorage.setItem('aiticulate_sessions', JSON.stringify(sessions));
    this.displayProgressChart(sessions);
}
```

## Data Structures

### Speech Analysis Data
```javascript
speechData = {
    wordCount: 0,              // Total words spoken
    fillerWords: [],           // Array of detected filler words
    pauseCount: 0,             // Number of pauses detected
    pronunciationIssues: [],   // Array of pronunciation challenges
    speakingRate: 0,           // Words per minute
    duration: 0                // Total speaking time in milliseconds
}
```

### User Settings
```javascript
settings = {
    accentPreference: 'neutral',    // neutral, american, british
    speakingGoal: 'professional',   // professional, interview, casual
    feedbackDetail: 'detailed',     // basic, detailed
    focusAreas: {
        pronunciation: true,
        fluency: true,
        grammar: true,
        vocabulary: true
    }
}
```

### Pronunciation Challenges Database
```javascript
common_pronunciation_challenges = {
    th_sounds: {
        challenge: "Dental fricatives (th sounds)",
        example_words: ["think", "this", "weather", "breath"],
        typical_substitutions: ["t", "d"],
        practice_tip: "Place your tongue between your teeth..."
    },
    v_w_sounds: {
        challenge: "V and W confusion",
        example_words: ["very", "wine", "vest", "west"],
        typical_substitutions: ["w for v", "v for w"],
        practice_tip: "For 'V', touch your upper teeth to your lower lip..."
    }
    // Additional pronunciation challenges...
}
```

## User Interface Components

### Screen Management
The application uses a single-page architecture with multiple screens:
- `welcome-screen`: Initial onboarding and goal setting
- `main-screen`: Primary application interface
- `settings-screen`: User preferences and customization

### Real-time Feedback Display
```javascript
displayFeedback() {
    const feedbackContainer = document.getElementById('analysis-results');
    
    // Display speaking rate
    const rateAnalysis = this.calculateSpeakingRate();
    
    // Display pronunciation issues
    const pronIssues = this.speechData.pronunciationIssues;
    
    // Display filler words
    const fillerWords = this.speechData.fillerWords;
    
    // Generate comprehensive feedback HTML
    feedbackContainer.innerHTML = this.generateFeedbackHTML({
        rate: rateAnalysis,
        pronunciation: pronIssues,
        fillers: fillerWords
    });
}
```

### Chatbot Interface
```javascript
displayChatMessage(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
```

## Browser Compatibility & Fallbacks

### Speech Recognition Support
```javascript
// Check for speech recognition support
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    this.showBrowserCompatibilityMessage();
    this.enableTextOnlyMode();
}

// Fallback for unsupported browsers
enableTextOnlyMode() {
    // Hide speech recording UI
    // Enable text input for practice
    // Provide text-based coaching only
}
```

### Mobile Optimization
The application includes responsive design elements:
- Touch-friendly button sizes
- Mobile-optimized layouts
- Gesture support for navigation
- Reduced complexity on smaller screens

## Performance Optimization

### Memory Management
```javascript
// Clean up speech recognition resources
cleanupRecording() {
    if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
    }
    
    // Clear large transcripts from memory
    if (this.transcript.length > 10000) {
        this.transcript = this.transcript.slice(-5000);
    }
}
```

### Efficient Analysis
- Real-time processing with debouncing
- Chunked analysis for long speeches
- Lazy loading of coaching responses
- Optimized regex patterns for pronunciation detection

## Security & Privacy

### Data Handling
- All speech processing happens client-side
- No audio data sent to external servers
- Local storage for progress tracking only
- No personally identifiable information collected

### Browser Permissions
```javascript
// Request microphone permission gracefully
async requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        this.showMicrophonePermissionError();
        return false;
    }
}
```

This technical documentation provides developers with the necessary information to understand, maintain, and extend the AIticulate application.