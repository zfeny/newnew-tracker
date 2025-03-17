// DOM elements
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const actionButton = document.getElementById('actionButton');
    const statusText = document.getElementById('statusText');
    const timerContainer = document.getElementById('timerContainer');
    const timerDisplay = document.getElementById('timerDisplay');
    const notesInput = document.getElementById('notesInput');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const logoutBtn = document.getElementById('logoutBtn');
    const totalCountEl = document.getElementById('totalCount');
    const avgDurationEl = document.getElementById('avgDuration');
    const weeklyCountEl = document.getElementById('weeklyCount');
    const monthlyCountEl = document.getElementById('monthlyCount');
    const recordsTable = document.getElementById('recordsTable');
    const recordsTableBody = document.getElementById('recordsTableBody');
    const emptyRecords = document.getElementById('emptyRecords');
    const calendarGrid = document.getElementById('calendarGrid');
    const viewToggleOptions = document.querySelectorAll('.view-option');
    const monthView = document.getElementById('monthView');
    const yearView = document.getElementById('yearView');
    const yearGrid = document.getElementById('yearGrid');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const currentMonthEl = document.getElementById('currentMonth');
    const historyFilterType = document.getElementById('historyFilterType');
    const monthFilterContainer = document.getElementById('monthFilterContainer');
    const yearFilterContainer = document.getElementById('yearFilterContainer');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const yearOnlySelect = document.getElementById('yearOnlySelect');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    
    // Status variables
    let currentCalendarView = 'month';
    let currentDisplayDate = new Date();
    let historyFilterCriteria = { type: 'all' };
    
    // Timer variables
    let timerInterval;
    let timerRunning = false;
    let startTime;
    let elapsedTime = 0;
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Show/hide stats card
            const statsCard = document.getElementById('statsCard');
            if (tabId === 'history') {
                renderRecords();
                statsCard.style.display = 'none';
            } else {
                statsCard.style.display = 'block';
            }
        });
    });
    
    // View switching
    viewToggleOptions.forEach(option => {
        option.addEventListener('click', () => {
            viewToggleOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            const viewType = option.getAttribute('data-view');
            currentCalendarView = viewType;
            
            if (viewType === 'month') {
                monthView.classList.remove('hidden');
                yearView.classList.add('hidden');
                generateMonthCalendar();
            } else {
                monthView.classList.add('hidden');
                yearView.classList.remove('hidden');
                generateYearCalendar();
            }
        });
    });
    
    // Start/stop button
    actionButton.addEventListener('click', () => {
        if (!timerRunning) {
            startTimer();
        } else {
            stopTimer();
        }
    });
    
    // Start timer
    function startTimer() {
        timerRunning = true;
        startTime = Date.now();
        elapsedTime = 0;
        
        timerInterval = setInterval(updateTimer, 1000);
        
        // Update UI
        actionButton.innerHTML = '<span class="play-icon">■</span> 结束';
        actionButton.classList.add('stopping');
        statusText.textContent = '正在记录...';
        timerContainer.classList.remove('hidden');
        notesInput.classList.add('hidden');
    }
    
    // Stop timer
    function stopTimer() {
        timerRunning = false;
        clearInterval(timerInterval);
        
        // Update UI
        actionButton.innerHTML = '<span class="play-icon">✓</span> 保存';
        actionButton.classList.remove('stopping');
        statusText.textContent = '完成了吗？';
        notesInput.classList.remove('hidden');
        
        // Set one-time click event to save record
        actionButton.removeEventListener('click', saveRecord);
        actionButton.addEventListener('click', saveRecord, { once: true });
    }
    
    // Update timer display
    function updateTimer() {
        elapsedTime = Date.now() - startTime;
        
        const seconds = Math.floor((elapsedTime / 1000) % 60);
        const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
        const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
        
        timerDisplay.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Save record
    function saveRecord() {
        // Calculate duration (minutes)
        const durationMinutes = elapsedTime / 60000;
        
        // Create record object
        const record = {
            date: new Date().toISOString(),
            duration: parseFloat(durationMinutes.toFixed(1)),
            notes: notesInput.value
        };
        
        // Send record to server
        fetch('/api/records.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(record)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Reset UI
                resetUI();
                
                // Update statistics
                updateStats();
                
                // Refresh records if on history tab
                if (document.querySelector('.tab[data-tab="history"]').classList.contains('active')) {
                    renderRecords();
                }
            } else {
                alert('保存记录失败: ' + (data.error || '未知错误'));
            }
        })
        .catch(error => {
            console.error('Error saving record:', error);
            alert('保存记录时发生错误，请稍后再试');
        });
    }
    
    // Reset UI
    function resetUI() {
        actionButton.innerHTML = '<span class="play-icon">▶</span> 开始';
        actionButton.classList.remove('stopping');
        statusText.textContent = '准备开始';
        timerContainer.classList.add('hidden');
        notesInput.classList.add('hidden');
        notesInput.value = '';
        
        // Remove save event listener
        actionButton.removeEventListener('click', saveRecord);
        
        // Restore start/stop event listener
        const newActionButton = actionButton.cloneNode(true);
        actionButton.parentNode.replaceChild(newActionButton, actionButton);
        document.getElementById('actionButton').addEventListener('click', () => {
            if (!timerRunning) {
                startTimer();
            } else {
                stopTimer();
            }
        });
    }
    
    // Render records
    function renderRecords() {
        // Build query parameters
        let url = '/api/records.php';
        
        if (historyFilterCriteria.type !== 'all') {
            url += `?filter_type=${historyFilterCriteria.type}`;
            
            if (historyFilterCriteria.type === 'month') {
                url += `&year=${historyFilterCriteria.year}&month=${historyFilterCriteria.month}`;
            } else if (historyFilterCriteria.type === 'year') {
                url += `&year=${historyFilterCriteria.year}`;
            }
        }
        
        // Fetch records from server
        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error fetching records:', data.error);
                    return;
                }
                
                const records = data.records;
                
                if (records.length === 0) {
                    recordsTable.style.display = 'none';
                    emptyRecords.style.display = 'block';
                    
                    if (historyFilterCriteria.type !== 'all') {
                        emptyRecords.textContent = '没有符合筛选条件的记录';
                    } else {
                        emptyRecords.textContent = '没有记录，开始添加记录吧！';
                    }
                    return;
                }
                
                recordsTable.style.display = 'table';
                emptyRecords.style.display = 'none';
                
                // Clear table
                recordsTableBody.innerHTML = '';
                
                // Add records to table
                records.forEach(record => {
                    const row = document.createElement('tr');
                    
                    // Format date
                    const date = new Date(record.date);
                    
                    // 调整时区差异 (解决ISO日期时区问题)
                    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                    
                    const formattedDate = `${localDate.getFullYear()}-${(localDate.getMonth() + 1).toString().padStart(2, '0')}-${localDate.getDate().toString().padStart(2, '0')} ${localDate.getHours().toString().padStart(2, '0')}:${localDate.getMinutes().toString().padStart(2, '0')}`;
                    
                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${record.duration} 分钟</td>
                        <td>${record.notes || '-'}</td>
                        <td><button class="delete-btn" data-id="${record.record_id}">删除</button></td>
                    `;
                    
                    recordsTableBody.appendChild(row);
                });
                
                // Add delete button events
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = parseInt(e.target.getAttribute('data-id'));
                        if (confirm('确定要删除这条记录吗？')) {
                            deleteRecord(id);
                        }
                    });
                });
            })
            .catch(error => {
                console.error('Error:', error);
                alert('获取记录失败，请稍后再试');
            });
    }
    
    // Delete record
    function deleteRecord(id) {
        fetch(`/api/records.php?id=${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderRecords();
                updateStats();
                
                if (currentCalendarView === 'month') {
                    generateMonthCalendar();
                } else {
                    generateYearCalendar();
                }
            } else {
                alert('删除记录失败: ' + (data.error || '未知错误'));
            }
        })
        .catch(error => {
            console.error('Error deleting record:', error);
            alert('删除记录时发生错误，请稍后再试');
        });
    }
    
    // Update statistics
    function updateStats() {
        fetch('/api/records.php')
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error fetching records for stats:', data.error);
                    return;
                }
                
                const records = data.records;
                
                // Total count
                totalCountEl.textContent = records.length;
                
                // Average duration
                if (records.length > 0) {
                    const totalDuration = records.reduce((sum, record) => sum + parseFloat(record.duration), 0);
                    const avg = totalDuration / records.length;
                    avgDurationEl.textContent = avg.toFixed(1);
                } else {
                    avgDurationEl.textContent = '0';
                }
                
                // Weekly and monthly records
                const now = new Date();
                
                // Start of week (Monday)
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
                weekStart.setHours(0, 0, 0, 0);
                
                // Start of month
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                
                const weeklyRecords = records.filter(record => {
                    const recordDate = new Date(record.date);
                    // 调整时区差异
                    const localDate = new Date(recordDate.getTime() - (recordDate.getTimezoneOffset() * 60000));
                    return localDate >= weekStart;
                });
                
                const monthlyRecords = records.filter(record => {
                    const recordDate = new Date(record.date);
                    // 调整时区差异
                    const localDate = new Date(recordDate.getTime() - (recordDate.getTimezoneOffset() * 60000));
                    return localDate >= monthStart;
                });
                
                weeklyCountEl.textContent = weeklyRecords.length;
                monthlyCountEl.textContent = monthlyRecords.length;
                
                // Generate calendar
                if (currentCalendarView === 'month') {
                    generateMonthCalendar();
                } else {
                    generateYearCalendar();
                }
            })
            .catch(error => {
                console.error('Error updating stats:', error);
            });
    }
    
    // Month view month switching
    prevButton.addEventListener('click', () => {
        if (currentCalendarView === 'month') {
            currentDisplayDate.setMonth(currentDisplayDate.getMonth() - 1);
            generateMonthCalendar();
        } else {
            currentDisplayDate.setFullYear(currentDisplayDate.getFullYear() - 1);
            generateYearCalendar();
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentCalendarView === 'month') {
            currentDisplayDate.setMonth(currentDisplayDate.getMonth() + 1);
            generateMonthCalendar();
        } else {
            currentDisplayDate.setFullYear(currentDisplayDate.getFullYear() + 1);
            generateYearCalendar();
        }
    });
    
    // History filter setup
    historyFilterType.addEventListener('change', () => {
        const filterType = historyFilterType.value;
        monthFilterContainer.classList.add('hidden');
        yearFilterContainer.classList.add('hidden');
        
        if (filterType === 'month') {
            monthFilterContainer.classList.remove('hidden');
            populateDateFilters();
        } else if (filterType === 'year') {
            yearFilterContainer.classList.remove('hidden');
            populateDateFilters();
        }
    });
    
    applyFilterBtn.addEventListener('click', () => {
        const filterType = historyFilterType.value;
        
        if (filterType === 'all') {
            historyFilterCriteria = { type: 'all' };
        } else if (filterType === 'month') {
            historyFilterCriteria = { 
                type: 'month',
                year: parseInt(yearSelect.value),
                month: parseInt(monthSelect.value)
            };
        } else if (filterType === 'year') {
            historyFilterCriteria = {
                type: 'year',
                year: parseInt(yearOnlySelect.value)
            };
        }
        
        renderRecords();
    });
    
    // Populate filter years and months
    function populateDateFilters() {
        // Fetch all records to get date ranges
        fetch('/api/records.php')
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error fetching records for filters:', data.error);
                    return;
                }
                
                const records = data.records;
                const years = new Set();
                const now = new Date();
                
                // Ensure current year is always available
                years.add(now.getFullYear());
                
                // Collect all years from records
                records.forEach(record => {
                    const date = new Date(record.date);
                    years.add(date.getFullYear());
                });
                
                // Sort years in descending order
                const sortedYears = Array.from(years).sort((a, b) => b - a);
                
                // Populate year selectors
                yearSelect.innerHTML = '';
                yearOnlySelect.innerHTML = '';
                
                sortedYears.forEach(year => {
                    const yearOption = document.createElement('option');
                    yearOption.value = year;
                    yearOption.textContent = `${year}年`;
                    yearSelect.appendChild(yearOption.cloneNode(true));
                    yearOnlySelect.appendChild(yearOption);
                });
                
                // Populate month selector
                monthSelect.innerHTML = '';
                const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
                
                monthNames.forEach((name, index) => {
                    const monthOption = document.createElement('option');
                    monthOption.value = index;
                    monthOption.textContent = name;
                    monthSelect.appendChild(monthOption);
                });
                
                // Default to current month and year
                yearSelect.value = now.getFullYear();
                monthSelect.value = now.getMonth();
                yearOnlySelect.value = now.getFullYear();
            })
            .catch(error => {
                console.error('Error populating date filters:', error);
            });
    }
    
    // Generate month view calendar
    function generateMonthCalendar() {
        fetch('/api/records.php')
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error fetching records for calendar:', data.error);
                    return;
                }
                
                const records = data.records;
                
                // Clear calendar container
                calendarGrid.innerHTML = '';
                
                // Set current month title
                const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
                currentMonthEl.textContent = `${currentDisplayDate.getFullYear()}年${monthNames[currentDisplayDate.getMonth()]}`;
                
                // Get first and last day of current month
                const firstDay = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth(), 1);
                const lastDay = new Date(currentDisplayDate.getFullYear(), currentDisplayDate.getMonth() + 1, 0);
                
                // Calculate activity records for each date
                const activityRecords = {};
                records.forEach(record => {
                    const date = new Date(record.date);
                    // 调整时区差异
                    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                    
                    // Only count records for current display month
                    if (localDate.getMonth() === currentDisplayDate.getMonth() && localDate.getFullYear() === currentDisplayDate.getFullYear()) {
                        const dateString = `${localDate.getFullYear()}-${localDate.getMonth()}-${localDate.getDate()}`;
                        
                        if (!activityRecords[dateString]) {
                            activityRecords[dateString] = [];
                        }
                        activityRecords[dateString].push(record);
                    }
                });
                
                // Fill in calendar blanks before first day (adjust to Monday start)
                const firstDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday
                const padding = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1; // Adjust to Monday start
                
                for (let i = 0; i < padding; i++) {
                    const emptyCell = document.createElement('div');
                    emptyCell.className = 'calendar-day';
                    emptyCell.style.visibility = 'hidden';
                    calendarGrid.appendChild(emptyCell);
                }
                
                // Fill in date cells for the month
                for (let day = 1; day <= lastDay.getDate(); day++) {
                    const cell = document.createElement('div');
                    cell.className = 'calendar-day';
                    cell.textContent = day;
                    
                    // Check if it's today
                    const today = new Date();
                    if (day === today.getDate() && 
                        currentDisplayDate.getMonth() === today.getMonth() && 
                        currentDisplayDate.getFullYear() === today.getFullYear()) {
                        cell.classList.add('current');
                    }
                    
                    // Check if this day has activities
                    const dateString = `${currentDisplayDate.getFullYear()}-${currentDisplayDate.getMonth()}-${day}`;
                    const dayRecords = activityRecords[dateString] || [];
                    const count = dayRecords.length;
                    
                    // Add level class
                    if (count > 0) {
                        const level = count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4;
                        cell.classList.add(`level-${level}`);
                        
                        // Add data attributes for details
                        cell.setAttribute('data-records', JSON.stringify(dayRecords));
                        
                        // Add mouse events - support both click and hover
                        cell.addEventListener('click', showTooltip);
                        cell.addEventListener('mouseenter', showTooltip);
                        cell.addEventListener('mouseleave', hideTooltip);
                    }
                    
                    calendarGrid.appendChild(cell);
                }
            })
            .catch(error => {
                console.error('Error generating month calendar:', error);
            });
    }
    
    // Generate year view calendar
    function generateYearCalendar() {
        fetch('/api/records.php')
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Error fetching records for year view:', data.error);
                    return;
                }
                
                const records = data.records;
                const currentYear = currentDisplayDate.getFullYear();
                
                // Clear year view container
                yearGrid.innerHTML = '';
                
                // Set year title
                currentMonthEl.textContent = `${currentYear}年`;
                
                // Create mini calendar for each month
                const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
                
                // Calculate activity records for each date
                const yearActivityRecords = {};
                records.forEach(record => {
                    const date = new Date(record.date);
                    // 调整时区差异
                    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                    
                    // Only count records for current year
                    if (localDate.getFullYear() === currentYear) {
                        const dateString = `${localDate.getFullYear()}-${localDate.getMonth()}-${localDate.getDate()}`;
                        
                        if (!yearActivityRecords[dateString]) {
                            yearActivityRecords[dateString] = [];
                        }
                        yearActivityRecords[dateString].push(record);
                    }
                });
                
                // Get current date for highlighting
                const today = new Date();
                
                // Create mini calendar for each month
                for (let month = 0; month < 12; month++) {
                    const monthCell = document.createElement('div');
                    monthCell.className = 'month-cell';
                    
                    // Month name
                    const monthNameDiv = document.createElement('div');
                    monthNameDiv.className = 'month-name';
                    monthNameDiv.textContent = monthNames[month];
                    monthCell.appendChild(monthNameDiv);
                    
                    // Create mini month grid
                    const miniMonthGrid = document.createElement('div');
                    miniMonthGrid.className = 'mini-month-grid';
                    
                    // Get first and last day of month
                    const firstDay = new Date(currentYear, month, 1);
                    const lastDay = new Date(currentYear, month + 1, 0);
                    
                    // Fill in blanks before first day (adjust to Monday start)
                    const firstDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday
                    const padding = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1; // Adjust to Monday start
                    
                    for (let i = 0; i < padding; i++) {
                        const emptyCell = document.createElement('div');
                        emptyCell.className = 'mini-day';
                        emptyCell.style.visibility = 'hidden';
                        miniMonthGrid.appendChild(emptyCell);
                    }
                    
                    // Fill in date cells for month
                    for (let day = 1; day <= lastDay.getDate(); day++) {
                        const cell = document.createElement('div');
                        cell.className = 'mini-day';
                        
                        // Check if this day has activities
                        const dateString = `${currentYear}-${month}-${day}`;
                        const dayRecords = yearActivityRecords[dateString] || [];
                        const count = dayRecords.length;
                        
                        // Add level class
                        if (count > 0) {
                            const level = count === 1 ? 1 : count === 2 ? 2 : count === 3 ? 3 : 4;
                            cell.classList.add(`level-${level}`);
                            
                            // Add data attributes for details
                            cell.setAttribute('data-date', `${currentYear}-${month + 1}-${day}`);
                            cell.setAttribute('data-records', JSON.stringify(dayRecords));
                            
                            // Add click event to show details
                            cell.addEventListener('click', (e) => {
                                const records = JSON.parse(e.currentTarget.getAttribute('data-records'));
                                const dateStr = e.currentTarget.getAttribute('data-date');
                                showYearViewDetails(dateStr, records);
                            });
                        }
                        
                        // If today, add current class
                        if (today.getFullYear() === currentYear && month === today.getMonth() && day === today.getDate()) {
                            cell.classList.add('current');
                        }
                        
                        miniMonthGrid.appendChild(cell);
                    }
                    
                    monthCell.appendChild(miniMonthGrid);
                    yearGrid.appendChild(monthCell);
                }
            })
            .catch(error => {
                console.error('Error generating year calendar:', error);
            });
    }
    
    // Show year view details for a day
    function showYearViewDetails(dateStr, records) {
        // Create details popup
        const existingTooltip = document.getElementById('active-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        const [year, month, day] = dateStr.split('-').map(Number);
        const formattedDate = `${year}年${month}月${day}日`;
        
        alert(`${formattedDate} 的记录 (${records.length}次)\n\n` + 
              records.map(record => {
                  const date = new Date(record.date);
                  const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                  return `• ${time} - ${record.duration}分钟 ${record.notes ? `(${record.notes})` : ''}`;
              }).join('\n')
        );
    }
    
    // Show tooltip for date details
    function showTooltip(event) {
        // Prevent event bubbling
        event.stopPropagation();
        
        const cell = event.currentTarget;
        const records = JSON.parse(cell.getAttribute('data-records'));
        
        if (!records || records.length === 0) return;
        
        // Remove any existing tooltips
        hideTooltip();
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.id = 'active-tooltip';
        
        const dateObj = new Date(records[0].date);
        const formattedDate = `${dateObj.getFullYear()}年${(dateObj.getMonth() + 1)}月${dateObj.getDate()}日`;
        
        let tooltipContent = `<div class="tooltip-title">${formattedDate} (${records.length}次)</div>`;
        
        records.forEach((record, index) => {
            const recordDate = new Date(record.date);
            const time = `${recordDate.getHours().toString().padStart(2, '0')}:${recordDate.getMinutes().toString().padStart(2, '0')}`;
            
            tooltipContent += `<div class="tooltip-record">
                <span class="tooltip-time">${time}</span>
                <span class="tooltip-duration">${record.duration}分钟</span>
                ${record.notes ? `<span class="tooltip-note">${record.notes}</span>` : ''}
            </div>`;
        });
        
        tooltip.innerHTML = tooltipContent;
        
        // Get viewport width
        const viewportWidth = window.innerWidth;
        
        // Add tooltip to calendar cell
        cell.appendChild(tooltip);
        
        // Adjust position on small screens
        if (viewportWidth <= 350) {
            // If viewport is too narrow, adjust position to avoid overflow
            const tooltipWidth = tooltip.offsetWidth;
            const cellRect = cell.getBoundingClientRect();
            const leftSpace = cellRect.left;
            const rightSpace = viewportWidth - (cellRect.left + cellRect.width);
            
            // Adjust positioning based on available space
            if (leftSpace < tooltipWidth/2 || rightSpace < tooltipWidth/2) {
                tooltip.style.left = 'auto';
                tooltip.style.right = 'auto';
                tooltip.style.marginLeft = '0';
                
                if (leftSpace < rightSpace) {
                    tooltip.style.left = '0';
                } else {
                    tooltip.style.right = '0';
                }
            }
        }
        
        // Add visible class to trigger animation
        setTimeout(() => {
            tooltip.classList.add('visible');
        }, 10);
        
        // Listen for document click to close tooltip
        document.addEventListener('click', documentClickHandler);
    }
    
    // Document click handler
    function documentClickHandler(event) {
        // If click is not inside active tooltip cell, hide tooltip
        const activeTooltip = document.getElementById('active-tooltip');
        if (activeTooltip && !activeTooltip.contains(event.target)) {
            hideTooltip();
            document.removeEventListener('click', documentClickHandler);
        }
    }
    
    // Hide tooltip
    function hideTooltip() {
        const tooltip = document.getElementById('active-tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 200);
        }
    }
    
    // Export data
    exportBtn.addEventListener('click', () => {
        fetch('/api/export.php')
            .then(response => response.json())
            .then(records => {
                const dataStr = JSON.stringify(records);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = `手艺活记录_${new Date().toISOString().slice(0, 10)}.json`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
            })
            .catch(error => {
                console.error('Error exporting data:', error);
                alert('导出数据失败，请稍后再试');
            });
    });
    
    // Import data
    importBtn.addEventListener('click', () => {
        importFile.click();
    });
    
    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (Array.isArray(data)) {
                    if (confirm('导入将覆盖当前数据，确定继续吗？')) {
                        // Send data to server
                        fetch('/api/export.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data)
                        })
                        .then(response => response.json())
                        .then(result => {
                            if (result.success) {
                                alert('数据导入成功！');
                                updateStats();
                                
                                // Refresh records if on history tab
                                if (document.querySelector('.tab[data-tab="history"]').classList.contains('active')) {
                                    renderRecords();
                                }
                            } else {
                                alert('导入数据失败: ' + (result.error || '未知错误'));
                            }
                        })
                        .catch(error => {
                            console.error('Error importing data:', error);
                            alert('导入数据失败，请稍后再试');
                        });
                    }
                } else {
                    alert('无效的数据格式！');
                }
            } catch (error) {
                alert('无法解析文件：' + error.message);
            }
        };
        reader.readAsText(file);
    });
    
    // Initialize page
    initHistoryFilters();
    updateStats();
    
    // Initialize history filters
    function initHistoryFilters() {
        populateDateFilters();
        historyFilterType.value = 'all';
        monthFilterContainer.classList.add('hidden');
        yearFilterContainer.classList.add('hidden');
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                fetch('/api/auth.php', {
                    method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = 'login.php';
                    } else {
                        alert('退出登录失败，请稍后再试');
                    }
                })
                .catch(error => {
                    console.error('Error logging out:', error);
                    alert('退出登录时发生错误，请稍后再试');
                });
            }
        });
    }
});