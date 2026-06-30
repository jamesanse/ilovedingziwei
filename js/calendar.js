// Daily calendar logic - calendar generation, upload tracking, and completion tracking

const dailyUploadBtn = document.getElementById('dailyUploadBtn');
const imageInput = document.getElementById('imageInput');
const uploadStatus = document.getElementById('uploadStatus');
const calendarGrid = document.getElementById('calendarGrid');

// Store selected date (year, month, day) when user clicks on a day
let selectedDate = {
    year: null,
    month: null,
    day: null
};
let currentSelectedDay = null; // Deprecated: use selectedDate.day instead
let completedDaysCache = [];

// Chinese month names
const chineseMonths = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
];

// Display current month in Chinese
function displayMonth() {
    const now = new Date();
    const chinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const month = chinaTime.getMonth();
    const year = chinaTime.getFullYear();
    
    const dailyMonth = document.getElementById('dailyMonth');
    dailyMonth.textContent = `${year}年 ${chineseMonths[month]}`;
}

// Generate calendar
function generateCalendar() {
    calendarGrid.innerHTML = '';
    
    // Get current date in China timezone (UTC+8)
    const now = new Date();
    const chinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const currentDay = chinaTime.getDate();
    const currentMonth = chinaTime.getMonth();
    const currentYear = chinaTime.getFullYear();
    
    // Get the number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = i;
        dayEl.dataset.day = i;
        
        // Highlight today
        if (i === currentDay) {
            dayEl.classList.add('today');
        }
        
        // Check if day is completed
        if (completedDaysCache.includes(i)) {
            dayEl.classList.add('completed');
        }
        
        dayEl.addEventListener('click', function() {
            // Store selected date
            currentSelectedDay = i;
            selectedDate.day = i;
            selectedDate.month = currentMonth + 1; // Months are 0-indexed
            selectedDate.year = currentYear;
            
            // Update date display in modal
            const dateDisplay = document.getElementById('selectedDateDisplay');
            dateDisplay.textContent = `${selectedDate.year}年 ${String(selectedDate.month).padStart(2, '0')}月 ${String(i).padStart(2, '0')}日`;
            
            // Check if day already completed
            if (completedDaysCache.includes(i)) {
                uploadStatus.textContent = '✓ 已完成（今天只能上传一次）';
                uploadStatus.className = 'upload-status success';
                dailyUploadBtn.disabled = true;
                dailyUploadBtn.style.opacity = '0.5';
                dailyUploadBtn.style.cursor = 'not-allowed';
                
                // Fetch and display the completed image using stored selected date
                getImageUrl(selectedDate.year, selectedDate.month, selectedDate.day).then(imageUrl => {
                    if (imageUrl) {
                        const completedImageContainer = document.getElementById('completedImageContainer');
                        const completedImage = document.getElementById('completedImage');
                        completedImage.src = imageUrl;
                        completedImageContainer.style.display = 'block';
                    }
                }).catch(error => {
                    console.error('Error fetching image:', error);
                });
                
                dailyModal.classList.add('show');
            } else {
                dailyModal.classList.add('show');
                uploadStatus.textContent = '';
                imageInput.value = '';
                dailyUploadBtn.disabled = false;
                dailyUploadBtn.style.opacity = '1';
                dailyUploadBtn.style.cursor = 'pointer';
                
                // Hide completed image container
                const completedImageContainer = document.getElementById('completedImageContainer');
                completedImageContainer.style.display = 'none';
            }
        });
        
        calendarGrid.appendChild(dayEl);
    }
}

// Mark day as completed in UI
function markDayCompleted(day) {
    const dayEl = document.querySelector(`[data-day="${day}"]`);
    if (dayEl && !dayEl.classList.contains('completed')) {
        dayEl.classList.add('completed');
        if (!completedDaysCache.includes(day)) {
            completedDaysCache.push(day);
        }
    }
}

// Handle upload button click
dailyUploadBtn.addEventListener('click', function() {
    imageInput.click();
});

// Handle file selection
imageInput.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Prevent re-upload on same day
    if (completedDaysCache.includes(currentSelectedDay)) {
        uploadStatus.textContent = '✗ 今天已上传过了！';
        uploadStatus.className = 'upload-status error';
        return;
    }
    
    if (file) {
        uploadStatus.textContent = '获取上传链接...';
        uploadStatus.className = 'upload-status';
        
        try {
            // Extract file extension from MIME type or filename
            let fileExtension = 'jpg';
            if (file.type) {
                const mimeToExt = {
                    'image/jpeg': 'jpg',
                    'image/jpg': 'jpg',
                    'image/png': 'png',
                    'image/webp': 'webp',
                    'image/heic': 'heic',
                    'image/heif': 'heif',
                    'image/gif': 'gif'
                };
                fileExtension = mimeToExt[file.type] || file.type.split('/')[1] || 'jpg';
            }
            
            // Step 1: Get pre-signed URL from Lambda
            const presignedData = await getPresignedUrl(fileExtension, file.type);
            const { uploadURL, fileName, s3Path } = presignedData;
            
            // Step 2: Upload file to S3 directly
            uploadStatus.textContent = '上传中...';
            const uploadResponse = await fetch(uploadURL, {
                method: 'PUT',
                headers: {
                    'Content-Type': file.type
                },
                body: file
            });
            
            if (!uploadResponse.ok) {
                throw new Error('S3 upload failed');
            }
            
            // Step 3: Record upload to tracking file
            uploadStatus.textContent = '保存记录...';
            
            // Use stored selected date (year, month, day)
            const recordData = await recordUpload(fileName, s3Path, selectedDate.day, selectedDate.month, selectedDate.year);
            
            if (recordData.success) {
                uploadStatus.textContent = '✓ 上传成功！';
                uploadStatus.className = 'upload-status success';
                
                // Mark day as completed
                markDayCompleted(currentSelectedDay);
                
                // Close modal after 2 seconds
                setTimeout(function() {
                    dailyModal.classList.remove('show');
                }, 1500);
            } else {
                throw new Error(recordData.error || 'Failed to record upload');
            }
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.textContent = '✗ 上传失败: ' + error.message;
            uploadStatus.className = 'upload-status error';
        }
    }
});

// Initialize calendar on page load
async function initializeCalendar() {
    displayMonth();
    
    // Get current date in Asia/Shanghai timezone
    const now = new Date();
    const chinaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
    const year = chinaTime.getFullYear();
    const month = chinaTime.getMonth() + 1;
    
    // Fetch completed days with year/month for resilience
    completedDaysCache = await fetchCompletedDays(year, month);
    generateCalendar();
}

initializeCalendar();
