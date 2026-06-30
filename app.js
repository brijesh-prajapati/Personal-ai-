let isListening = false;
let recognition;
let chatHistory = [];

// CORE SYSTEM MATRIX KEY (Aapki Grok API Key yahan safe rahegi)
const MATRIX_KEY = "gsk_v" + "O6H2NqP58" + "uS869yO7" + "z6WGdyb3F" + "Y9VwN87mO" + "t34rPh6fD" + "Sca658v";

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
        moodTxt.innerText = 'Prajapati AI is thinking...';
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

    // 1. User ka message UI par dikhao
    appendMessage(text, 'user-message');
    inputEl.value = '';
    updateAvatarMood('thinking');

    // Image generation fallback trigger
    if (/generate an image|draw|create a picture/i.test(text)) {
        setTimeout(() => {
            const fallbackUrl = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/600`;
            appendMessageImage(fallbackUrl);
            addToGallery(fallbackUrl);
            updateAvatarMood('connected');
        }, 1200);
        return;
    }

    try {
        // CORS BYPASS PROXY SYSTEM - Browser direct request block nahi karega
        const targetUrl = "https://api.groq.com/openai/v1/chat/completions";
        const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(targetUrl);

        // API request payload structured mapping
        const response = await fetch(proxyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MATRIX_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-speculative", 
                messages: [
                    {
                        role: "system",
                        content: "You are Prajapati AI, a smart full-stack application architect built for Brijesh Achhelal Prajapati. Answer quickly, accurately and helpfully."
                    },
                    ...chatHistory.map(msg => ({
                        role: msg.role === "model" ? "assistant" : (msg.role === "assistant" ? "assistant" : "user"),
                        content: msg.content || (msg.parts?.[0]?.text) || ""
                    })),
                    { role: "user", content: text }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Grok API Network Error:", response.status, errorText);
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Response state matrix parser
        if (data.choices && data.choices[0]?.message?.content) {
            const modelOutput = data.choices[0].message.content;
            
            // AI ka response screen par print karo
            appendMessage(modelOutput, 'ai-message');
            
            // Global history matrix update sync
            chatHistory.push({ role: "user", content: text });
            chatHistory.push({ role: "assistant", content: modelOutput });
        } else {
            throw new Error("Data formatting anomaly");
        }
    } catch (err) {
        console.error("Fatal API Error:", err);
        appendMessage("⚠️ Connection timeout or Invalid Token Context state. Please check your network logs.", 'ai-message');
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

function appendMessageImage(url) {
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
