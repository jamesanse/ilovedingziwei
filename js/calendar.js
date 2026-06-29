// Daily calendar logic - calendar generation, upload tracking, and completion tracking

const dailyUploadBtn = document.getElementById('dailyUploadBtn');
const imageInput = document.getElementById('imageInput');
const uploadStatus = document.getElementById('uploadStatus');
const calendarGrid = document.getElementById('calendarGrid');

let currentSelectedDay = null;
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
            currentSelectedDay = i;
            dailyModal.classList.add('show');
            uploadStatus.textContent = '';
            imageInput.value = '';
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
    if (file) {
        uploadStatus.textContent = '获取上传链接...';
        uploadStatus.className = 'upload-status';
        
        try {
            // Step 1: Get pre-signed URL from Lambda
            const presignedData = await getPresignedUrl();
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
            const recordData = await recordUpload(fileName, s3Path, currentSelectedDay);
            
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
    completedDaysCache = await fetchCompletedDays();
    generateCalendar();
}

initializeCalendar();
