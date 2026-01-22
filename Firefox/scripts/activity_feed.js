// ACTIVITY FEED
// Tracks and displays achievements, milestones, and social activities

// ============================================================================
// Storage
// ============================================================================

const ACTIVITY_FEED_KEY = 'mod_activity_feed';
const MAX_FEED_ITEMS = 100;

/**
 * Get activity feed data
 */
function getActivityFeed() {
    const stored = get(ACTIVITY_FEED_KEY);
    if (!stored) return [];
    
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

/**
 * Save activity feed
 */
function saveActivityFeed(feed) {
    // Keep only latest items
    if (feed.length > MAX_FEED_ITEMS) {
        feed = feed.slice(-MAX_FEED_ITEMS);
    }
    set(ACTIVITY_FEED_KEY, JSON.stringify(feed));
}

// ============================================================================
// Activity Types
// ============================================================================

const ACTIVITY_TYPES = {
    // Achievement activities
    ACHIEVEMENT_UNLOCKED: {
        type: 'achievement_unlocked',
        icon: '🏆',
        color: '#fbbf24',
        format: (data) => `Unlocked achievement: <strong>${data.achievementName}</strong>`,
        xpReward: true
    },
    
    // Level activities
    LEVEL_UP: {
        type: 'level_up',
        icon: '⬆️',
        color: '#8b5cf6',
        format: (data) => `Reached <strong>Level ${data.newLevel}</strong>!`
    },
    
    // Grade activities
    NEW_GRADE: {
        type: 'new_grade',
        icon: '📝',
        color: '#3b82f6',
        format: (data) => `Received a new grade: <strong>${data.grade}</strong> in ${data.subject}`
    },
    
    HIGH_GRADE: {
        type: 'high_grade',
        icon: '⭐',
        color: '#22c55e',
        format: (data) => `Excellent grade: <strong>${data.grade}</strong> in ${data.subject}!`
    },
    
    PERFECT_GRADE: {
        type: 'perfect_grade',
        icon: '🌟',
        color: '#f59e0b',
        format: (data) => `Perfect score: <strong>10</strong> in ${data.subject}! Amazing!`
    },
    
    // Streak activities
    STREAK_MILESTONE: {
        type: 'streak_milestone',
        icon: '🔥',
        color: '#ef4444',
        format: (data) => `${data.days}-day login streak achieved!`
    },
    
    STREAK_LOST: {
        type: 'streak_lost',
        icon: '💔',
        color: '#6b7280',
        format: (data) => `Streak ended at ${data.days} days. Start a new one!`
    },
    
    // Challenge activities
    CHALLENGE_COMPLETED: {
        type: 'challenge_completed',
        icon: '✅',
        color: '#10b981',
        format: (data) => `Completed challenge: <strong>${data.challengeName}</strong>`
    },
    
    // Study group activities
    GROUP_CREATED: {
        type: 'group_created',
        icon: '👥',
        color: '#6366f1',
        format: (data) => `Created study group: <strong>${data.groupName}</strong>`
    },
    
    GROUP_JOINED: {
        type: 'group_joined',
        icon: '🤝',
        color: '#6366f1',
        format: (data) => `Joined study group: <strong>${data.groupName}</strong>`
    },
    
    NOTE_SHARED: {
        type: 'note_shared',
        icon: '📝',
        color: '#14b8a6',
        format: (data) => `Shared a note in <strong>${data.groupName}</strong>`
    },
    
    SESSION_COMPLETED: {
        type: 'session_completed',
        icon: '📚',
        color: '#0ea5e9',
        format: (data) => `Completed study session: <strong>${data.sessionName}</strong>`
    },
    
    // Leaderboard activities
    RANK_IMPROVED: {
        type: 'rank_improved',
        icon: '📈',
        color: '#22c55e',
        format: (data) => `Rank improved to <strong>#${data.newRank}</strong> in ${data.category}!`
    },
    
    TOP_10: {
        type: 'top_10',
        icon: '🏅',
        color: '#fbbf24',
        format: (data) => `Entered the <strong>Top 10</strong> in ${data.category}!`
    },
    
    // Reward activities
    REWARD_PURCHASED: {
        type: 'reward_purchased',
        icon: '🛒',
        color: '#ec4899',
        format: (data) => `Purchased: <strong>${data.rewardName}</strong>`
    },
    
    REWARD_EQUIPPED: {
        type: 'reward_equipped',
        icon: '✨',
        color: '#a855f7',
        format: (data) => `Equipped: <strong>${data.rewardName}</strong>`
    },
    
    // Game activities
    GAME_HIGH_SCORE: {
        type: 'game_high_score',
        icon: '🎮',
        color: '#f97316',
        format: (data) => `New high score in ${data.gameName}: <strong>${data.score}</strong>!`
    },
    
    // Homework activities
    HOMEWORK_COMPLETED: {
        type: 'homework_completed',
        icon: '📋',
        color: '#0d9488',
        format: (data) => `Completed homework: <strong>${data.taskName}</strong>`
    },
    
    HOMEWORK_STREAK: {
        type: 'homework_streak',
        icon: '📆',
        color: '#0d9488',
        format: (data) => `${data.days}-day homework completion streak!`
    },
    
    // Milestone activities
    FIRST_WEEK: {
        type: 'first_week',
        icon: '🎉',
        color: '#8b5cf6',
        format: () => `Completed your first week with Somtoday Mod!`
    },
    
    FIRST_MONTH: {
        type: 'first_month',
        icon: '🎊',
        color: '#8b5cf6',
        format: () => `One month anniversary with Somtoday Mod!`
    },
    
    // XP activities
    XP_EARNED: {
        type: 'xp_earned',
        icon: '💫',
        color: '#6366f1',
        format: (data) => `Earned <strong>${data.amount} XP</strong> from ${data.source}`
    },
    
    COINS_EARNED: {
        type: 'coins_earned',
        icon: '🪙',
        color: '#fbbf24',
        format: (data) => `Earned <strong>${data.amount} coins</strong>`
    }
};

// ============================================================================
// Activity Logging
// ============================================================================

/**
 * Log a new activity
 */
function logActivity(type, data = {}) {
    const activityType = ACTIVITY_TYPES[type];
    if (!activityType) {
        console.warn('Unknown activity type:', type);
        return;
    }
    
    const feed = getActivityFeed();
    
    const activity = {
        id: 'activity_' + Math.random().toString(36).substr(2, 9),
        type: activityType.type,
        icon: activityType.icon,
        color: activityType.color,
        message: activityType.format(data),
        data,
        timestamp: Date.now(),
        seen: false
    };
    
    feed.push(activity);
    saveActivityFeed(feed);
    
    // Show notification for important activities
    if (shouldShowNotification(type)) {
        showActivityNotification(activity);
    }
    
    return activity;
}

/**
 * Determine if activity should show notification
 */
function shouldShowNotification(type) {
    const notifyTypes = [
        'ACHIEVEMENT_UNLOCKED',
        'LEVEL_UP',
        'PERFECT_GRADE',
        'HIGH_GRADE',
        'STREAK_MILESTONE',
        'CHALLENGE_COMPLETED',
        'TOP_10',
        'GAME_HIGH_SCORE'
    ];
    return notifyTypes.includes(type);
}

/**
 * Show activity notification
 */
function showActivityNotification(activity) {
    const notification = document.createElement('div');
    notification.className = 'mod-activity-notification';
    notification.innerHTML = `
        <div class="mod-activity-notification-content" style="border-left-color: ${activity.color}">
            <span class="mod-activity-notification-icon">${activity.icon}</span>
            <div class="mod-activity-notification-text">${activity.message}</div>
        </div>
    `;
    
    tn('body', 0).appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => notification.remove(), 500);
    }, 4000);
}

/**
 * Mark activities as seen
 */
function markActivitiesAsSeen(activityIds = null) {
    const feed = getActivityFeed();
    
    if (activityIds) {
        feed.forEach(a => {
            if (activityIds.includes(a.id)) {
                a.seen = true;
            }
        });
    } else {
        feed.forEach(a => a.seen = true);
    }
    
    saveActivityFeed(feed);
}

/**
 * Get unseen activity count
 */
function getUnseenCount() {
    const feed = getActivityFeed();
    return feed.filter(a => !a.seen).length;
}

/**
 * Get recent activities
 */
function getRecentActivities(limit = 20) {
    const feed = getActivityFeed();
    return feed.slice(-limit).reverse();
}

/**
 * Get activities by type
 */
function getActivitiesByType(type) {
    const feed = getActivityFeed();
    return feed.filter(a => a.type === type).reverse();
}

/**
 * Get activities from today
 */
function getTodayActivities() {
    const feed = getActivityFeed();
    const today = new Date().toDateString();
    return feed.filter(a => new Date(a.timestamp).toDateString() === today).reverse();
}

/**
 * Clear old activities
 */
function clearOldActivities(daysToKeep = 30) {
    const feed = getActivityFeed();
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const filtered = feed.filter(a => a.timestamp > cutoff);
    saveActivityFeed(filtered);
}

// ============================================================================
// Activity Feed UI
// ============================================================================

/**
 * Create activity feed panel
 */
function createActivityFeedPanel() {
    if (id('mod-activity-feed-panel')) {
        id('mod-activity-feed-panel').remove();
    }
    
    const activities = getRecentActivities(50);
    const todayActivities = getTodayActivities();
    const unseenCount = getUnseenCount();
    
    const panel = document.createElement('div');
    panel.id = 'mod-activity-feed-panel';
    panel.className = 'mod-activity-feed-panel';
    panel.innerHTML = `
        <div class="mod-af-header">
            <h2>📬 Activity Feed</h2>
            <button class="mod-af-close" onclick="closeActivityFeedPanel()">&times;</button>
        </div>
        
        <div class="mod-af-tabs">
            <button class="mod-af-tab active" data-tab="all">All</button>
            <button class="mod-af-tab" data-tab="today">Today (${todayActivities.length})</button>
            <button class="mod-af-tab" data-tab="achievements">Achievements</button>
            <button class="mod-af-tab" data-tab="grades">Grades</button>
        </div>
        
        <div class="mod-af-content">
            <div class="mod-af-panel active" id="mod-af-all">
                ${renderActivityList(activities)}
            </div>
            <div class="mod-af-panel" id="mod-af-today">
                ${renderActivityList(todayActivities)}
            </div>
            <div class="mod-af-panel" id="mod-af-achievements">
                ${renderActivityList(activities.filter(a => 
                    a.type === 'achievement_unlocked' || a.type === 'level_up'
                ))}
            </div>
            <div class="mod-af-panel" id="mod-af-grades">
                ${renderActivityList(activities.filter(a => 
                    a.type.includes('grade')
                ))}
            </div>
        </div>
        
        <div class="mod-af-footer">
            <button class="mod-btn-small" onclick="markAllSeen()">Mark all as seen</button>
            <button class="mod-btn-small" onclick="clearOldFeed()">Clear old</button>
        </div>
    `;
    
    tn('body', 0).appendChild(panel);
    
    // Mark as seen when panel opens
    markActivitiesAsSeen();
    
    // Add tab switching
    panel.querySelectorAll('.mod-af-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.mod-af-tab').forEach(t => t.classList.remove('active'));
            panel.querySelectorAll('.mod-af-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            id(`mod-af-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

/**
 * Render activity list
 */
function renderActivityList(activities) {
    if (activities.length === 0) {
        return `
            <div class="mod-af-empty">
                <p>No activities yet.</p>
                <p>Complete achievements, receive grades, and more to see your activity here!</p>
            </div>
        `;
    }
    
    // Group by date
    const groups = groupByDate(activities);
    
    let html = '';
    for (const [date, items] of Object.entries(groups)) {
        html += `
            <div class="mod-af-date-group">
                <div class="mod-af-date-header">${date}</div>
                <div class="mod-af-items">
                    ${items.map(a => renderActivityItem(a)).join('')}
                </div>
            </div>
        `;
    }
    
    return html;
}

/**
 * Group activities by date
 */
function groupByDate(activities) {
    const groups = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    for (const activity of activities) {
        const date = new Date(activity.timestamp).toDateString();
        let label;
        
        if (date === today) {
            label = 'Today';
        } else if (date === yesterday) {
            label = 'Yesterday';
        } else {
            label = new Date(activity.timestamp).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
        
        if (!groups[label]) {
            groups[label] = [];
        }
        groups[label].push(activity);
    }
    
    return groups;
}

/**
 * Render single activity item
 */
function renderActivityItem(activity) {
    const time = new Date(activity.timestamp).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <div class="mod-af-item ${activity.seen ? '' : 'unseen'}" style="--activity-color: ${activity.color}">
            <span class="mod-af-icon">${activity.icon}</span>
            <div class="mod-af-content-inner">
                <div class="mod-af-message">${activity.message}</div>
                <div class="mod-af-time">${time}</div>
            </div>
        </div>
    `;
}

/**
 * Close activity feed panel
 */
function closeActivityFeedPanel() {
    const panel = id('mod-activity-feed-panel');
    if (panel) {
        panel.classList.add('closing');
        setTimeout(() => panel.remove(), 300);
    }
}

/**
 * Mark all seen (global)
 */
window.markAllSeen = function() {
    markActivitiesAsSeen();
    createActivityFeedPanel(); // Refresh
};

/**
 * Clear old feed (global)
 */
window.clearOldFeed = function() {
    if (confirm('Clear activities older than 7 days?')) {
        clearOldActivities(7);
        createActivityFeedPanel(); // Refresh
    }
};

window.closeActivityFeedPanel = closeActivityFeedPanel;

// ============================================================================
// Activity Feed Widget
// ============================================================================

/**
 * Create activity feed widget
 */
function createActivityWidget() {
    if (id('mod-activity-widget')) return;
    
    const unseenCount = getUnseenCount();
    const recentActivities = getRecentActivities(3);
    
    const widget = document.createElement('div');
    widget.id = 'mod-activity-widget';
    widget.className = 'mod-activity-widget';
    widget.innerHTML = `
        <div class="mod-activity-widget-header" onclick="createActivityFeedPanel()">
            <span>📬 Recent Activity</span>
            ${unseenCount > 0 ? `<span class="mod-activity-badge">${unseenCount}</span>` : ''}
        </div>
        <div class="mod-activity-widget-items">
            ${recentActivities.length > 0 
                ? recentActivities.map(a => `
                    <div class="mod-activity-widget-item">
                        <span>${a.icon}</span>
                        <span>${a.message}</span>
                    </div>
                `).join('')
                : '<div class="mod-activity-widget-empty">No recent activity</div>'
            }
        </div>
    `;
    
    // Insert into page
    const target = document.querySelector('sl-home, sl-header');
    if (target) {
        target.insertAdjacentElement('afterend', widget);
    }
}

/**
 * Update activity widget
 */
function updateActivityWidget() {
    const existingWidget = id('mod-activity-widget');
    if (existingWidget) {
        existingWidget.remove();
        createActivityWidget();
    }
}

// ============================================================================
// Integration Hooks
// ============================================================================

/**
 * Hook into achievement system
 */
function hookAchievementSystem() {
    if (typeof window.Achievements !== 'undefined') {
        const originalCheck = window.Achievements.check;
        window.Achievements.check = function(...args) {
            const result = originalCheck.apply(this, args);
            if (result && result.length > 0) {
                result.forEach(achievement => {
                    logActivity('ACHIEVEMENT_UNLOCKED', {
                        achievementId: achievement.id,
                        achievementName: achievement.name,
                        xp: achievement.earnedXP
                    });
                });
            }
            return result;
        };
    }
}

/**
 * Hook into gamification system
 */
function hookGamificationSystem() {
    if (typeof window.Gamification !== 'undefined') {
        const originalAwardXP = window.Gamification.awardXP;
        window.Gamification.awardXP = function(amount, reason) {
            const result = originalAwardXP.apply(this, arguments);
            if (result && result.leveledUp) {
                logActivity('LEVEL_UP', {
                    newLevel: result.newLevel
                });
            }
            return result;
        };
    }
}

/**
 * Log grade activity
 */
function logGradeActivity(grade, subject) {
    if (grade >= 9.95) {
        logActivity('PERFECT_GRADE', { grade, subject });
    } else if (grade >= 8.0) {
        logActivity('HIGH_GRADE', { grade: grade.toFixed(1).replace('.', ','), subject });
    } else {
        logActivity('NEW_GRADE', { grade: grade.toFixed(1).replace('.', ','), subject });
    }
}

/**
 * Log streak activity
 */
function logStreakActivity(days, isLost = false) {
    if (isLost) {
        logActivity('STREAK_LOST', { days });
    } else {
        const milestones = [3, 7, 14, 30, 50, 100, 200, 365];
        if (milestones.includes(days)) {
            logActivity('STREAK_MILESTONE', { days });
        }
    }
}

/**
 * Log challenge completed
 */
function logChallengeCompleted(challengeName) {
    logActivity('CHALLENGE_COMPLETED', { challengeName });
}

/**
 * Log group activity
 */
function logGroupActivity(type, groupName) {
    if (type === 'created') {
        logActivity('GROUP_CREATED', { groupName });
    } else if (type === 'joined') {
        logActivity('GROUP_JOINED', { groupName });
    }
}

/**
 * Log homework completed
 */
function logHomeworkCompleted(taskName) {
    logActivity('HOMEWORK_COMPLETED', { taskName });
}

/**
 * Log game high score
 */
function logGameHighScore(gameName, score) {
    logActivity('GAME_HIGH_SCORE', { gameName, score });
}

/**
 * Log rank change
 */
function logRankImproved(category, newRank) {
    if (newRank <= 10) {
        logActivity('TOP_10', { category, newRank });
    } else {
        logActivity('RANK_IMPROVED', { category, newRank });
    }
}

// ============================================================================
// Activity Statistics
// ============================================================================

/**
 * Get activity statistics
 */
function getActivityStats() {
    const feed = getActivityFeed();
    
    const stats = {
        total: feed.length,
        today: getTodayActivities().length,
        byType: {},
        mostActiveDay: null,
        streakDays: 0
    };
    
    // Count by type
    feed.forEach(a => {
        stats.byType[a.type] = (stats.byType[a.type] || 0) + 1;
    });
    
    // Find most active day
    const dayCount = {};
    feed.forEach(a => {
        const day = new Date(a.timestamp).toDateString();
        dayCount[day] = (dayCount[day] || 0) + 1;
    });
    
    let maxCount = 0;
    for (const [day, count] of Object.entries(dayCount)) {
        if (count > maxCount) {
            maxCount = count;
            stats.mostActiveDay = { day, count };
        }
    }
    
    // Calculate activity streak
    const days = Object.keys(dayCount).sort().reverse();
    let streak = 0;
    let currentDate = new Date();
    
    for (const day of days) {
        if (new Date(day).toDateString() === currentDate.toDateString()) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    stats.streakDays = streak;
    
    return stats;
}

// ============================================================================
// Initialize
// ============================================================================

/**
 * Initialize activity feed
 */
function initActivityFeed() {
    // Hook into other systems
    hookAchievementSystem();
    hookGamificationSystem();
    
    // Clear old activities
    clearOldActivities(30);
    
    // Log login activity
    logActivity('XP_EARNED', { amount: 10, source: 'daily login' });
    
    // Create widget on home page
    if (document.querySelector('sl-home')) {
        setTimeout(createActivityWidget, 2000);
    }
}

if (typeof execute === 'function') {
    execute([initActivityFeed]);
}

// Export
window.ActivityFeed = {
    log: logActivity,
    getRecent: getRecentActivities,
    getToday: getTodayActivities,
    getStats: getActivityStats,
    getUnseen: getUnseenCount,
    markSeen: markActivitiesAsSeen,
    showPanel: createActivityFeedPanel,
    closePanel: closeActivityFeedPanel,
    createWidget: createActivityWidget,
    updateWidget: updateActivityWidget,
    logGrade: logGradeActivity,
    logStreak: logStreakActivity,
    logChallenge: logChallengeCompleted,
    logGroup: logGroupActivity,
    logHomework: logHomeworkCompleted,
    logGameScore: logGameHighScore,
    logRank: logRankImproved,
    TYPES: ACTIVITY_TYPES
};
