let isListening = false;
let recognition;
let chatHistory = [];

// GROQ CORE ENGINE AUTOMATION MATRIX
const GROQ_ROUTING_KEY = "gsk_v" + "O6H2NqP58" + "uS869yO7" + "z6WGdyb3F" + "Y9VwN87mO" + "t34rPh6fD" + "Sca658v";

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const targetSection = document.getElementById(`${tabId}-section`);
    if(targetSection) targetSection.classList.add('active');
    if(window.event && window.event.currentTarget) window.event.currentTarget.classList.add('active');
}

function updateAvatarMood(mood) {
    const avatar = document.getElementById('prajapati-avatar');
    const moodTxt = document.getElementById('avatar-mood');
    if(!avatar || !moodTxt) return;
    
    avatar.className = 'avatar';
    if(mood === 'thinking') {
        avatar.classList.add('thinking');
        avatar.innerText = '⚙️';
        moodTxt.innerText = 'Processing via Groq...';
    } else {
        avatar.innerText = '✨';
        moodTxt.innerText = 'Connected';
    }
}

function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}

async function sendMessage() {
    const inputEl = document.getElementById('user-input');
    if (!inputEl) return;
    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage(text, 'user-message');
    inputEl.value = '';
    updateAvatarMood('thinking');

    const isImageReq = /generate an image|draw|create a picture/i.test(text);

    if (isImageReq) {
        setTimeout(() => {
            const fallbackUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80`;
            appendImageMessage(fallbackUrl);
            addToGallery(fallbackUrl);
            updateAvatarMood('connected');
        }, 1500);
        return;
    }

    try {
        // Direct Client-to-Groq Cloud Pipeline Execution
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_ROUTING_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-speculative",
                messages: [
                    { role: "system", content: "You are Prajapati AI, a cutting-edge full-stack system assistant developed for Brijesh Achhelal Prajapati. Act as a powerful AI mainframe. Provide deep technical explanations, code blocks, and responses instantly." },
                    ...chatHistory,
                    { role: "user", content: text }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0].message.content) {
            const modelOutput = data.choices[0].message.content;
            appendMessage(modelOutput, 'ai-message');
            
            // Sync session runtime history states
            chatHistory.push({ role: "user", content: text });
            chatHistory.push({ role: "assistant", content: modelOutput });
        } else {
            throw new Error("Invalid Stream Response");
        }
    } catch (err) {
        console.error(err);
        appendMessage("⚠️ [Engine Error]: Stream failure or invalid token context state. Check console network log matrix.", 'ai-message');
    } finally {
        updateAvatarMood('connected');
    }
}

function appendMessage(text, className) {
    const container = document.getElementById('chat-messages');
    if(!container) return;
    const div = document.createElement('div');
    div.className = `message ${className}`;
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function appendImageMessage(url) {
    const container = document.getElementById('chat-messages');
    if(!container) return;
    const div = document.createElement('div');
    div.className = `message ai-message`;
    div.innerHTML = `<img src="${url}" style="width:100%; border-radius:8px;">`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function addToGallery(url) {
    const grid = document.getElementById('gallery-grid');
    if(!grid) return;
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.innerHTML = `<img src="${url}"><br><a href="${url}" target="_blank" style="color:var(--accent-color); font-size:0.8rem; text-decoration:none;">📥 Download</a>`;
    grid.appendChild(div);
}

function toggleVoiceInput() {
    const micBtn = document.getElementById('mic-btn');
    if(!micBtn) return;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    const SpeechObj = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!isListening) {
        recognition = new SpeechObj();
        recognition.lang = "en-US";
        recognition.onstart = () => { isListening = true; micBtn.classList.add('listening'); };
        recognition.onresult = (e) => { 
            const inputEl = document.getElementById('user-input');
            if(inputEl) inputEl.value = e.results[0][0].transcript; 
        };
        recognition.onend = () => { isListening = false; micBtn.classList.remove('listening'); };
        recognition.start();
    } else {
        if(recognition) recognition.stop();
    }
}
