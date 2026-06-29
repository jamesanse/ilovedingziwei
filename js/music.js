// Music button and audio control

const bgMusic = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');

// Set initial volume
bgMusic.volume = 0.5;

// Music control - play on button click
function toggleMusic() {
    if (bgMusic.paused) {
        bgMusic.play().catch(function(error) {
            console.log('Play failed:', error);
        });
        musicBtn.classList.add('playing');
    } else {
        bgMusic.pause();
        musicBtn.classList.remove('playing');
    }
}

// Music button click
if (musicBtn) {
    musicBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMusic();
    });
} else {
    console.error('Music button not found');
}

// Update button when music ends
bgMusic.addEventListener('ended', function() {
    musicBtn.classList.remove('playing');
});
