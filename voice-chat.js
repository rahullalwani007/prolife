// Voice Chat Implementation
class VoiceChat {
    constructor() {
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.setupRecognition();
        this.groqApiKey = localStorage.getItem('GROQ_API_KEY');
    }

    setupRecognition() {
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            if (this.onSpeechRecognized) {
                this.onSpeechRecognized(text);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stopListening();
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Error restarting recognition:', error);
                    this.stopListening();
                }
            }
        };
    }

    startListening(onSpeechRecognized) {
        if (this.isListening) return;
        
        this.isListening = true;
        this.onSpeechRecognized = onSpeechRecognized;
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.stopListening();
        }
    }

    stopListening() {
        this.isListening = false;
        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Error stopping recognition:', error);
        }
    }

    speak(text) {
        return new Promise((resolve, reject) => {
            if (this.synthesis.speaking) {
                this.synthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onend = () => {
                this.isSpeaking = false;
                resolve();
            };

            utterance.onerror = (error) => {
                this.isSpeaking = false;
                console.error('Speech synthesis error:', error);
                reject(error);
            };

            this.isSpeaking = true;
            this.synthesis.speak(utterance);
        });
    }

    stopSpeaking() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    stopAll() {
        this.stopListening();
        this.stopSpeaking();
    }

    async getGroqResponse(question) {
        if (!this.groqApiKey) {
            throw new Error('Groq API key not found. Please set it in settings.');
        }

        const prompt = `You are a helpful financial AI assistant. The user asks: "${question}"
        Provide a clear, concise response focusing on financial advice and information.
        Format the response in clear points if applicable.
        Current context: User is managing their finances and debts.`;

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mixtral-8x7b-32768',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a financial assistant AI helping users manage their finances and debt. Keep responses clear and actionable.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from Groq API');
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Error calling Groq API:', error);
            return this.getFallbackResponse(question);
        }
    }

    getFallbackResponse(text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('balance') || lowerText.includes('money') || lowerText.includes('account')) {
            return "Your current balance is $5,000";
        } else if (lowerText.includes('emi') || lowerText.includes('payment') || lowerText.includes('due')) {
            return "Your next EMI payment of $500 is due on February 1st, 2024";
        } else if (lowerText.includes('debt') || lowerText.includes('loan') || lowerText.includes('owe')) {
            return "Your total debt is $15,000.\nHere's a breakdown:\n1. Personal Loan: $8,000\n2. Credit Card: $4,000\n3. Car Loan: $3,000";
        } else if (lowerText.includes('advice') || lowerText.includes('help') || lowerText.includes('suggest')) {
            return "Based on your financial situation, here's my advice:\n1. Prioritize paying off high-interest debt\n2. Build an emergency fund\n3. Consider debt consolidation\n4. Track your monthly expenses";
        } else {
            return "I'm here to help with your financial questions.\nTry asking about:\n- Your current balance\n- EMI payments\n- Debt analysis\n- Financial advice";
        }
    }
}

// Chat UI Component
class VoiceChatUI {
    constructor(container) {
        this.container = container;
        this.voiceChat = new VoiceChat();
        this.setupUI();
        this.setupEventListeners();
        
        // Request microphone permission
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop());
                console.log("Microphone permission granted");
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                alert('Please allow microphone access to use voice features');
            });
    }

    setupUI() {
        // Get references to existing UI elements
        this.messagesContainer = this.container.querySelector('.chat-container');
        this.voiceButton = this.container.querySelector('.voice-button');
        this.stopButton = this.container.querySelector('.stop-button');

        if (!this.messagesContainer) {
            this.messagesContainer = document.createElement('div');
            this.messagesContainer.className = 'chat-messages';
            this.container.insertBefore(this.messagesContainer, this.container.firstChild);
        }
    }

    setupEventListeners() {
        // Voice button click handler
        this.voiceButton.addEventListener('click', () => {
            this.toggleVoiceChat();
        });

        // Stop button click handler
        this.stopButton.addEventListener('click', () => {
            this.stopAIVoice();
        });

        // Listen for voice chat events
        this.voiceChat.onStartListening = () => {
            this.voiceButton.classList.add('listening');
            this.voiceButton.querySelector('span').textContent = 'Listening...';
        };

        this.voiceChat.onStopListening = () => {
            this.voiceButton.classList.remove('listening');
            this.voiceButton.querySelector('span').textContent = 'Click to speak';
        };

        this.voiceChat.onStartSpeaking = () => {
            this.stopButton.style.display = 'flex';
        };

        this.voiceChat.onStopSpeaking = () => {
            this.stopButton.style.display = 'none';
        };
    }

    addMessage(type, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <i class="fas fa-user"></i>
                    <p>${text}</p>
                </div>
            `;
            this.messagesContainer.appendChild(messageDiv);
        } else if (type === 'ai') {
            // Create AI message container
            messageDiv.innerHTML = `
                <div class="message-content">
                    <i class="fas fa-robot"></i>
                    <div class="ai-text"></div>
                </div>
            `;
            this.messagesContainer.appendChild(messageDiv);
            
            // Split response into lines and animate
            const aiText = messageDiv.querySelector('.ai-text');
            const lines = text.split('\n');
            
            lines.forEach((line, index) => {
                const lineDiv = document.createElement('div');
                lineDiv.className = 'message-line';
                lineDiv.textContent = line;
                aiText.appendChild(lineDiv);
                
                // Animate each line with a delay
                setTimeout(() => {
                    lineDiv.classList.add('visible');
                }, index * 500); // 500ms delay between each line
            });
        }
        
        // Scroll to bottom
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    async handleQuestion(question) {
        // Add user's question to chat
        this.addMessage('user', question);
        
        try {
            // Get AI response using Groq
            const response = await this.voiceChat.getGroqResponse(question);

            // First speak the response
            this.voiceChat.speak(response).catch(error => {
                console.error('Error speaking response:', error);
            });

            // Then show the response with animation
            setTimeout(() => {
                this.addMessage('ai', response);
            }, 100);
        } catch (error) {
            console.error('Error getting AI response:', error);
            const fallbackResponse = this.voiceChat.getFallbackResponse(question);
            this.voiceChat.speak(fallbackResponse);
            this.addMessage('ai', fallbackResponse);
        }
    }

    toggleVoiceChat() {
        if (this.isListening) {
            this.stopVoiceChat();
        } else {
            this.startVoiceChat();
        }
    }

    startVoiceChat() {
        if (this.isListening) return;
        
        this.isListening = true;
        this.voiceButton.classList.add('listening');
        this.voiceButton.querySelector('span').textContent = 'Listening...';
        this.stopButton.style.display = 'flex';
        
        this.voiceChat.startListening((text) => {
            if (!this.isListening) return;
            this.handleQuestion(text);
        });
    }

    stopVoiceChat() {
        this.isListening = false;
        this.voiceButton.classList.remove('listening');
        this.voiceButton.querySelector('span').textContent = 'Click to speak';
        this.stopButton.style.display = 'none';
        this.voiceChat.stopAll();
    }

    stopAIVoice() {
        this.voiceChat.stopSpeaking();
        this.stopButton.style.display = 'none';
    }
}

// Initialize voice chat when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create a container for the voice chat if it doesn't exist
    let chatContainer = document.getElementById('voiceChatContainer');
    if (!chatContainer) {
        chatContainer = document.createElement('div');
        chatContainer.id = 'voiceChatContainer';
        document.body.appendChild(chatContainer);
    }

    // Initialize voice chat UI
    const voiceChatUI = new VoiceChatUI(chatContainer);
});
