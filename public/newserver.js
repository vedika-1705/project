async function loadVideos(sentence = '') {
    try {
        const response = await fetch('http://localhost:3000/assets');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const videoFiles = await response.json();

        const videoContainer = document.getElementById('video-container');
        videoContainer.innerHTML = '';
        const words = sentence.trim().toLowerCase().split(/\s+/); // Split sentence into words

        let foundVideos = [];

        words.forEach(word => {
            const matchingVideo = videoFiles.find(file =>
                file.toLowerCase().startsWith(word) && file.endsWith('.mp4')
            );

            if (matchingVideo) {
                foundVideos.push(`http://localhost:3000/assets/${matchingVideo}`);
            }
        });

        if (foundVideos.length === 0) {
            videoContainer.innerHTML = `<p>No videos found for "${sentence}".</p>`;
            return;
        }

        playVideosSequentially(foundVideos, videoContainer);
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

// Function to play videos one by one
function playVideosSequentially(videoUrls, container) {
    let currentIndex = 0;

    function playNext() {
        if (currentIndex >= videoUrls.length) return; // Stop if all videos played

        const videoElement = document.createElement('video');
        videoElement.src = videoUrls[currentIndex];
        videoElement.autoplay = true;
        videoElement.muted = false;
        videoElement.style.width = '600px';
        videoElement.style.height = '400px';
        videoElement.style.display = 'block';
        videoElement.style.margin = 'auto';
        container.innerHTML = ''; // Clear previous video
        container.appendChild(videoElement);

        videoElement.onended = () => {
            currentIndex++;
            playNext(); // Play next video after current ends
        };
    }

    playNext(); // Start playing first video
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
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        speechStatus.textContent = `You said: "${transcript}". Loading videos...`;
        document.getElementById('spoken-sentence').textContent=`Sentence:"${transcript}"`;
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
