// Get modal and envelope elements
const modal = document.getElementById('modal');
const envelope = document.getElementById('envelope');
const closeBtn = document.getElementById('closeBtn');
const bgMusic = document.getElementById('bgMusic');
const musicBtn = document.getElementById('musicBtn');
const cameraRoll = document.getElementById('cameraRoll');

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


// Camera Roll Functions
// List of image filenames from assets folder
const imageList = [
    'assets/114.JPG',
    'assets/115.JPG',
    'assets/116.JPG',
    'assets/117.JPG',
    'assets/118.JPG',
    'assets/119.JPG',
    'assets/120.JPG',
    'assets/122.JPG',
    'assets/123.JPG',
    'assets/124.JPG',
    'assets/125.JPG',
    'assets/126.JPG',
    'assets/127.JPG',
    'assets/128.JPG',
    // Add more images by adding filenames here
];

function loadCameraRoll() {
    cameraRoll.innerHTML = '';
    
    imageList.forEach((imageSrc, index) => {
        const item = document.createElement('div');
        item.className = 'camera-roll-item';
        item.innerHTML = `<img src="${imageSrc}" alt="Memory ${index + 1}">`;
        item.addEventListener('click', function() {
            openImageModal(imageSrc);
        });
        cameraRoll.appendChild(item);
    });
}

function loadCameraRoll() {
    const wrapper = document.getElementById('swiperWrapper');
    wrapper.innerHTML = '';
    
    imageList.forEach((imageSrc, index) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.innerHTML = `
            <div class="camera-roll-item">
                <img src="${imageSrc}" alt="Memory ${index + 1}">
            </div>
        `;
        const item = slide.querySelector('.camera-roll-item');
        item.addEventListener('click', function() {
            openImageModal(imageSrc);
        });
        wrapper.appendChild(slide);
    });
}

// Load camera roll on page load
loadCameraRoll();

// Initialize Swiper for infinite carousel
window.addEventListener('load', function() {
    setTimeout(function() {
        const swiper = new Swiper('#cameraRoll', {
            loop: true,
            speed: 5000,
            autoplay: {
                delay: 0,
                disableOnInteraction: false,
            },
            slidesPerView: 4,
            spaceBetween: 10,
            breakpoints: {
                480: {
                    slidesPerView: 3,
                },
                768: {
                    slidesPerView: 4,
                },
                1024: {
                    slidesPerView: 6,
                },
            },
            freeMode: {
                enabled: true,
                momentum: false,
            },
        });
    }, 100);
});

function openImageModal(imageSrc) {
    const imageModal = document.createElement('div');
    imageModal.className = 'image-modal';
    imageModal.innerHTML = `
        <div class="image-modal-content">
            <button class="image-close-btn">&times;</button>
            <img src="${imageSrc}" alt="Enlarged image">
        </div>
    `;
    document.body.appendChild(imageModal);
    imageModal.style.display = 'block';
    
    const closeBtn = imageModal.querySelector('.image-close-btn');
    closeBtn.addEventListener('click', function() {
        imageModal.remove();
    });
    
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            imageModal.remove();
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            imageModal.remove();
        }
    });
}

// Open modal and play music when envelope is clicked
envelope.addEventListener('click', function() {
    modal.style.display = 'block';
    // Play music on envelope click
    if (bgMusic.paused) {
        bgMusic.play().catch(function(error) {
            console.log('Play failed:', error);
        });
        musicBtn.classList.add('playing');
    }
});

// Close modal when close button is clicked
closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
});

// Close modal when clicking outside the modal content
window.addEventListener('click', function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

// Close modal on escape key press
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        modal.style.display = 'none';
    }
});
