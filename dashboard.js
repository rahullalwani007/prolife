// Display user name
const userNameElement = document.getElementById('userName');
if (userNameElement) {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        userNameElement.textContent = currentUser.username;
    }
}

// Handle image switching and voice
const previewImage = document.getElementById('previewImage');
const controlButtons = document.querySelectorAll('.control-btn');

// Set initial image
if (previewImage) {
    previewImage.style.opacity = '1';
}

// Function to play AI voice
function playAIVoice() {
    const message = new SpeechSynthesisUtterance("Welcome to Finance AI. I'm your AI finance assistant. Click on the image to Know More");
    message.rate = 1; // Normal speed
    message.pitch = 1; // Normal pitch
    message.volume = 1; // Full volume
    
    // Try to use a female voice if available
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => voice.name.includes('female') || voice.name.includes('Female'));
    if (femaleVoice) {
        message.voice = femaleVoice;
    }
    
    window.speechSynthesis.speak(message);
}

// Load voices
window.speechSynthesis.onvoiceschanged = function() {
    const voices = window.speechSynthesis.getVoices();
    console.log('Voices loaded:', voices.length);
};

controlButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        controlButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Get the image path from data attribute
        const imagePath = this.getAttribute('data-image');
        
        if (previewImage && imagePath) {
            // Fade out current image
            previewImage.style.opacity = '0';
            
            // Change image source and fade in after a short delay
            setTimeout(() => {
                previewImage.src = imagePath;
                previewImage.style.opacity = '1';
                
                // Play voice only for AI button
                if (imagePath === 'ai.png') {
                    playAIVoice();
                }
            }, 300);
        }
    });
});

// Handle logout
document.querySelector('.logout-btn').addEventListener('click', function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

// Phone mockup interactions
document.addEventListener('DOMContentLoaded', function() {
    const previewImage = document.getElementById('previewImage');
    const aiButton = document.getElementById('aiButton');
    const expertButton = document.getElementById('humanButton');
    const planButton = document.getElementById('planButton');

    function switchImage(imagePath) {
        previewImage.classList.add('fade');
        setTimeout(() => {
            previewImage.src = imagePath;
            previewImage.classList.remove('fade');
        }, 300);
    }

    function speakText(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1; // Normal speed
        utterance.pitch = 1; // Normal pitch
        utterance.volume = 1; // Full volume
        utterance.voice = speechSynthesis.getVoices().find(voice => voice.name.includes('Female')) || speechSynthesis.getVoices()[0];
        speechSynthesis.speak(utterance);
    }

    aiButton.addEventListener('click', function() {
        document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        switchImage('ai.png');
        speakText("I'm your AI finance expert");
    });

    expertButton.addEventListener('click', function() {
        document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        switchImage('human.jpg');
        
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        this.style.pointerEvents = 'none';
        
        setTimeout(() => {
            window.location.href = 'https://calendly.com/rahullalwani305';
        }, 1000);
    });

    planButton.addEventListener('click', function() {
        document.querySelectorAll('.control-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        switchImage('plan.jpeg');
        
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        this.style.pointerEvents = 'none';
        
        setTimeout(() => {
            window.location.href = 'plan-form.html';
        }, 300);
    });
});

// Add smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});
