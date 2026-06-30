// Modal handling - envelope, daily task, and image modals

const modal = document.getElementById('modal');
const envelope = document.getElementById('envelope');
const closeBtn = document.getElementById('closeBtn');

const dailyModal = document.getElementById('dailyModal');
const dailyModalClose = document.getElementById('dailyModalClose');

// Open envelope modal
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

// Close daily modal
if (dailyModalClose) {
    dailyModalClose.addEventListener('click', function() {
        dailyModal.classList.remove('show');
        // Reset upload button
        const dailyUploadBtn = document.getElementById('dailyUploadBtn');
        if (dailyUploadBtn) {
            dailyUploadBtn.disabled = false;
            dailyUploadBtn.style.opacity = '1';
            dailyUploadBtn.style.cursor = 'pointer';
        }
        // Hide image container
        const completedImageContainer = document.getElementById('completedImageContainer');
        if (completedImageContainer) {
            completedImageContainer.style.display = 'none';
        }
        // Clear date display
        const dateDisplay = document.getElementById('selectedDateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = '';
        }
    });
}

// Close daily modal when clicking outside
if (dailyModal) {
    dailyModal.addEventListener('click', function(e) {
        if (e.target === dailyModal) {
            dailyModal.classList.remove('show');
            // Reset upload button
            const dailyUploadBtn = document.getElementById('dailyUploadBtn');
            if (dailyUploadBtn) {
                dailyUploadBtn.disabled = false;
                dailyUploadBtn.style.opacity = '1';
                dailyUploadBtn.style.cursor = 'pointer';
            }
            // Hide image container
            const completedImageContainer = document.getElementById('completedImageContainer');
            if (completedImageContainer) {
                completedImageContainer.style.display = 'none';
            }
            // Clear date display
            const dateDisplay = document.getElementById('selectedDateDisplay');
            if (dateDisplay) {
                dateDisplay.textContent = '';
            }
        }
    });
}

// Close daily modal on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && dailyModal && dailyModal.classList.contains('show')) {
        dailyModal.classList.remove('show');
        // Reset upload button
        const dailyUploadBtn = document.getElementById('dailyUploadBtn');
        if (dailyUploadBtn) {
            dailyUploadBtn.disabled = false;
            dailyUploadBtn.style.opacity = '1';
            dailyUploadBtn.style.cursor = 'pointer';
        }
        // Hide image container
        const completedImageContainer = document.getElementById('completedImageContainer');
        if (completedImageContainer) {
            completedImageContainer.style.display = 'none';
        }
        // Clear date display
        const dateDisplay = document.getElementById('selectedDateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = '';
        }
    }
});

// Image modal for enlarged photos
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
