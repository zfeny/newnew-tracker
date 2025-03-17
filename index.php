<?php
// Start session
session_start();

// Check if user is authenticated
if (!isset($_SESSION['authenticated']) || $_SESSION['authenticated'] !== true) {
    // Redirect to login page
    header('Location: login.php');
    exit;
}

// Get current username
$username = isset($_SESSION['username']) ? $_SESSION['username'] : '用户';
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>手艺生活记录</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <!-- 主卡片 -->
        <div class="glass-card">
            <div class="tabs">
                <div class="tab active" data-tab="log">主页面</div>
                <div class="tab" data-tab="history">历史记录</div>
            </div>
            
            <div class="tab-content active" id="log">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <p>欢迎, <strong><?php echo htmlspecialchars($username); ?></strong></p>
                    <button id="logoutBtn" class="export-import-button" style="margin: 0;">
                        <span style="margin-right: 5px;">🚪</span> 退出登录
                    </button>
                </div>
                
                <p style="text-align: center;">祝愿所有给本项目Star的小伙伴牛子长长工作少少</p>
                
                <a href="https://github.com/zfeny/newnew-tracker" class="github-button" target="_blank">
                    <span class="star-icon">⭐</span> Star on GitHub
                </a>
                
                <div class="record-container">
                    <h3 class="record-title">记录新的手艺活</h3>
                    
                    <div id="statusContainer">
                        <p class="status-text" id="statusText">准备开始</p>
                    </div>
                    
                    <div id="timerContainer" class="hidden">
                        <p class="timer-display" id="timerDisplay">00:00:00</p>
                    </div>
                    
                    <button id="actionButton" class="action-button">
                        <span class="play-icon">▶</span> 开始
                    </button>
                    
                    <textarea id="notesInput" class="notes-input hidden" placeholder="备注（可选）" rows="3"></textarea>
                </div>
                
                <div class="export-import-buttons">
                    <button id="exportBtn" class="export-import-button">
                        <span style="margin-right: 5px;">⬇️</span> 导出数据
                    </button>
                    <button id="importBtn" class="export-import-button">
                        <span style="margin-right: 5px;">⬆️</span> 导入数据
                    </button>
                    <input type="file" id="importFile" style="display: none;">
                </div>
            </div>
            
            <div class="tab-content" id="history">
                <div id="recordsTableContainer">
                    <div class="history-filter">
                        <div class="filter-title">筛选记录：</div>
                        <select id="historyFilterType" class="filter-select">
                            <option value="all">全部记录</option>
                            <option value="month">按月筛选</option>
                            <option value="year">按年筛选</option>
                        </select>
                        <div id="monthFilterContainer" class="filter-date-container hidden">
                            <select id="yearSelect" class="filter-date-select"></select>
                            <select id="monthSelect" class="filter-date-select"></select>
                        </div>
                        <div id="yearFilterContainer" class="filter-date-container hidden">
                            <select id="yearOnlySelect" class="filter-date-select"></select>
                        </div>
                        <button id="applyFilterBtn" class="filter-button">应用筛选</button>
                    </div>
                    <table class="history-table" id="recordsTable">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>时长</th>
                                <th>备注</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="recordsTableBody">
                            <!-- 记录将在这里动态添加 -->
                        </tbody>
                    </table>
                    <div id="emptyRecords" class="empty-state">
                        没有记录，开始添加记录吧！
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 统计卡片 -->
        <div class="glass-card" id="statsCard">
            <div class="stats-container">
                <h3 class="stats-title">统计数据</h3>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3 class="stat-title">总次数</h3>
                        <p class="stat-value" id="totalCount">0</p>
                    </div>
                    <div class="stat-card">
                        <h3 class="stat-title">平均持续时间</h3>
                        <p class="stat-value" id="avgDuration">0</p>
                    </div>
                    <div class="stat-card">
                        <h3 class="stat-title">本周次数</h3>
                        <p class="stat-value" id="weeklyCount">0</p>
                    </div>
                    <div class="stat-card">
                        <h3 class="stat-title">本月次数</h3>
                        <p class="stat-value" id="monthlyCount">0</p>
                    </div>
                </div>
                
                <div class="calendar-container">
                    <div class="month-header">
                        <div class="navigation-controls">
                            <button id="prevButton" class="nav-button">&lt;</button>
                            <div class="current-month" id="currentMonth">2025年3月</div>
                            <button id="nextButton" class="nav-button">&gt;</button>
                        </div>
                        <div class="view-toggle">
                            <div class="view-option active" data-view="month">月</div>
                            <div class="view-option" data-view="year">年</div>
                        </div>
                    </div>
                    
                    <!-- 月视图 -->
                    <div id="monthView">
                        <div class="weekday-labels">
                            <div>一</div>
                            <div>二</div>
                            <div>三</div>
                            <div>四</div>
                            <div>五</div>
                            <div>六</div>
                            <div>日</div>
                        </div>
                        <div class="calendar-grid" id="calendarGrid">
                            <!-- 日历格子将动态生成 -->
                        </div>
                    </div>
                    
                    <!-- 年视图 -->
                    <div id="yearView" class="hidden">
                        <div class="year-grid" id="yearGrid">
                            <!-- 年历表格将动态生成 -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <footer>
            <p>本应用数据存储在MySQL数据库中</p>
        </footer>
    </div>

    <script src="js/main.js"></script>
</body>
</html>