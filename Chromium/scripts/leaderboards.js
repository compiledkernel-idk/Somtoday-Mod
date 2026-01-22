// LEADERBOARD SYSTEM
// Local and anonymous leaderboards with privacy controls

// ============================================================================
// Storage Keys
// ============================================================================

const LEADERBOARD_STORAGE_KEY = 'mod_leaderboards';
const LEADERBOARD_SETTINGS_KEY = 'mod_leaderboard_settings';
const LEADERBOARD_PROFILE_KEY = 'mod_leaderboard_profile';

// ============================================================================
// Data Store
// ============================================================================

/**
 * Get leaderboard data
 */
function getLeaderboardData() {
    const stored = get(LEADERBOARD_STORAGE_KEY);
    if (!stored) {
        return {
            personal: {
                xpAllTime: 0,
                xpWeekly: 0,
                xpDaily: 0,
                streakMax: 0,
                streakCurrent: 0,
                achievementsCount: 0,
                gradesCount: 0,
                gradeAverage: 0,
                homeworkCompleted: 0,
                gamesHighScore: 0,
                level: 1
            },
            history: [],
            lastUpdated: null
        };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return {
            personal: {
                xpAllTime: 0,
                xpWeekly: 0,
                xpDaily: 0,
                streakMax: 0,
                streakCurrent: 0,
                achievementsCount: 0,
                gradesCount: 0,
                gradeAverage: 0,
                homeworkCompleted: 0,
                gamesHighScore: 0,
                level: 1
            },
            history: [],
            lastUpdated: null
        };
    }
}

/**
 * Save leaderboard data
 */
function saveLeaderboardData(data) {
    set(LEADERBOARD_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Get leaderboard settings
 */
function getLeaderboardSettings() {
    const stored = get(LEADERBOARD_SETTINGS_KEY);
    if (!stored) {
        return {
            enabled: true,
            showOnDashboard: true,
            anonymousMode: false,
            shareStats: true,
            displayName: 'Anonymous',
            showLevel: true,
            showAchievements: true,
            showStreak: true,
            notifications: true
        };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return {
            enabled: true,
            showOnDashboard: true,
            anonymousMode: false,
            shareStats: true,
            displayName: 'Anonymous',
            showLevel: true,
            showAchievements: true,
            showStreak: true,
            notifications: true
        };
    }
}

/**
 * Save leaderboard settings
 */
function saveLeaderboardSettings(settings) {
    set(LEADERBOARD_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Get user profile
 */
function getLeaderboardProfile() {
    const stored = get(LEADERBOARD_PROFILE_KEY);
    if (!stored) {
        return {
            id: generateProfileId(),
            displayName: 'Student',
            avatar: '👤',
            badge: null,
            title: 'Student',
            border: 'default',
            createdAt: Date.now()
        };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return {
            id: generateProfileId(),
            displayName: 'Student',
            avatar: '👤',
            badge: null,
            title: 'Student',
            border: 'default',
            createdAt: Date.now()
        };
    }
}

/**
 * Save user profile
 */
function saveLeaderboardProfile(profile) {
    set(LEADERBOARD_PROFILE_KEY, JSON.stringify(profile));
}

/**
 * Generate unique profile ID
 */
function generateProfileId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// ============================================================================
// Leaderboard Categories
// ============================================================================

const LEADERBOARD_CATEGORIES = {
    xp_alltime: {
        id: 'xp_alltime',
        name: 'All-Time XP',
        icon: '⭐',
        description: 'Total XP earned since joining',
        valueKey: 'xpAllTime',
        format: (v) => `${v.toLocaleString()} XP`
    },
    xp_weekly: {
        id: 'xp_weekly',
        name: 'Weekly XP',
        icon: '📅',
        description: 'XP earned this week',
        valueKey: 'xpWeekly',
        format: (v) => `${v.toLocaleString()} XP`
    },
    streak: {
        id: 'streak',
        name: 'Longest Streak',
        icon: '🔥',
        description: 'Longest login streak achieved',
        valueKey: 'streakMax',
        format: (v) => `${v} days`
    },
    streak_current: {
        id: 'streak_current',
        name: 'Current Streak',
        icon: '🔥',
        description: 'Current active streak',
        valueKey: 'streakCurrent',
        format: (v) => `${v} days`
    },
    achievements: {
        id: 'achievements',
        name: 'Achievements',
        icon: '🏆',
        description: 'Total achievements unlocked',
        valueKey: 'achievementsCount',
        format: (v) => `${v} achievements`
    },
    level: {
        id: 'level',
        name: 'Level',
        icon: '📊',
        description: 'Current level',
        valueKey: 'level',
        format: (v) => `Level ${v}`
    },
    homework: {
        id: 'homework',
        name: 'Homework Champion',
        icon: '📚',
        description: 'Total homework tasks completed',
        valueKey: 'homeworkCompleted',
        format: (v) => `${v} tasks`
    },
    games: {
        id: 'games',
        name: 'Game Master',
        icon: '🎮',
        description: 'Highest game score',
        valueKey: 'gamesHighScore',
        format: (v) => `${v.toLocaleString()} pts`
    }
};

// ============================================================================
// Simulated Leaderboard Data
// ============================================================================

/**
 * Generate simulated leaderboard entries
 * In a real implementation, this would come from a server
 */
function generateSimulatedLeaderboard(category, userStats) {
    const names = [
        'StudyPro', 'GradeHunter', 'HomeworkHero', 'LearnMaster', 'QuizWhiz',
        'BookWorm', 'BrainPower', 'SmartCookie', 'TopStudent', 'AceAchiever',
        'ScholarStar', 'DiligentDan', 'FocusedFiona', 'CarefulCarl', 'EagerEmma',
        'BrightBen', 'CleverChloe', 'DeterminedDave', 'ExcellentEva', 'FastFred',
        'GeniusGrace', 'HardworkingHank', 'InsightfulIris', 'JoyfulJake', 'KeenKate'
    ];
    
    const avatars = ['👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍💻', '👩‍💻', '🦊', '🐱', '🐶', '🦉', '🐼'];
    
    const categoryConfig = LEADERBOARD_CATEGORIES[category];
    if (!categoryConfig) return [];
    
    const userValue = userStats[categoryConfig.valueKey] || 0;
    
    // Generate 24 fake entries with various scores
    const fakeEntries = [];
    for (let i = 0; i < 24; i++) {
        const baseValue = userValue * (0.3 + Math.random() * 1.5);
        const value = Math.max(1, Math.floor(baseValue + (Math.random() - 0.5) * userValue * 0.5));
        
        fakeEntries.push({
            id: `fake_${i}`,
            displayName: names[i % names.length] + (i >= names.length ? (i - names.length + 2) : ''),
            avatar: avatars[i % avatars.length],
            value,
            isUser: false
        });
    }
    
    // Add user entry
    const userEntry = {
        id: 'user',
        displayName: 'You',
        avatar: '⭐',
        value: userValue,
        isUser: true
    };
    
    // Combine and sort
    const allEntries = [...fakeEntries, userEntry];
    allEntries.sort((a, b) => b.value - a.value);
    
    // Assign ranks
    allEntries.forEach((entry, index) => {
        entry.rank = index + 1;
    });
    
    return allEntries;
}

/**
 * Get user's rank in a category
 */
function getUserRank(category, userStats) {
    const leaderboard = generateSimulatedLeaderboard(category, userStats);
    const userEntry = leaderboard.find(e => e.isUser);
    return userEntry ? userEntry.rank : null;
}

/**
 * Get top entries for a category
 */
function getTopEntries(category, userStats, limit = 10) {
    const leaderboard = generateSimulatedLeaderboard(category, userStats);
    return leaderboard.slice(0, limit);
}

/**
 * Get entries around user's rank
 */
function getEntriesAroundUser(category, userStats, range = 2) {
    const leaderboard = generateSimulatedLeaderboard(category, userStats);
    const userIndex = leaderboard.findIndex(e => e.isUser);
    
    if (userIndex === -1) return [];
    
    const start = Math.max(0, userIndex - range);
    const end = Math.min(leaderboard.length, userIndex + range + 1);
    
    return leaderboard.slice(start, end);
}

// ============================================================================
// Stats Synchronization
// ============================================================================

/**
 * Update leaderboard stats from various sources
 */
function syncLeaderboardStats() {
    const data = getLeaderboardData();
    
    // Get gamification data
    const gamData = getGamificationData();
    if (gamData) {
        data.personal.xpAllTime = gamData.totalXPEarned || 0;
        data.personal.xpWeekly = gamData.weeklyXP || 0;
        data.personal.xpDaily = gamData.dailyXP || 0;
        data.personal.level = gamData.level || 1;
    }
    
    // Get achievement data
    const achievementData = getAchievementData();
    if (achievementData) {
        data.personal.achievementsCount = achievementData.unlockedAchievements?.length || 0;
    }
    
    // Get achievement progress
    const achievementProgress = getAchievementProgress();
    if (achievementProgress) {
        data.personal.streakMax = achievementProgress.maxStreak || 0;
        data.personal.streakCurrent = achievementProgress.currentStreak || 0;
        data.personal.homeworkCompleted = achievementProgress.homeworkCompleted || 0;
        data.personal.gradesCount = achievementProgress.gradesReceived || 0;
    }
    
    // Get game high scores
    const gradeDefenderData = get('gradeDefenderData');
    if (gradeDefenderData) {
        try {
            const parsed = JSON.parse(gradeDefenderData);
            data.personal.gamesHighScore = Math.max(
                data.personal.gamesHighScore || 0,
                parsed.highScore || 0
            );
        } catch {}
    }
    
    // Record history
    data.history.push({
        timestamp: Date.now(),
        stats: { ...data.personal }
    });
    
    // Keep only last 30 days of history
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    data.history = data.history.filter(h => h.timestamp > thirtyDaysAgo);
    
    data.lastUpdated = Date.now();
    saveLeaderboardData(data);
    
    return data.personal;
}

/**
 * Get leaderboard stats
 */
function getLeaderboardStats() {
    const data = getLeaderboardData();
    return data.personal;
}

// ============================================================================
// Leaderboard UI
// ============================================================================

/**
 * Create leaderboard panel
 */
function createLeaderboardPanel() {
    if (id('mod-leaderboard-panel')) {
        id('mod-leaderboard-panel').remove();
    }
    
    // Sync stats first
    const stats = syncLeaderboardStats();
    const settings = getLeaderboardSettings();
    const profile = getLeaderboardProfile();
    
    const panel = document.createElement('div');
    panel.id = 'mod-leaderboard-panel';
    panel.className = 'mod-leaderboard-panel';
    panel.innerHTML = `
        <div class="mod-leaderboard-header">
            <h2>🏆 Leaderboards</h2>
            <button class="mod-leaderboard-close" onclick="closeLeaderboardPanel()">&times;</button>
        </div>
        
        <div class="mod-leaderboard-tabs">
            <button class="mod-lb-tab active" data-tab="rankings">Rankings</button>
            <button class="mod-lb-tab" data-tab="profile">My Profile</button>
            <button class="mod-lb-tab" data-tab="settings">Settings</button>
        </div>
        
        <div class="mod-leaderboard-content">
            <div class="mod-lb-panel active" id="mod-lb-rankings">
                ${renderRankingsPanel(stats)}
            </div>
            <div class="mod-lb-panel" id="mod-lb-profile">
                ${renderProfilePanel(stats, profile)}
            </div>
            <div class="mod-lb-panel" id="mod-lb-settings">
                ${renderSettingsPanel(settings)}
            </div>
        </div>
    `;
    
    tn('body', 0).appendChild(panel);
    
    // Add tab switching
    panel.querySelectorAll('.mod-lb-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.mod-lb-tab').forEach(t => t.classList.remove('active'));
            panel.querySelectorAll('.mod-lb-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            id(`mod-lb-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

/**
 * Render rankings panel
 */
function renderRankingsPanel(stats) {
    const defaultCategory = 'xp_alltime';
    
    return `
        <div class="mod-lb-category-selector">
            ${Object.entries(LEADERBOARD_CATEGORIES).map(([key, cat]) => `
                <button class="mod-lb-category-btn ${key === defaultCategory ? 'active' : ''}" 
                        data-category="${key}"
                        onclick="switchLeaderboardCategory('${key}')">
                    ${cat.icon} ${cat.name}
                </button>
            `).join('')}
        </div>
        
        <div id="mod-lb-board" class="mod-lb-board">
            ${renderLeaderboard(defaultCategory, stats)}
        </div>
    `;
}

/**
 * Render leaderboard for a category
 */
function renderLeaderboard(category, stats) {
    const categoryConfig = LEADERBOARD_CATEGORIES[category];
    const topEntries = getTopEntries(category, stats, 10);
    const userRank = getUserRank(category, stats);
    const aroundUser = userRank > 10 ? getEntriesAroundUser(category, stats) : [];
    
    let html = `
        <div class="mod-lb-category-header">
            <span class="mod-lb-category-icon">${categoryConfig.icon}</span>
            <div>
                <h3>${categoryConfig.name}</h3>
                <p>${categoryConfig.description}</p>
            </div>
        </div>
        
        <div class="mod-lb-user-rank">
            Your Rank: <strong>#${userRank}</strong> 
            (${categoryConfig.format(stats[categoryConfig.valueKey] || 0)})
        </div>
        
        <div class="mod-lb-entries">
            <div class="mod-lb-entry mod-lb-entry-header">
                <span class="mod-lb-rank">Rank</span>
                <span class="mod-lb-name">Player</span>
                <span class="mod-lb-value">Score</span>
            </div>
    `;
    
    // Top entries
    topEntries.forEach(entry => {
        html += renderLeaderboardEntry(entry, categoryConfig);
    });
    
    // If user not in top 10, show gap and entries around user
    if (userRank > 10 && aroundUser.length > 0) {
        html += `<div class="mod-lb-gap">• • •</div>`;
        aroundUser.forEach(entry => {
            html += renderLeaderboardEntry(entry, categoryConfig);
        });
    }
    
    html += '</div>';
    return html;
}

/**
 * Render single leaderboard entry
 */
function renderLeaderboardEntry(entry, categoryConfig) {
    const rankClass = entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : entry.rank === 3 ? 'bronze' : '';
    const userClass = entry.isUser ? 'mod-lb-user' : '';
    const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`;
    
    return `
        <div class="mod-lb-entry ${rankClass} ${userClass}">
            <span class="mod-lb-rank">${rankIcon}</span>
            <span class="mod-lb-name">
                <span class="mod-lb-avatar">${entry.avatar}</span>
                ${escapeHtml(entry.displayName)}
                ${entry.isUser ? '<span class="mod-lb-you-badge">(You)</span>' : ''}
            </span>
            <span class="mod-lb-value">${categoryConfig.format(entry.value)}</span>
        </div>
    `;
}

/**
 * Render profile panel
 */
function renderProfilePanel(stats, profile) {
    const userRanks = {};
    for (const [key, cat] of Object.entries(LEADERBOARD_CATEGORIES)) {
        userRanks[key] = getUserRank(key, stats);
    }
    
    const bestRank = Math.min(...Object.values(userRanks));
    const bestCategory = Object.entries(userRanks).find(([_, rank]) => rank === bestRank)?.[0];
    
    return `
        <div class="mod-lb-profile-card">
            <div class="mod-lb-profile-avatar">${profile.avatar}</div>
            <div class="mod-lb-profile-info">
                <h3>${escapeHtml(profile.displayName)}</h3>
                <p class="mod-lb-profile-title">${profile.title}</p>
                ${profile.badge ? `<span class="mod-lb-profile-badge">${SHOP_ITEMS[profile.badge]?.icon || '🏅'}</span>` : ''}
            </div>
        </div>
        
        <div class="mod-lb-profile-stats">
            <h4>Your Stats</h4>
            <div class="mod-lb-stats-grid">
                ${Object.entries(LEADERBOARD_CATEGORIES).map(([key, cat]) => `
                    <div class="mod-lb-stat-item">
                        <span class="mod-lb-stat-icon">${cat.icon}</span>
                        <div class="mod-lb-stat-info">
                            <span class="mod-lb-stat-name">${cat.name}</span>
                            <span class="mod-lb-stat-value">${cat.format(stats[cat.valueKey] || 0)}</span>
                            <span class="mod-lb-stat-rank">Rank #${userRanks[key]}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="mod-lb-profile-highlight">
            <h4>Best Performance</h4>
            <div class="mod-lb-best">
                <span class="mod-lb-best-icon">${LEADERBOARD_CATEGORIES[bestCategory]?.icon || '🏆'}</span>
                <div>
                    <strong>${LEADERBOARD_CATEGORIES[bestCategory]?.name || 'N/A'}</strong>
                    <p>Rank #${bestRank} out of 25</p>
                </div>
            </div>
        </div>
        
        <div class="mod-lb-profile-edit">
            <h4>Edit Profile</h4>
            <div class="mod-lb-form-group">
                <label>Display Name</label>
                <input type="text" id="mod-lb-edit-name" value="${escapeHtml(profile.displayName)}" maxlength="20">
            </div>
            <div class="mod-lb-form-group">
                <label>Avatar</label>
                <div class="mod-lb-avatar-picker">
                    ${['👤', '👨‍🎓', '👩‍🎓', '🧑‍🎓', '🦊', '🐱', '🐶', '🦉', '🐼', '🦁', '🐯', '🐻'].map(a => `
                        <button class="mod-lb-avatar-option ${profile.avatar === a ? 'selected' : ''}" 
                                onclick="selectAvatar('${a}')">${a}</button>
                    `).join('')}
                </div>
            </div>
            <button class="mod-btn mod-btn-primary" onclick="saveProfileChanges()">Save Changes</button>
        </div>
    `;
}

/**
 * Render settings panel
 */
function renderSettingsPanel(settings) {
    return `
        <div class="mod-lb-settings-section">
            <h4>Privacy Settings</h4>
            
            <div class="mod-lb-setting-item">
                <div class="mod-lb-setting-info">
                    <span class="mod-lb-setting-name">Enable Leaderboards</span>
                    <span class="mod-lb-setting-desc">Participate in leaderboard rankings</span>
                </div>
                <label class="mod-toggle">
                    <input type="checkbox" id="mod-lb-enabled" ${settings.enabled ? 'checked' : ''} 
                           onchange="updateLeaderboardSetting('enabled', this.checked)">
                    <span class="mod-toggle-slider"></span>
                </label>
            </div>
            
            <div class="mod-lb-setting-item">
                <div class="mod-lb-setting-info">
                    <span class="mod-lb-setting-name">Anonymous Mode</span>
                    <span class="mod-lb-setting-desc">Hide your name, show only rank</span>
                </div>
                <label class="mod-toggle">
                    <input type="checkbox" id="mod-lb-anonymous" ${settings.anonymousMode ? 'checked' : ''} 
                           onchange="updateLeaderboardSetting('anonymousMode', this.checked)">
                    <span class="mod-toggle-slider"></span>
                </label>
            </div>
            
            <div class="mod-lb-setting-item">
                <div class="mod-lb-setting-info">
                    <span class="mod-lb-setting-name">Share Stats</span>
                    <span class="mod-lb-setting-desc">Allow your stats to be visible to others</span>
                </div>
                <label class="mod-toggle">
                    <input type="checkbox" id="mod-lb-share" ${settings.shareStats ? 'checked' : ''} 
                           onchange="updateLeaderboardSetting('shareStats', this.checked)">
                    <span class="mod-toggle-slider"></span>
                </label>
            </div>
        </div>
        
        <div class="mod-lb-settings-section">
            <h4>Display Settings</h4>
            
            <div class="mod-lb-setting-item">
                <div class="mod-lb-setting-info">
                    <span class="mod-lb-setting-name">Show on Dashboard</span>
                    <span class="mod-lb-setting-desc">Display rank widget on home page</span>
                </div>
                <label class="mod-toggle">
                    <input type="checkbox" id="mod-lb-dashboard" ${settings.showOnDashboard ? 'checked' : ''} 
                           onchange="updateLeaderboardSetting('showOnDashboard', this.checked)">
                    <span class="mod-toggle-slider"></span>
                </label>
            </div>
            
            <div class="mod-lb-setting-item">
                <div class="mod-lb-setting-info">
                    <span class="mod-lb-setting-name">Show Level</span>
                    <span class="mod-lb-setting-desc">Display your level on profile</span>
                </div>
                <label class="mod-toggle">
                    <input type="checkbox" id="mod-lb-level" ${settings.showLevel ? 'checked' : ''} 
                           onchange="updateLeaderboardSetting('showLevel', this.checked)">
                    <span class="mod-toggle-slider"></span>
                </label>
            </div>
            
            <div class="mod-lb-setting-item">
                <div class="mod-lb-setting-info">
                    <span class="mod-lb-setting-name">Show Achievements</span>
                    <span class="mod-lb-setting-desc">Display achievement count on profile</span>
                </div>
                <label class="mod-toggle">
                    <input type="checkbox" id="mod-lb-achievements" ${settings.showAchievements ? 'checked' : ''} 
                           onchange="updateLeaderboardSetting('showAchievements', this.checked)">
                    <span class="mod-toggle-slider"></span>
                </label>
            </div>
            
            <div class="mod-lb-setting-item">
                <div class="mod-lb-setting-info">
                    <span class="mod-lb-setting-name">Rank Notifications</span>
                    <span class="mod-lb-setting-desc">Notify when your rank changes</span>
                </div>
                <label class="mod-toggle">
                    <input type="checkbox" id="mod-lb-notifications" ${settings.notifications ? 'checked' : ''} 
                           onchange="updateLeaderboardSetting('notifications', this.checked)">
                    <span class="mod-toggle-slider"></span>
                </label>
            </div>
        </div>
        
        <div class="mod-lb-settings-section">
            <h4>Data</h4>
            <p class="mod-lb-note">
                Note: Leaderboards are currently local-only. Your stats are compared against 
                simulated players. In a future update, this may connect to a real server for 
                global rankings.
            </p>
            <button class="mod-btn mod-btn-secondary" onclick="resetLeaderboardData()">
                Reset My Stats
            </button>
        </div>
    `;
}

/**
 * Switch leaderboard category
 */
window.switchLeaderboardCategory = function(category) {
    const stats = getLeaderboardStats();
    const board = id('mod-lb-board');
    if (board) {
        board.innerHTML = renderLeaderboard(category, stats);
    }
    
    // Update active button
    document.querySelectorAll('.mod-lb-category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
};

/**
 * Select avatar
 */
window.selectAvatar = function(avatar) {
    document.querySelectorAll('.mod-lb-avatar-option').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === avatar);
    });
    
    const profile = getLeaderboardProfile();
    profile.avatar = avatar;
    saveLeaderboardProfile(profile);
};

/**
 * Save profile changes
 */
window.saveProfileChanges = function() {
    const nameInput = id('mod-lb-edit-name');
    if (nameInput) {
        const profile = getLeaderboardProfile();
        profile.displayName = nameInput.value.trim() || 'Student';
        saveLeaderboardProfile(profile);
        
        // Show confirmation
        alert('Profile saved!');
        createLeaderboardPanel(); // Refresh
    }
};

/**
 * Update leaderboard setting
 */
window.updateLeaderboardSetting = function(key, value) {
    const settings = getLeaderboardSettings();
    settings[key] = value;
    saveLeaderboardSettings(settings);
};

/**
 * Reset leaderboard data
 */
window.resetLeaderboardData = function() {
    if (confirm('Are you sure you want to reset all your leaderboard stats? This cannot be undone.')) {
        set(LEADERBOARD_STORAGE_KEY, null);
        createLeaderboardPanel(); // Refresh
    }
};

/**
 * Close leaderboard panel
 */
function closeLeaderboardPanel() {
    const panel = id('mod-leaderboard-panel');
    if (panel) {
        panel.classList.add('closing');
        setTimeout(() => panel.remove(), 300);
    }
}

/**
 * Escape HTML
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

// ============================================================================
// Rank Widget
// ============================================================================

/**
 * Create rank widget for dashboard
 */
function createRankWidget() {
    const settings = getLeaderboardSettings();
    if (!settings.enabled || !settings.showOnDashboard) return;
    
    if (id('mod-rank-widget')) return;
    
    const stats = syncLeaderboardStats();
    const bestRank = Math.min(
        ...Object.keys(LEADERBOARD_CATEGORIES).map(cat => getUserRank(cat, stats))
    );
    
    const widget = document.createElement('div');
    widget.id = 'mod-rank-widget';
    widget.className = 'mod-rank-widget';
    widget.innerHTML = `
        <div class="mod-rank-widget-content" onclick="createLeaderboardPanel()">
            <span class="mod-rank-icon">🏆</span>
            <div class="mod-rank-info">
                <span class="mod-rank-label">Best Rank</span>
                <span class="mod-rank-value">#${bestRank}</span>
            </div>
        </div>
    `;
    
    // Insert near header or top of page
    const target = document.querySelector('sl-home, sl-header');
    if (target) {
        target.insertAdjacentElement('afterend', widget);
    }
}

// ============================================================================
// Initialize
// ============================================================================

/**
 * Initialize leaderboard system
 */
function initLeaderboards() {
    // Sync stats on load
    syncLeaderboardStats();
    
    // Create widget if on home page
    if (document.querySelector('sl-home')) {
        setTimeout(createRankWidget, 2000);
    }
    
    // Periodic sync
    setInterval(syncLeaderboardStats, 300000); // Every 5 minutes
}

// Initialize on load
if (typeof execute === 'function') {
    execute([initLeaderboards]);
}

// Export for use
window.Leaderboards = {
    sync: syncLeaderboardStats,
    getStats: getLeaderboardStats,
    getRank: getUserRank,
    showPanel: createLeaderboardPanel,
    closePanel: closeLeaderboardPanel,
    createWidget: createRankWidget,
    CATEGORIES: LEADERBOARD_CATEGORIES
};
