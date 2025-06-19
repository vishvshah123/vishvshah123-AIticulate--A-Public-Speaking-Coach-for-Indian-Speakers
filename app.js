class AIticulate {
    constructor() {
        this.recognition = null;
        this.isRecording = false;
        this.transcript = '';
        this.startTime = null;
        this.endTime = null;
        this.userGoal = 'professional';
        this.settings = {
            accentPreference: 'neutral',
            speakingGoal: 'professional',
            feedbackDetail: 'detailed',
            focusAreas: {
                pronunciation: true,
                fluency: true,
                grammar: true,
                vocabulary: true
            }
        };
        
        // Speech analysis data
        this.speechData = {
            wordCount: 0,
            fillerWords: [],
            pauseCount: 0,
            pronunciationIssues: [],
            speakingRate: 0,
            duration: 0
        };
        
        // Application data
        this.appData = {
            common_pronunciation_challenges: {
                th_sounds: {
                    challenge: "Dental fricatives (th sounds)",
                    example_words: ["think", "this", "weather", "breath"],
                    typical_substitutions: ["t", "d"],
                    practice_tip: "Place your tongue between your teeth and push air out to make the correct 'th' sound."
                },
                v_w_sounds: {
                    challenge: "V and W confusion",
                    example_words: ["very", "wine", "vest", "west"],
                    typical_substitutions: ["w for v", "v for w"],
                    practice_tip: "For 'V', touch your upper teeth to your lower lip. For 'W', round your lips without teeth contact."
                },
                r_sounds: {
                    challenge: "R pronunciation",
                    example_words: ["red", "car", "professor", "right"],
                    typical_substitutions: ["tap or trill instead of approximant"],
                    practice_tip: "For English 'R', curl your tongue back without touching the roof of your mouth."
                },
                schwa_sounds: {
                    challenge: "Reduced vowels (schwa)",
                    example_words: ["about", "banana", "computer", "support"],
                    typical_substitutions: ["full vowel instead of schwa"],
                    practice_tip: "Relax your mouth for unstressed syllables, making a neutral 'uh' sound."
                }
            },
            filler_words: ["um", "uh", "like", "you know", "actually", "basically", "literally", "so", "well", "I mean"],
            practice_topics: [
                "Introduce yourself professionally",
                "Describe your latest project at work",
                "Explain a technical concept to a non-technical audience",
                "Give an impromptu speech about your favorite hobby",
                "Present a business idea to potential investors",
                "Answer common job interview questions",
                "Give a toast at a formal event",
                "Present quarterly results to stakeholders",
                "Explain your career journey in 2 minutes",
                "Respond to difficult customer service situations"
            ]
        };
        
        this.chatHistory = [];
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeSpeechRecognition();
        this.populatePracticeTopics();
        this.populatePronunciationHelp();
        this.loadSettings();
        this.initializeChatbot();
    }
    
    setupEventListeners() {
        // Welcome screen
        document.getElementById('get-started-btn').addEventListener('click', () => {
            this.showMainScreen();
        });
        
        // Goal selection
        document.querySelectorAll('.goal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.goal-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.userGoal = e.target.dataset.goal;
            });
        });
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.id.replace('-nav', ''));
            });
        });
        
        // Speech controls
        document.getElementById('start-recording').addEventListener('click', () => {
            this.startRecording();
        });
        
        document.getElementById('stop-recording').addEventListener('click', () => {
            this.stopRecording();
        });
        
        // Chatbot
        document.getElementById('send-message').addEventListener('click', () => {
            this.sendChatMessage();
        });
        
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
        
        // Chat suggestions
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('chat-input').value = e.target.textContent;
                this.sendChatMessage();
            });
        });
        
        // Settings
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });
    }
    
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-IN';
            
            this.recognition.onstart = () => {
                this.isRecording = true;
                this.startTime = new Date();
                document.getElementById('recording-status').textContent = 'Listening...';
                document.getElementById('mic-status').textContent = 'Microphone is active';
                document.getElementById('mic-status').className = 'status status--success';
                document.getElementById('mic-status').classList.remove('hidden');
                document.body.classList.add('recording');
                document.getElementById('start-recording').disabled = true;
                document.getElementById('stop-recording').disabled = false;
            };
            
            this.recognition.onresult = (event) => {
                this.handleSpeechResult(event);
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.handleSpeechError(event.error);
            };
            
            this.recognition.onend = () => {
                this.handleSpeechEnd();
            };
        } else {
            this.showBrowserCompatibilityError();
        }
    }
    
    startRecording() {
        if (this.recognition && !this.isRecording) {
            this.transcript = '';
            this.speechData = {
                wordCount: 0,
                fillerWords: [],
                pauseCount: 0,
                pronunciationIssues: [],
                speakingRate: 0,
                duration: 0
            };
            
            document.getElementById('transcription-container').innerHTML = '';
            document.getElementById('analysis-container').classList.add('hidden');
            
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting recognition:', error);
                this.handleSpeechError('start-error');
            }
        }
    }
    
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
    }
    
    handleSpeechResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        this.transcript = finalTranscript + interimTranscript;
        this.updateTranscriptionDisplay();
    }
    
    handleSpeechError(error) {
        let errorMessage = 'Speech recognition error occurred.';
        
        switch (error) {
            case 'no-speech':
                errorMessage = 'No speech detected. Please try speaking louder.';
                break;
            case 'audio-capture':
                errorMessage = 'Microphone not available. Please check your microphone settings.';
                break;
            case 'not-allowed':
                errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
                break;
            case 'network':
                errorMessage = 'Network error occurred. Please check your internet connection.';
                break;
            default:
                errorMessage = `Speech recognition error: ${error}`;
        }
        
        document.getElementById('recording-status').textContent = errorMessage;
        document.getElementById('mic-status').textContent = 'Error occurred';
        document.getElementById('mic-status').className = 'status status--error';
        
        this.resetRecordingState();
    }
    
    handleSpeechEnd() {
        this.isRecording = false;
        this.endTime = new Date();
        this.resetRecordingState();
        
        if (this.transcript.trim()) {
            this.analyzeSpeech();
            this.displayAnalysis();
        } else {
            document.getElementById('recording-status').textContent = 'No speech detected. Please try again.';
        }
    }
    
    resetRecordingState() {
        document.body.classList.remove('recording');
        document.getElementById('start-recording').disabled = false;
        document.getElementById('stop-recording').disabled = true;
        document.getElementById('recording-status').textContent = 'Recording stopped';
        document.getElementById('mic-status').classList.add('hidden');
    }
    
    updateTranscriptionDisplay() {
        const container = document.getElementById('transcription-container');
        container.innerHTML = this.transcript || '<span style="color: var(--color-text-secondary);">Your speech will appear here...</span>';
        container.scrollTop = container.scrollHeight;
    }
    
    analyzeSpeech() {
        const text = this.transcript.toLowerCase();
        const words = text.split(/\s+/).filter(word => word.length > 0);
        
        // Basic metrics
        this.speechData.wordCount = words.length;
        this.speechData.duration = (this.endTime - this.startTime) / 1000; // in seconds
        this.speechData.speakingRate = Math.round((this.speechData.wordCount / this.speechData.duration) * 60); // WPM
        
        // Analyze filler words
        this.speechData.fillerWords = [];
        this.appData.filler_words.forEach(filler => {
            const regex = new RegExp(`\\b${filler}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) {
                this.speechData.fillerWords.push({
                    word: filler,
                    count: matches.length
                });
            }
        });
        
        // Analyze pronunciation issues
        this.analyzePronunciation(text);
        
        // Count pauses (approximate based on punctuation and long words)
        this.speechData.pauseCount = (text.match(/[.!?]/g) || []).length;
    }
    
    analyzePronunciation(text) {
        this.speechData.pronunciationIssues = [];
        
        // Check for common Indian English pronunciation challenges
        Object.entries(this.appData.common_pronunciation_challenges).forEach(([key, challenge]) => {
            const hasChallengingWords = challenge.example_words.some(word => 
                text.includes(word.toLowerCase())
            );
            
            if (hasChallengingWords) {
                this.speechData.pronunciationIssues.push({
                    type: key,
                    challenge: challenge.challenge,
                    words: challenge.example_words.filter(word => text.includes(word.toLowerCase())),
                    tip: challenge.practice_tip
                });
            }
        });
    }
    
    displayAnalysis() {
        const container = document.getElementById('analysis-container');
        
        // Speaking rate
        const rateElement = document.getElementById('speaking-rate-value');
        const rateFeedback = document.getElementById('speaking-rate-feedback');
        rateElement.textContent = `${this.speechData.speakingRate} WPM`;
        
        if (this.speechData.speakingRate < 120) {
            rateFeedback.textContent = 'Try speaking a bit faster';
            rateFeedback.style.color = 'var(--color-warning)';
        } else if (this.speechData.speakingRate > 150) {
            rateFeedback.textContent = 'Try slowing down for clarity';
            rateFeedback.style.color = 'var(--color-warning)';
        } else {
            rateFeedback.textContent = 'Great speaking pace!';
            rateFeedback.style.color = 'var(--color-success)';
        }
        
        // Filler words
        const fillerCount = this.speechData.fillerWords.reduce((sum, filler) => sum + filler.count, 0);
        document.getElementById('filler-count-value').textContent = fillerCount;
        const fillerFeedback = document.getElementById('filler-feedback');
        
        if (fillerCount === 0) {
            fillerFeedback.textContent = 'Excellent! No filler words detected.';
            fillerFeedback.style.color = 'var(--color-success)';
        } else if (fillerCount <= 3) {
            fillerFeedback.textContent = 'Good job keeping filler words minimal.';
            fillerFeedback.style.color = 'var(--color-success)';
        } else {
            fillerFeedback.textContent = 'Try reducing filler words for clearer speech.';
            fillerFeedback.style.color = 'var(--color-warning)';
        }
        
        // Pauses
        document.getElementById('pause-count-value').textContent = this.speechData.pauseCount;
        document.getElementById('pause-feedback').textContent = 'Natural pauses help with clarity';
        
        // Duration
        const minutes = Math.floor(this.speechData.duration / 60);
        const seconds = Math.floor(this.speechData.duration % 60);
        document.getElementById('duration-value').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Pronunciation issues
        const pronunciationContainer = document.getElementById('pronunciation-issues');
        pronunciationContainer.innerHTML = '';
        
        if (this.speechData.pronunciationIssues.length > 0) {
            this.speechData.pronunciationIssues.forEach(issue => {
                const issueDiv = document.createElement('div');
                issueDiv.className = 'pronunciation-issue';
                issueDiv.innerHTML = `
                    <strong>${issue.challenge}</strong><br>
                    Words detected: ${issue.words.join(', ')}<br>
                    <em>Tip: ${issue.tip}</em>
                `;
                pronunciationContainer.appendChild(issueDiv);
            });
        } else {
            pronunciationContainer.innerHTML = '<p style="color: var(--color-success);">No major pronunciation issues detected. Great job!</p>';
        }
        
        // Suggestions
        this.generateSuggestions();
        
        container.classList.remove('hidden');
    }
    
    generateSuggestions() {
        const suggestions = [];
        
        // Speaking rate suggestions
        if (this.speechData.speakingRate < 120) {
            suggestions.push('Practice speaking with more confidence to increase your pace naturally.');
        } else if (this.speechData.speakingRate > 150) {
            suggestions.push('Take deeper breaths between sentences to slow down your speech.');
        }
        
        // Filler word suggestions
        const fillerCount = this.speechData.fillerWords.reduce((sum, filler) => sum + filler.count, 0);
        if (fillerCount > 3) {
            suggestions.push('Replace filler words with short pauses to sound more professional.');
            suggestions.push('Practice your speech beforehand to reduce hesitation.');
        }
        
        // Pronunciation suggestions
        if (this.speechData.pronunciationIssues.length > 0) {
            suggestions.push('Focus on the pronunciation challenges identified above.');
            suggestions.push('Practice tongue twisters with your difficult sounds.');
        }
        
        // General suggestions
        suggestions.push('Record yourself regularly to track improvement over time.');
        suggestions.push('Practice in front of a mirror to work on body language too.');
        
        const suggestionsList = document.getElementById('suggestions-list');
        suggestionsList.innerHTML = '';
        suggestions.forEach(suggestion => {
            const li = document.createElement('li');
            li.textContent = suggestion;
            suggestionsList.appendChild(li);
        });
    }
    
    // Chatbot functionality
    initializeChatbot() {
        this.addChatMessage('ai', 'Welcome to AIticulate! I\'m your AI speech coach. How can I help you improve your speaking skills today?');
    }
    
    sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
            this.addChatMessage('user', message);
            input.value = '';
            
            // Simulate AI response
            setTimeout(() => {
                const response = this.generateChatResponse(message);
                this.addChatMessage('ai', response);
            }, 1000);
        }
    }
    
    addChatMessage(sender, message) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? 'U' : 'AI';
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        this.chatHistory.push({ sender, message, timestamp: new Date() });
    }
    
    generateChatResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Pronunciation help
        if (message.includes('th') || message.includes('pronunciation')) {
            return "For 'th' sounds, place your tongue between your teeth and push air out. Practice with words like 'think', 'this', 'weather'. The key is to let your tongue gently touch your teeth while making the sound.";
        }
        
        if (message.includes('filler') || message.includes('um') || message.includes('uh')) {
            return "To reduce filler words, try these techniques: 1) Pause instead of saying 'um' 2) Practice your speech beforehand 3) Speak slower to give yourself time to think 4) Record yourself to become aware of your filler patterns.";
        }
        
        if (message.includes('interview')) {
            return "For interview preparation: 1) Practice the STAR method (Situation, Task, Action, Result) 2) Research common questions in your field 3) Practice speaking clearly and confidently 4) Prepare 2-3 questions to ask the interviewer. Would you like to practice some mock interview questions?";
        }
        
        if (message.includes('rate') || message.includes('speed') || message.includes('fast') || message.includes('slow')) {
            return "The ideal speaking rate is 120-150 words per minute. If you're speaking too fast, focus on breathing and pausing between thoughts. If too slow, practice building confidence in your content. Remember, varying your pace can make your speech more engaging!";
        }
        
        if (message.includes('confidence')) {
            return "Building speaking confidence takes practice! Start with: 1) Know your content well 2) Practice in front of a mirror 3) Record yourself speaking 4) Start with small, supportive audiences 5) Focus on your message, not your nervousness. Remember, even experienced speakers feel nervous sometimes!";
        }
        
        if (message.includes('accent') || message.includes('indian english')) {
            return "Indian English is perfectly valid! Focus on clarity rather than changing your accent. Work on: 1) Clear consonant sounds 2) Proper stress patterns 3) Smooth linking between words 4) Confident delivery. Your accent is part of your identity - embrace it while working on clarity!";
        }
        
        // Based on recent speech analysis
        if (this.speechData.wordCount > 0) {
            if (message.includes('feedback') || message.includes('analysis')) {
                let feedback = `Based on your recent speech: `;
                
                if (this.speechData.speakingRate < 120) {
                    feedback += `You spoke at ${this.speechData.speakingRate} WPM, which is a bit slow. Try building confidence to naturally increase your pace. `;
                } else if (this.speechData.speakingRate > 150) {
                    feedback += `You spoke at ${this.speechData.speakingRate} WPM, which is quite fast. Focus on slowing down for better clarity. `;
                } else {
                    feedback += `Your speaking rate of ${this.speechData.speakingRate} WPM is excellent! `;
                }
                
                const fillerCount = this.speechData.fillerWords.reduce((sum, filler) => sum + filler.count, 0);
                if (fillerCount > 0) {
                    feedback += `I noticed ${fillerCount} filler words. Try replacing these with pauses. `;
                }
                
                return feedback + "Keep practicing - you're doing great!";
            }
        }
        
        // General encouragement and tips
        const responses = [
            "That's a great question! Speaking skills improve with consistent practice. What specific area would you like to focus on today?",
            "I'm here to help you become a more confident speaker. Can you tell me more about your speaking goals?",
            "Public speaking is a skill that can be learned and improved. What challenges are you facing currently?",
            "Remember, even professional speakers started as beginners. What would you like to practice today?",
            "Your speaking journey is unique to you. Let's work together to build your confidence and skills!"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Navigation and UI management
    showMainScreen() {
        document.getElementById('welcome-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
    }
    
    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${section}-nav`).classList.add('active');
        
        // Update sections
        document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`${section}-section`).classList.add('active');
    }
    
    populatePracticeTopics() {
        const select = document.getElementById('practice-topic');
        this.appData.practice_topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic;
            select.appendChild(option);
        });
    }
    
    populatePronunciationHelp() {
        const container = document.getElementById('pronunciation-help');
        Object.values(this.appData.common_pronunciation_challenges).forEach(challenge => {
            const div = document.createElement('div');
            div.className = 'pronunciation-challenge';
            div.innerHTML = `
                <h5>${challenge.challenge}</h5>
                <div class="examples">Examples: ${challenge.example_words.join(', ')}</div>
                <div class="tip">${challenge.practice_tip}</div>
            `;
            container.appendChild(div);
        });
    }
    
    loadSettings() {
        const saved = localStorage.getItem('aiticulate-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            this.applySettings();
        }
    }
    
    saveSettings() {
        this.settings.accentPreference = document.getElementById('accent-preference').value;
        this.settings.speakingGoal = document.getElementById('speaking-goal').value;
        this.settings.feedbackDetail = document.getElementById('feedback-detail').value;
        this.settings.focusAreas = {
            pronunciation: document.getElementById('focus-pronunciation').checked,
            fluency: document.getElementById('focus-fluency').checked,
            grammar: document.getElementById('focus-grammar').checked,
            vocabulary: document.getElementById('focus-vocabulary').checked
        };
        
        localStorage.setItem('aiticulate-settings', JSON.stringify(this.settings));
        
        // Show confirmation
        const btn = document.getElementById('save-settings');
        const originalText = btn.textContent;
        btn.textContent = 'Settings Saved!';
        btn.style.background = 'var(--color-success)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
    
    applySettings() {
        document.getElementById('accent-preference').value = this.settings.accentPreference;
        document.getElementById('speaking-goal').value = this.settings.speakingGoal;
        document.getElementById('feedback-detail').value = this.settings.feedbackDetail;
        document.getElementById('focus-pronunciation').checked = this.settings.focusAreas.pronunciation;
        document.getElementById('focus-fluency').checked = this.settings.focusAreas.fluency;
        document.getElementById('focus-grammar').checked = this.settings.focusAreas.grammar;
        document.getElementById('focus-vocabulary').checked = this.settings.focusAreas.vocabulary;
    }
    
    showBrowserCompatibilityError() {
        const container = document.getElementById('transcription-container');
        container.innerHTML = `
            <div style="text-align: center; color: var(--color-error); padding: var(--space-24);">
                <h4>Browser Not Supported</h4>
                <p>Your browser doesn't support the Web Speech API. Please use Google Chrome or Microsoft Edge for the best experience.</p>
                <p>You can still use the chatbot feature to get speaking tips and advice!</p>
            </div>
        `;
        
        document.getElementById('start-recording').disabled = true;
        document.getElementById('stop-recording').disabled = true;
        document.getElementById('recording-status').textContent = 'Speech recognition not available in this browser';
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new AIticulate();
    
    // Handle browser compatibility
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported in this browser');
    }
    
    // Service worker registration for offline support (optional)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service worker registration failed:', err);
        });
    }
});