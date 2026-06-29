// Camera roll carousel with Swiper

const cameraRoll = document.getElementById('cameraRoll');

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
];

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
