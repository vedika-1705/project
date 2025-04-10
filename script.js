async function loadVideos(filter = '') {
    try {
        const response = await fetch('http://localhost:3000/assets');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const videoFiles = await response.json();

        const videoContainer = document.getElementById('video-container');
        videoContainer.innerHTML = '';

        const filteredVideos = videoFiles.filter(file =>
            file.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredVideos.length === 0) {
            videoContainer.innerHTML = `<p>No videos found for "${filter}".</p>`;
            return;
        }

        filteredVideos.forEach(file => {
            const videoElement = document.createElement('video');
            videoElement.src = `http://localhost:3000/assets/${file}`;
            videoElement.autoplay = true; // Automatically play video
            videoElement.muted = true;   // Mute video to allow autoplay
            videoElement.loop = true;   // Loop the video (optional)
            videoElement.style.width = '300px';
            videoElement.style.margin = '10px';
            videoContainer.appendChild(videoElement);
        });
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const startSpeechButton = document.getElementById('start-speech');
    const speechStatus = document.getElementById('speech-status');

    // Search by text input
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            loadVideos(query);
        }
    });

    // Speech Recognition Setup
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    startSpeechButton.addEventListener('click', () => {
        recognition.start();
        speechStatus.textContent = 'Listening...';
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        speechStatus.textContent = `You said: "${transcript}". Loading videos...`;
        loadVideos(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        speechStatus.textContent = 'Error occurred. Try again.';
    };

    recognition.onend = () => {
        speechStatus.textContent = 'Click the button and say a video name to load.';
    };
}

window.onload = setupEventListeners;
