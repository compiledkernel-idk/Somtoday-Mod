// GAMIFICATION ENGINE
// XP system, levels, daily challenges, rewards shop, and progress tracking

// ============================================================================
// Storage Keys
// ============================================================================

const GAMIFICATION_STORAGE_KEY = 'mod_gamification';
const CHALLENGES_STORAGE_KEY = 'mod_challenges';
const REWARDS_STORAGE_KEY = 'mod_rewards';

// ============================================================================
// Data Store
// ============================================================================

/**
 * Get gamification data
 */
function getGamificationData() {
    const stored = get(GAMIFICATION_STORAGE_KEY);
    if (!stored) {
        return {
            xp: 0,
            level: 1,
            totalXPEarned: 0,
            coins: 0,
            totalCoinsEarned: 0,
            lastDailyReset: null,
            dailyXP: 0,
            weeklyXP: 0,
            monthlyXP: 0,
            xpHistory: [],
            streakMultiplier: 1,
            bonusesActive: []
        };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return {
            xp: 0,
            level: 1,
            totalXPEarned: 0,
            coins: 0,
            totalCoinsEarned: 0,
            lastDailyReset: null,
            dailyXP: 0,
            weeklyXP: 0,
            monthlyXP: 0,
            xpHistory: [],
            streakMultiplier: 1,
            bonusesActive: []
        };
    }
}

/**
 * Save gamification data
 */
function saveGamificationData(data) {
    set(GAMIFICATION_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Get challenges data
 */
function getChallengesData() {
    const stored = get(CHALLENGES_STORAGE_KEY);
    if (!stored) {
        return {
            daily: [],
            weekly: [],
            completed: [],
            lastDailyRefresh: null,
            lastWeeklyRefresh: null
        };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return {
            daily: [],
            weekly: [],
            completed: [],
            lastDailyRefresh: null,
            lastWeeklyRefresh: null
        };
    }
}

/**
 * Save challenges data
 */
function saveChallengesData(data) {
    set(CHALLENGES_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Get rewards data
 */
function getRewardsData() {
    const stored = get(REWARDS_STORAGE_KEY);
    if (!stored) {
        return {
            unlockedRewards: ['theme_default'],
            equippedRewards: {
                badge: null,
                title: 'Student',
                border: 'default',
                effect: null
            },
            purchaseHistory: []
        };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return {
            unlockedRewards: ['theme_default'],
            equippedRewards: {
                badge: null,
                title: 'Student',
                border: 'default',
                effect: null
            },
            purchaseHistory: []
        };
    }
}

/**
 * Save rewards data
 */
function saveRewardsData(data) {
    set(REWARDS_STORAGE_KEY, JSON.stringify(data));
}

// ============================================================================
// XP & Level System
// ============================================================================

/**
 * Level thresholds and rewards
 */
const LEVEL_CONFIG = {
    baseXP: 100,
    multiplier: 1.5,
    maxLevel: 100
};

/**
 * Calculate XP needed for a specific level
 */
function xpForLevel(level) {
    if (level <= 1) return 0;
    return Math.floor(LEVEL_CONFIG.baseXP * Math.pow(LEVEL_CONFIG.multiplier, level - 2));
}

/**
 * Calculate total XP needed to reach a level
 */
function totalXPForLevel(level) {
    let total = 0;
    for (let i = 2; i <= level; i++) {
        total += xpForLevel(i);
    }
    return total;
}

/**
 * Calculate level from total XP
 */
function levelFromXP(totalXP) {
    let level = 1;
    let xpNeeded = 0;
    
    while (level < LEVEL_CONFIG.maxLevel) {
        xpNeeded += xpForLevel(level + 1);
        if (totalXP < xpNeeded) break;
        level++;
    }
    
    return level;
}

/**
 * Get XP progress in current level
 */
function getCurrentLevelProgress(totalXP) {
    const level = levelFromXP(totalXP);
    const xpAtLevelStart = totalXPForLevel(level);
    const xpForNextLevel = xpForLevel(level + 1);
    const currentProgress = totalXP - xpAtLevelStart;
    
    return {
        level,
        currentXP: currentProgress,
        requiredXP: xpForNextLevel,
        percentage: (currentProgress / xpForNextLevel) * 100
    };
}

/**
 * Award XP with multipliers and bonuses
 */
function awardXP(amount, reason = 'action') {
    const data = getGamificationData();
    const oldLevel = data.level;
    
    // Apply multipliers
    let finalAmount = amount;
    
    // Streak multiplier
    finalAmount *= data.streakMultiplier;
    
    // Check active bonuses
    const now = Date.now();
    data.bonusesActive = data.bonusesActive.filter(b => b.expiresAt > now);
    for (const bonus of data.bonusesActive) {
        if (bonus.type === 'xp_boost') {
            finalAmount *= bonus.multiplier;
        }
    }
    
    finalAmount = Math.floor(finalAmount);
    
    // Add XP
    data.xp += finalAmount;
    data.totalXPEarned += finalAmount;
    data.dailyXP += finalAmount;
    data.weeklyXP += finalAmount;
    data.monthlyXP += finalAmount;
    
    // Record in history
    data.xpHistory.push({
        amount: finalAmount,
        reason,
        timestamp: now
    });
    
    // Keep only last 100 entries
    if (data.xpHistory.length > 100) {
        data.xpHistory = data.xpHistory.slice(-100);
    }
    
    // Recalculate level
    data.level = levelFromXP(data.totalXPEarned);
    
    // Award coins for XP (1 coin per 10 XP)
    const coinsEarned = Math.floor(finalAmount / 10);
    if (coinsEarned > 0) {
        data.coins += coinsEarned;
        data.totalCoinsEarned += coinsEarned;
    }
    
    saveGamificationData(data);
    
    // Check for level up
    if (data.level > oldLevel) {
        onLevelUp(oldLevel, data.level);
    }
    
    // Show XP popup
    showXPPopup(finalAmount, reason);
    
    return {
        xpAwarded: finalAmount,
        coinsAwarded: coinsEarned,
        newLevel: data.level,
        leveledUp: data.level > oldLevel
    };
}

/**
 * Award coins directly
 */
function awardCoins(amount, reason = 'action') {
    const data = getGamificationData();
    data.coins += amount;
    data.totalCoinsEarned += amount;
    saveGamificationData(data);
    
    showCoinPopup(amount, reason);
    return data.coins;
}

/**
 * Spend coins
 */
function spendCoins(amount) {
    const data = getGamificationData();
    if (data.coins < amount) return false;
    
    data.coins -= amount;
    saveGamificationData(data);
    return true;
}

/**
 * Handle level up
 */
function onLevelUp(oldLevel, newLevel) {
    // Award level up bonus
    const bonusCoins = newLevel * 10;
    awardCoins(bonusCoins, 'level_up');
    
    // Check for level milestone rewards
    const milestones = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
    for (const milestone of milestones) {
        if (oldLevel < milestone && newLevel >= milestone) {
            unlockMilestoneReward(milestone);
        }
    }
    
    // Show level up celebration
    showLevelUpCelebration(newLevel, bonusCoins);
}

/**
 * Unlock milestone reward
 */
function unlockMilestoneReward(milestone) {
    const rewards = {
        5: 'title_apprentice',
        10: 'badge_star',
        15: 'border_bronze',
        20: 'title_scholar',
        25: 'effect_sparkle',
        30: 'badge_crown',
        40: 'border_silver',
        50: 'title_master',
        75: 'border_gold',
        100: 'title_legend'
    };
    
    const reward = rewards[milestone];
    if (reward) {
        const rewardsData = getRewardsData();
        if (!rewardsData.unlockedRewards.includes(reward)) {
            rewardsData.unlockedRewards.push(reward);
            saveRewardsData(rewardsData);
            showRewardUnlockPopup(reward);
        }
    }
}

/**
 * Show XP popup
 */
function showXPPopup(amount, reason) {
    const popup = document.createElement('div');
    popup.className = 'mod-xp-popup';
    popup.innerHTML = `
        <span class="mod-xp-amount">+${amount} XP</span>
        <span class="mod-xp-reason">${formatReason(reason)}</span>
    `;
    
    tn('body', 0).appendChild(popup);
    
    requestAnimationFrame(() => {
        popup.classList.add('mod-xp-popup-show');
    });
    
    setTimeout(() => {
        popup.classList.add('mod-xp-popup-hide');
        setTimeout(() => popup.remove(), 500);
    }, 2000);
}

/**
 * Show coin popup
 */
function showCoinPopup(amount, reason) {
    const popup = document.createElement('div');
    popup.className = 'mod-coin-popup';
    popup.innerHTML = `
        <span class="mod-coin-icon">🪙</span>
        <span class="mod-coin-amount">+${amount}</span>
    `;
    
    tn('body', 0).appendChild(popup);
    
    requestAnimationFrame(() => {
        popup.classList.add('mod-coin-popup-show');
    });
    
    setTimeout(() => {
        popup.classList.add('mod-coin-popup-hide');
        setTimeout(() => popup.remove(), 500);
    }, 2000);
}

/**
 * Show level up celebration
 */
function showLevelUpCelebration(level, bonusCoins) {
    const overlay = document.createElement('div');
    overlay.className = 'mod-levelup-overlay';
    overlay.innerHTML = `
        <div class="mod-levelup-content">
            <div class="mod-levelup-icon">🎉</div>
            <h2>Level Up!</h2>
            <div class="mod-levelup-level">${level}</div>
            <p>You earned ${bonusCoins} bonus coins!</p>
            <button onclick="this.parentElement.parentElement.remove()">Continue</button>
        </div>
    `;
    
    tn('body', 0).appendChild(overlay);
    
    // Start confetti
    if (typeof startConfetti === 'function') {
        startConfetti();
        setTimeout(stopConfetti, 3000);
    }
    
    // Auto close after 5 seconds
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 5000);
}

/**
 * Format reason for display
 */
function formatReason(reason) {
    const reasons = {
        'grade': 'New Grade',
        'homework': 'Homework Completed',
        'login': 'Daily Login',
        'challenge': 'Challenge Completed',
        'achievement': 'Achievement',
        'level_up': 'Level Up Bonus',
        'streak': 'Streak Bonus',
        'action': 'Action'
    };
    return reasons[reason] || reason;
}

// ============================================================================
// Daily Challenges
// ============================================================================

/**
 * Challenge definitions
 */
const CHALLENGE_TEMPLATES = {
    // Daily Challenges
    daily_login: {
        id: 'daily_login',
        name: 'Daily Check-in',
        description: 'Log in to Somtoday',
        type: 'daily',
        xp: 25,
        coins: 5,
        target: 1,
        trackingKey: 'logins'
    },
    view_grades: {
        id: 'view_grades',
        name: 'Grade Review',
        description: 'View your grades page',
        type: 'daily',
        xp: 25,
        coins: 5,
        target: 1,
        trackingKey: 'gradesViewed'
    },
    complete_homework: {
        id: 'complete_homework',
        name: 'Task Master',
        description: 'Complete 3 homework tasks',
        type: 'daily',
        xp: 50,
        coins: 10,
        target: 3,
        trackingKey: 'homeworkCompleted'
    },
    use_whatif: {
        id: 'use_whatif',
        name: 'What If Warrior',
        description: 'Use the What-If calculator',
        type: 'daily',
        xp: 30,
        coins: 5,
        target: 1,
        trackingKey: 'whatifUsed'
    },
    view_analytics: {
        id: 'view_analytics',
        name: 'Data Analyst',
        description: 'Open the analytics dashboard',
        type: 'daily',
        xp: 30,
        coins: 5,
        target: 1,
        trackingKey: 'analyticsViewed'
    },
    
    // Weekly Challenges
    week_logins: {
        id: 'week_logins',
        name: 'Consistent Student',
        description: 'Log in 5 days this week',
        type: 'weekly',
        xp: 150,
        coins: 30,
        target: 5,
        trackingKey: 'weeklyLogins'
    },
    week_homework: {
        id: 'week_homework',
        name: 'Homework Hero',
        description: 'Complete 15 homework tasks this week',
        type: 'weekly',
        xp: 200,
        coins: 40,
        target: 15,
        trackingKey: 'weeklyHomework'
    },
    week_grades: {
        id: 'week_grades',
        name: 'Grade Getter',
        description: 'Receive 3 grades this week',
        type: 'weekly',
        xp: 100,
        coins: 20,
        target: 3,
        trackingKey: 'weeklyGrades'
    },
    week_achievements: {
        id: 'week_achievements',
        name: 'Achievement Seeker',
        description: 'Unlock 2 achievements this week',
        type: 'weekly',
        xp: 150,
        coins: 30,
        target: 2,
        trackingKey: 'weeklyAchievements'
    },
    week_study_time: {
        id: 'week_study_time',
        name: 'Dedicated Learner',
        description: 'Spend 30 minutes on Somtoday this week',
        type: 'weekly',
        xp: 100,
        coins: 20,
        target: 30,
        trackingKey: 'weeklyMinutes'
    }
};

/**
 * Generate daily challenges
 */
function generateDailyChallenges() {
    const dailyTemplates = Object.values(CHALLENGE_TEMPLATES).filter(t => t.type === 'daily');
    
    // Shuffle and pick 3
    const shuffled = dailyTemplates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);
    
    return selected.map(template => ({
        ...template,
        progress: 0,
        completed: false,
        generatedAt: Date.now()
    }));
}

/**
 * Generate weekly challenges
 */
function generateWeeklyChallenges() {
    const weeklyTemplates = Object.values(CHALLENGE_TEMPLATES).filter(t => t.type === 'weekly');
    
    // Shuffle and pick 2
    const shuffled = weeklyTemplates.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 2);
    
    return selected.map(template => ({
        ...template,
        progress: 0,
        completed: false,
        generatedAt: Date.now()
    }));
}

/**
 * Check and refresh challenges
 */
function refreshChallenges() {
    const data = getChallengesData();
    const now = new Date();
    const today = now.toDateString();
    
    // Check if daily refresh needed
    if (data.lastDailyRefresh !== today) {
        data.daily = generateDailyChallenges();
        data.lastDailyRefresh = today;
    }
    
    // Check if weekly refresh needed (Mondays)
    const weekStart = getWeekStart(now).toDateString();
    if (data.lastWeeklyRefresh !== weekStart) {
        data.weekly = generateWeeklyChallenges();
        data.lastWeeklyRefresh = weekStart;
    }
    
    saveChallengesData(data);
    return data;
}

/**
 * Get week start date
 */
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

/**
 * Update challenge progress
 */
function updateChallengeProgress(trackingKey, amount = 1) {
    const data = getChallengesData();
    let challengeCompleted = false;
    
    // Check daily challenges
    for (const challenge of data.daily) {
        if (challenge.trackingKey === trackingKey && !challenge.completed) {
            challenge.progress += amount;
            if (challenge.progress >= challenge.target) {
                challenge.completed = true;
                challengeCompleted = true;
                completeChallenge(challenge);
            }
        }
    }
    
    // Check weekly challenges
    for (const challenge of data.weekly) {
        if (challenge.trackingKey === trackingKey && !challenge.completed) {
            challenge.progress += amount;
            if (challenge.progress >= challenge.target) {
                challenge.completed = true;
                challengeCompleted = true;
                completeChallenge(challenge);
            }
        }
    }
    
    saveChallengesData(data);
    return challengeCompleted;
}

/**
 * Complete a challenge
 */
function completeChallenge(challenge) {
    // Award XP and coins
    awardXP(challenge.xp, 'challenge');
    awardCoins(challenge.coins, 'challenge');
    
    // Record completion
    const data = getChallengesData();
    data.completed.push({
        id: challenge.id,
        completedAt: Date.now()
    });
    
    // Keep only last 50 completions
    if (data.completed.length > 50) {
        data.completed = data.completed.slice(-50);
    }
    
    saveChallengesData(data);
    
    // Show completion popup
    showChallengeCompletedPopup(challenge);
}

/**
 * Show challenge completed popup
 */
function showChallengeCompletedPopup(challenge) {
    const popup = document.createElement('div');
    popup.className = 'mod-challenge-popup';
    popup.innerHTML = `
        <div class="mod-challenge-popup-content">
            <div class="mod-challenge-popup-icon">✅</div>
            <div class="mod-challenge-popup-text">
                <div class="mod-challenge-popup-title">Challenge Complete!</div>
                <div class="mod-challenge-popup-name">${challenge.name}</div>
                <div class="mod-challenge-popup-rewards">
                    +${challenge.xp} XP • +${challenge.coins} 🪙
                </div>
            </div>
        </div>
    `;
    
    tn('body', 0).appendChild(popup);
    
    requestAnimationFrame(() => {
        popup.classList.add('mod-challenge-popup-show');
    });
    
    setTimeout(() => {
        popup.classList.add('mod-challenge-popup-hide');
        setTimeout(() => popup.remove(), 500);
    }, 3000);
}

// ============================================================================
// Rewards Shop
// ============================================================================

/**
 * Shop items
 */
const SHOP_ITEMS = {
    // Badges
    badge_star: {
        id: 'badge_star',
        name: 'Star Badge',
        description: 'A shining star badge',
        type: 'badge',
        price: 100,
        icon: '⭐',
        levelRequired: 5
    },
    badge_crown: {
        id: 'badge_crown',
        name: 'Crown Badge',
        description: 'A royal crown badge',
        type: 'badge',
        price: 500,
        icon: '👑',
        levelRequired: 20
    },
    badge_diamond: {
        id: 'badge_diamond',
        name: 'Diamond Badge',
        description: 'A precious diamond badge',
        type: 'badge',
        price: 1000,
        icon: '💎',
        levelRequired: 30
    },
    badge_fire: {
        id: 'badge_fire',
        name: 'Fire Badge',
        description: 'An blazing fire badge',
        type: 'badge',
        price: 300,
        icon: '🔥',
        levelRequired: 10
    },
    badge_rocket: {
        id: 'badge_rocket',
        name: 'Rocket Badge',
        description: 'A rocket to the stars',
        type: 'badge',
        price: 400,
        icon: '🚀',
        levelRequired: 15
    },
    
    // Titles
    title_apprentice: {
        id: 'title_apprentice',
        name: 'Apprentice',
        description: 'Show you\'re learning',
        type: 'title',
        price: 50,
        levelRequired: 3
    },
    title_scholar: {
        id: 'title_scholar',
        name: 'Scholar',
        description: 'A dedicated student',
        type: 'title',
        price: 200,
        levelRequired: 10
    },
    title_master: {
        id: 'title_master',
        name: 'Master',
        description: 'Mastery achieved',
        type: 'title',
        price: 500,
        levelRequired: 25
    },
    title_legend: {
        id: 'title_legend',
        name: 'Legend',
        description: 'Legendary status',
        type: 'title',
        price: 2000,
        levelRequired: 50
    },
    title_genius: {
        id: 'title_genius',
        name: 'Genius',
        description: 'Brilliant mind',
        type: 'title',
        price: 750,
        levelRequired: 30
    },
    
    // Borders
    border_bronze: {
        id: 'border_bronze',
        name: 'Bronze Border',
        description: 'A bronze profile border',
        type: 'border',
        price: 150,
        levelRequired: 8,
        color: '#cd7f32'
    },
    border_silver: {
        id: 'border_silver',
        name: 'Silver Border',
        description: 'A silver profile border',
        type: 'border',
        price: 400,
        levelRequired: 20,
        color: '#c0c0c0'
    },
    border_gold: {
        id: 'border_gold',
        name: 'Gold Border',
        description: 'A golden profile border',
        type: 'border',
        price: 800,
        levelRequired: 35,
        color: '#ffd700'
    },
    border_rainbow: {
        id: 'border_rainbow',
        name: 'Rainbow Border',
        description: 'A colorful rainbow border',
        type: 'border',
        price: 1500,
        levelRequired: 45,
        color: 'rainbow'
    },
    
    // Effects
    effect_sparkle: {
        id: 'effect_sparkle',
        name: 'Sparkle Effect',
        description: 'Add sparkles to your profile',
        type: 'effect',
        price: 300,
        levelRequired: 15
    },
    effect_glow: {
        id: 'effect_glow',
        name: 'Glow Effect',
        description: 'Add a glow to your profile',
        type: 'effect',
        price: 500,
        levelRequired: 25
    },
    effect_flames: {
        id: 'effect_flames',
        name: 'Flame Effect',
        description: 'Flames around your profile',
        type: 'effect',
        price: 750,
        levelRequired: 35
    },
    
    // Boosters
    booster_xp_2x: {
        id: 'booster_xp_2x',
        name: '2x XP Boost (1hr)',
        description: 'Double XP for 1 hour',
        type: 'booster',
        price: 200,
        levelRequired: 1,
        duration: 3600000,
        multiplier: 2
    },
    booster_xp_3x: {
        id: 'booster_xp_3x',
        name: '3x XP Boost (30min)',
        description: 'Triple XP for 30 minutes',
        type: 'booster',
        price: 300,
        levelRequired: 10,
        duration: 1800000,
        multiplier: 3
    }
};

/**
 * Purchase an item
 */
function purchaseItem(itemId) {
    const item = SHOP_ITEMS[itemId];
    if (!item) return { success: false, error: 'Item not found' };
    
    const gamData = getGamificationData();
    const rewardsData = getRewardsData();
    
    // Check level requirement
    if (gamData.level < item.levelRequired) {
        return { success: false, error: `Requires level ${item.levelRequired}` };
    }
    
    // Check if already owned (for non-consumables)
    if (item.type !== 'booster' && rewardsData.unlockedRewards.includes(itemId)) {
        return { success: false, error: 'Already owned' };
    }
    
    // Check coins
    if (gamData.coins < item.price) {
        return { success: false, error: 'Not enough coins' };
    }
    
    // Deduct coins
    if (!spendCoins(item.price)) {
        return { success: false, error: 'Transaction failed' };
    }
    
    // Handle different item types
    if (item.type === 'booster') {
        // Activate booster
        gamData.bonusesActive.push({
            type: 'xp_boost',
            multiplier: item.multiplier,
            expiresAt: Date.now() + item.duration
        });
        saveGamificationData(gamData);
    } else {
        // Unlock reward
        rewardsData.unlockedRewards.push(itemId);
        rewardsData.purchaseHistory.push({
            itemId,
            price: item.price,
            purchasedAt: Date.now()
        });
        saveRewardsData(rewardsData);
    }
    
    return { success: true, item };
}

/**
 * Equip a reward
 */
function equipReward(itemId, slot) {
    const item = SHOP_ITEMS[itemId];
    if (!item) return false;
    
    const rewardsData = getRewardsData();
    
    // Check if owned
    if (!rewardsData.unlockedRewards.includes(itemId)) {
        return false;
    }
    
    // Equip based on type
    switch (item.type) {
        case 'badge':
            rewardsData.equippedRewards.badge = itemId;
            break;
        case 'title':
            rewardsData.equippedRewards.title = item.name;
            break;
        case 'border':
            rewardsData.equippedRewards.border = itemId;
            break;
        case 'effect':
            rewardsData.equippedRewards.effect = itemId;
            break;
        default:
            return false;
    }
    
    saveRewardsData(rewardsData);
    return true;
}

/**
 * Show reward unlock popup
 */
function showRewardUnlockPopup(rewardId) {
    const item = SHOP_ITEMS[rewardId];
    if (!item) return;
    
    const popup = document.createElement('div');
    popup.className = 'mod-reward-popup';
    popup.innerHTML = `
        <div class="mod-reward-popup-content">
            <div class="mod-reward-popup-icon">${item.icon || '🎁'}</div>
            <h3>New Reward Unlocked!</h3>
            <div class="mod-reward-popup-name">${item.name}</div>
            <p>${item.description}</p>
            <button onclick="this.parentElement.parentElement.remove()">Awesome!</button>
        </div>
    `;
    
    tn('body', 0).appendChild(popup);
    
    setTimeout(() => {
        if (popup.parentElement) popup.remove();
    }, 5000);
}

// ============================================================================
// Gamification UI
// ============================================================================

/**
 * Create gamification panel
 */
function createGamificationPanel() {
    if (id('mod-gamification-panel')) {
        id('mod-gamification-panel').remove();
    }
    
    const gamData = getGamificationData();
    const progress = getCurrentLevelProgress(gamData.totalXPEarned);
    const challenges = refreshChallenges();
    const rewardsData = getRewardsData();
    
    const panel = document.createElement('div');
    panel.id = 'mod-gamification-panel';
    panel.className = 'mod-gamification-panel';
    panel.innerHTML = `
        <div class="mod-gamification-header">
            <h2>🎮 Progress & Rewards</h2>
            <button class="mod-gamification-close" onclick="closeGamificationPanel()">&times;</button>
        </div>
        
        <div class="mod-gamification-tabs">
            <button class="mod-gam-tab active" data-tab="progress">Progress</button>
            <button class="mod-gam-tab" data-tab="challenges">Challenges</button>
            <button class="mod-gam-tab" data-tab="shop">Shop</button>
            <button class="mod-gam-tab" data-tab="inventory">Inventory</button>
        </div>
        
        <div class="mod-gamification-content">
            <div class="mod-gam-panel active" id="mod-gam-progress">
                ${renderProgressPanel(gamData, progress)}
            </div>
            <div class="mod-gam-panel" id="mod-gam-challenges">
                ${renderChallengesPanel(challenges)}
            </div>
            <div class="mod-gam-panel" id="mod-gam-shop">
                ${renderShopPanel(gamData, rewardsData)}
            </div>
            <div class="mod-gam-panel" id="mod-gam-inventory">
                ${renderInventoryPanel(rewardsData)}
            </div>
        </div>
    `;
    
    tn('body', 0).appendChild(panel);
    
    // Add tab switching
    panel.querySelectorAll('.mod-gam-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.mod-gam-tab').forEach(t => t.classList.remove('active'));
            panel.querySelectorAll('.mod-gam-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            id(`mod-gam-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

/**
 * Render progress panel
 */
function renderProgressPanel(gamData, progress) {
    return `
        <div class="mod-progress-header">
            <div class="mod-level-display">
                <div class="mod-level-number">${progress.level}</div>
                <div class="mod-level-label">Level</div>
            </div>
            <div class="mod-progress-info">
                <div class="mod-xp-text">${progress.currentXP.toLocaleString()} / ${progress.requiredXP.toLocaleString()} XP</div>
                <div class="mod-progress-bar">
                    <div class="mod-progress-fill" style="width: ${progress.percentage}%"></div>
                </div>
            </div>
            <div class="mod-coins-display">
                <span class="mod-coins-icon">🪙</span>
                <span class="mod-coins-amount">${gamData.coins.toLocaleString()}</span>
            </div>
        </div>
        
        <div class="mod-stats-grid">
            <div class="mod-stat-box">
                <div class="mod-stat-value">${gamData.totalXPEarned.toLocaleString()}</div>
                <div class="mod-stat-label">Total XP</div>
            </div>
            <div class="mod-stat-box">
                <div class="mod-stat-value">${gamData.dailyXP.toLocaleString()}</div>
                <div class="mod-stat-label">Today's XP</div>
            </div>
            <div class="mod-stat-box">
                <div class="mod-stat-value">${gamData.weeklyXP.toLocaleString()}</div>
                <div class="mod-stat-label">Weekly XP</div>
            </div>
            <div class="mod-stat-box">
                <div class="mod-stat-value">${gamData.streakMultiplier}x</div>
                <div class="mod-stat-label">Multiplier</div>
            </div>
        </div>
        
        ${gamData.bonusesActive.length > 0 ? `
            <div class="mod-active-bonuses">
                <h4>Active Bonuses</h4>
                ${gamData.bonusesActive.map(b => `
                    <div class="mod-bonus-item">
                        <span>${b.multiplier}x XP Boost</span>
                        <span>${formatTimeRemaining(b.expiresAt - Date.now())}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

/**
 * Render challenges panel
 */
function renderChallengesPanel(challenges) {
    return `
        <div class="mod-challenges-section">
            <h3>📅 Daily Challenges</h3>
            <div class="mod-challenges-list">
                ${challenges.daily.map(c => renderChallengeItem(c)).join('')}
            </div>
        </div>
        
        <div class="mod-challenges-section">
            <h3>📆 Weekly Challenges</h3>
            <div class="mod-challenges-list">
                ${challenges.weekly.map(c => renderChallengeItem(c)).join('')}
            </div>
        </div>
    `;
}

/**
 * Render single challenge item
 */
function renderChallengeItem(challenge) {
    const progressPercent = Math.min((challenge.progress / challenge.target) * 100, 100);
    
    return `
        <div class="mod-challenge-item ${challenge.completed ? 'completed' : ''}">
            <div class="mod-challenge-info">
                <div class="mod-challenge-name">${challenge.name}</div>
                <div class="mod-challenge-desc">${challenge.description}</div>
                <div class="mod-challenge-progress">
                    <div class="mod-challenge-progress-bar">
                        <div class="mod-challenge-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <span>${challenge.progress}/${challenge.target}</span>
                </div>
            </div>
            <div class="mod-challenge-rewards">
                <span>+${challenge.xp} XP</span>
                <span>+${challenge.coins} 🪙</span>
            </div>
        </div>
    `;
}

/**
 * Render shop panel
 */
function renderShopPanel(gamData, rewardsData) {
    const categories = ['badge', 'title', 'border', 'effect', 'booster'];
    
    return `
        <div class="mod-shop-header">
            <span>Your coins: ${gamData.coins.toLocaleString()} 🪙</span>
        </div>
        
        ${categories.map(cat => {
            const items = Object.values(SHOP_ITEMS).filter(i => i.type === cat);
            return `
                <div class="mod-shop-category">
                    <h4>${capitalizeFirst(cat)}s</h4>
                    <div class="mod-shop-items">
                        ${items.map(item => renderShopItem(item, gamData, rewardsData)).join('')}
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

/**
 * Render shop item
 */
function renderShopItem(item, gamData, rewardsData) {
    const owned = rewardsData.unlockedRewards.includes(item.id);
    const canAfford = gamData.coins >= item.price;
    const levelOk = gamData.level >= item.levelRequired;
    const canBuy = !owned && canAfford && levelOk;
    
    return `
        <div class="mod-shop-item ${owned ? 'owned' : ''} ${!canBuy && !owned ? 'locked' : ''}">
            <div class="mod-shop-item-icon">${item.icon || '🎁'}</div>
            <div class="mod-shop-item-info">
                <div class="mod-shop-item-name">${item.name}</div>
                <div class="mod-shop-item-desc">${item.description}</div>
                ${!levelOk ? `<div class="mod-shop-item-req">Requires Lvl ${item.levelRequired}</div>` : ''}
            </div>
            <div class="mod-shop-item-price">
                ${owned ? 'Owned' : `${item.price} 🪙`}
            </div>
            ${!owned ? `
                <button class="mod-shop-buy-btn ${!canBuy ? 'disabled' : ''}" 
                        onclick="buyShopItem('${item.id}')"
                        ${!canBuy ? 'disabled' : ''}>
                    ${!levelOk ? 'Locked' : !canAfford ? 'Need coins' : 'Buy'}
                </button>
            ` : ''}
        </div>
    `;
}

/**
 * Render inventory panel
 */
function renderInventoryPanel(rewardsData) {
    const categories = ['badge', 'title', 'border', 'effect'];
    
    return `
        <div class="mod-inventory-equipped">
            <h4>Currently Equipped</h4>
            <div class="mod-equipped-items">
                <div class="mod-equipped-item">
                    <span>Badge:</span>
                    <strong>${rewardsData.equippedRewards.badge ? SHOP_ITEMS[rewardsData.equippedRewards.badge]?.icon || '❌' : 'None'}</strong>
                </div>
                <div class="mod-equipped-item">
                    <span>Title:</span>
                    <strong>${rewardsData.equippedRewards.title}</strong>
                </div>
                <div class="mod-equipped-item">
                    <span>Border:</span>
                    <strong>${rewardsData.equippedRewards.border !== 'default' ? capitalizeFirst(rewardsData.equippedRewards.border.replace('border_', '')) : 'Default'}</strong>
                </div>
                <div class="mod-equipped-item">
                    <span>Effect:</span>
                    <strong>${rewardsData.equippedRewards.effect ? capitalizeFirst(rewardsData.equippedRewards.effect.replace('effect_', '')) : 'None'}</strong>
                </div>
            </div>
        </div>
        
        ${categories.map(cat => {
            const ownedItems = rewardsData.unlockedRewards
                .filter(id => SHOP_ITEMS[id]?.type === cat)
                .map(id => SHOP_ITEMS[id]);
            
            if (ownedItems.length === 0) return '';
            
            return `
                <div class="mod-inventory-category">
                    <h4>${capitalizeFirst(cat)}s</h4>
                    <div class="mod-inventory-items">
                        ${ownedItems.map(item => `
                            <div class="mod-inventory-item" onclick="equipItem('${item.id}')">
                                <span>${item.icon || '🎁'}</span>
                                <span>${item.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

/**
 * Buy shop item (global function)
 */
window.buyShopItem = function(itemId) {
    const result = purchaseItem(itemId);
    if (result.success) {
        showCoinPopup(-result.item.price, 'purchase');
        // Refresh panel
        createGamificationPanel();
    } else {
        alert(result.error);
    }
};

/**
 * Equip item (global function)
 */
window.equipItem = function(itemId) {
    const item = SHOP_ITEMS[itemId];
    if (item && equipReward(itemId, item.type)) {
        createGamificationPanel();
    }
};

/**
 * Close gamification panel
 */
function closeGamificationPanel() {
    const panel = id('mod-gamification-panel');
    if (panel) {
        panel.classList.add('closing');
        setTimeout(() => panel.remove(), 300);
    }
}

/**
 * Format time remaining
 */
function formatTimeRemaining(ms) {
    if (ms <= 0) return 'Expired';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 60) {
        return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds}s`;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// Streak System
// ============================================================================

/**
 * Update streak multiplier based on login streak
 */
function updateStreakMultiplier() {
    const achievementProgress = getAchievementProgress();
    const gamData = getGamificationData();
    
    const streak = achievementProgress.currentStreak || 0;
    
    // Multiplier increases every 7 days, max 2x
    const multiplier = Math.min(1 + Math.floor(streak / 7) * 0.1, 2);
    gamData.streakMultiplier = multiplier;
    
    saveGamificationData(gamData);
    return multiplier;
}

// ============================================================================
// Initialize
// ============================================================================

/**
 * Initialize gamification system
 */
function initGamification() {
    // Daily reset check
    const gamData = getGamificationData();
    const today = new Date().toDateString();
    
    if (gamData.lastDailyReset !== today) {
        gamData.dailyXP = 0;
        gamData.lastDailyReset = today;
        saveGamificationData(gamData);
    }
    
    // Weekly reset check
    const weekStart = getWeekStart(new Date()).toDateString();
    if (gamData.lastWeeklyReset !== weekStart) {
        gamData.weeklyXP = 0;
        gamData.lastWeeklyReset = weekStart;
        saveGamificationData(gamData);
    }
    
    // Refresh challenges
    refreshChallenges();
    
    // Update streak multiplier
    updateStreakMultiplier();
    
    // Award login XP
    awardXP(10, 'login');
    updateChallengeProgress('logins', 1);
}

// Initialize on load
if (typeof execute === 'function') {
    execute([initGamification]);
}

// Export for use
window.Gamification = {
    awardXP,
    awardCoins,
    spendCoins,
    getProgress: getCurrentLevelProgress,
    getData: getGamificationData,
    getChallenges: getChallengesData,
    updateChallenge: updateChallengeProgress,
    refreshChallenges,
    purchaseItem,
    equipReward,
    showPanel: createGamificationPanel,
    closePanel: closeGamificationPanel,
    SHOP_ITEMS,
    CHALLENGE_TEMPLATES
};
