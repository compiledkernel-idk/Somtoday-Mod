// ACHIEVEMENT SYSTEM
// Gamified achievement tracking for Somtoday Mod
// 50+ achievements across multiple categories

// ============================================================================
// Achievement Data Store
// ============================================================================

const ACHIEVEMENT_STORAGE_KEY = 'mod_achievements';
const ACHIEVEMENT_PROGRESS_KEY = 'mod_achievement_progress';

/**
 * Get user's achievement data
 */
function getAchievementData() {
    const stored = get(ACHIEVEMENT_STORAGE_KEY);
    if (!stored) {
        return {
            unlockedAchievements: [],
            unlockedAt: {},
            totalXP: 0,
            level: 1
        };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return {
            unlockedAchievements: [],
            unlockedAt: {},
            totalXP: 0,
            level: 1
        };
    }
}

/**
 * Save achievement data
 */
function saveAchievementData(data) {
    set(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(data));
}

/**
 * Get achievement progress data
 */
function getAchievementProgress() {
    const stored = get(ACHIEVEMENT_PROGRESS_KEY);
    if (!stored) {
        return {
            gradesReceived: 0,
            highGradesInRow: 0,
            currentStreak: 0,
            maxStreak: 0,
            homeworkCompleted: 0,
            loginDays: 0,
            lastLoginDate: null,
            subjectsWithGrades: new Set(),
            perfectScores: 0,
            comebacks: 0,
            earlyBirdLogins: 0,
            nightOwlLogins: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            settingsCustomized: 0,
            themesUsed: new Set(),
            extensionDaysUsed: 0,
            firstUseDate: null,
            totalGradePoints: 0
        };
    }
    try {
        const parsed = JSON.parse(stored);
        // Convert arrays back to Sets
        parsed.subjectsWithGrades = new Set(parsed.subjectsWithGrades || []);
        parsed.themesUsed = new Set(parsed.themesUsed || []);
        return parsed;
    } catch {
        return {
            gradesReceived: 0,
            highGradesInRow: 0,
            currentStreak: 0,
            maxStreak: 0,
            homeworkCompleted: 0,
            loginDays: 0,
            lastLoginDate: null,
            subjectsWithGrades: new Set(),
            perfectScores: 0,
            comebacks: 0,
            earlyBirdLogins: 0,
            nightOwlLogins: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            settingsCustomized: 0,
            themesUsed: new Set(),
            extensionDaysUsed: 0,
            firstUseDate: null,
            totalGradePoints: 0
        };
    }
}

/**
 * Save achievement progress
 */
function saveAchievementProgress(progress) {
    // Convert Sets to arrays for JSON storage
    const toSave = {
        ...progress,
        subjectsWithGrades: Array.from(progress.subjectsWithGrades || []),
        themesUsed: Array.from(progress.themesUsed || [])
    };
    set(ACHIEVEMENT_PROGRESS_KEY, JSON.stringify(toSave));
}

// ============================================================================
// Achievement Definitions
// ============================================================================

/**
 * Rarity levels with XP multipliers
 */
const RARITY = {
    COMMON: { name: 'Common', color: '#9ca3af', xpMultiplier: 1 },
    UNCOMMON: { name: 'Uncommon', color: '#22c55e', xpMultiplier: 1.5 },
    RARE: { name: 'Rare', color: '#3b82f6', xpMultiplier: 2 },
    EPIC: { name: 'Epic', color: '#a855f7', xpMultiplier: 3 },
    LEGENDARY: { name: 'Legendary', color: '#f59e0b', xpMultiplier: 5 },
    SECRET: { name: 'Secret', color: '#ef4444', xpMultiplier: 4 }
};

/**
 * Achievement categories
 */
const CATEGORIES = {
    GRADES: { name: 'Grades', icon: '📊', description: 'Grade-related achievements' },
    STUDY: { name: 'Study', icon: '📚', description: 'Study and homework achievements' },
    STREAK: { name: 'Streaks', icon: '🔥', description: 'Consistency achievements' },
    SOCIAL: { name: 'Social', icon: '👥', description: 'Social feature achievements' },
    EXPLORER: { name: 'Explorer', icon: '🧭', description: 'Feature exploration achievements' },
    GAMES: { name: 'Games', icon: '🎮', description: 'Minigame achievements' },
    SECRET: { name: 'Secret', icon: '🔮', description: 'Hidden achievements' },
    MILESTONE: { name: 'Milestone', icon: '🏆', description: 'Major milestones' }
};

/**
 * All achievements
 */
const ACHIEVEMENTS = {
    // ========== GRADE ACHIEVEMENTS (15) ==========
    first_grade: {
        id: 'first_grade',
        name: 'First Steps',
        description: 'Receive your first grade',
        icon: '📝',
        category: 'GRADES',
        rarity: 'COMMON',
        xp: 50,
        check: (progress) => progress.gradesReceived >= 1,
        progress: (progress) => Math.min(progress.gradesReceived, 1),
        maxProgress: 1
    },
    
    ten_grades: {
        id: 'ten_grades',
        name: 'Getting Started',
        description: 'Receive 10 grades',
        icon: '📋',
        category: 'GRADES',
        rarity: 'COMMON',
        xp: 100,
        check: (progress) => progress.gradesReceived >= 10,
        progress: (progress) => Math.min(progress.gradesReceived, 10),
        maxProgress: 10
    },
    
    fifty_grades: {
        id: 'fifty_grades',
        name: 'Grade Collector',
        description: 'Receive 50 grades',
        icon: '📦',
        category: 'GRADES',
        rarity: 'UNCOMMON',
        xp: 200,
        check: (progress) => progress.gradesReceived >= 50,
        progress: (progress) => Math.min(progress.gradesReceived, 50),
        maxProgress: 50
    },
    
    hundred_grades: {
        id: 'hundred_grades',
        name: 'Century',
        description: 'Receive 100 grades',
        icon: '💯',
        category: 'GRADES',
        rarity: 'RARE',
        xp: 500,
        check: (progress) => progress.gradesReceived >= 100,
        progress: (progress) => Math.min(progress.gradesReceived, 100),
        maxProgress: 100
    },
    
    first_ten: {
        id: 'first_ten',
        name: 'Perfect!',
        description: 'Get your first 10',
        icon: '🌟',
        category: 'GRADES',
        rarity: 'EPIC',
        xp: 500,
        check: (progress) => progress.perfectScores >= 1,
        progress: (progress) => Math.min(progress.perfectScores, 1),
        maxProgress: 1
    },
    
    five_tens: {
        id: 'five_tens',
        name: 'Perfectionist',
        description: 'Get 5 perfect 10s',
        icon: '⭐',
        category: 'GRADES',
        rarity: 'LEGENDARY',
        xp: 1000,
        check: (progress) => progress.perfectScores >= 5,
        progress: (progress) => Math.min(progress.perfectScores, 5),
        maxProgress: 5
    },
    
    high_five: {
        id: 'high_five',
        name: 'High Five',
        description: 'Get 5 good grades (≥7.5) in a row',
        icon: '🖐️',
        category: 'GRADES',
        rarity: 'RARE',
        xp: 300,
        check: (progress) => progress.highGradesInRow >= 5,
        progress: (progress) => Math.min(progress.highGradesInRow, 5),
        maxProgress: 5
    },
    
    ten_streak: {
        id: 'ten_streak',
        name: 'On Fire!',
        description: 'Get 10 good grades (≥7.5) in a row',
        icon: '🔥',
        category: 'GRADES',
        rarity: 'EPIC',
        xp: 600,
        check: (progress) => progress.highGradesInRow >= 10,
        progress: (progress) => Math.min(progress.highGradesInRow, 10),
        maxProgress: 10
    },
    
    comeback_king: {
        id: 'comeback_king',
        name: 'Comeback King',
        description: 'Improve a failing grade to passing',
        icon: '👑',
        category: 'GRADES',
        rarity: 'RARE',
        xp: 400,
        check: (progress) => progress.comebacks >= 1,
        progress: (progress) => Math.min(progress.comebacks, 1),
        maxProgress: 1
    },
    
    all_passing: {
        id: 'all_passing',
        name: 'Clean Sheet',
        description: 'Have no failing grades',
        icon: '✨',
        category: 'GRADES',
        rarity: 'EPIC',
        xp: 750,
        check: (progress, grades) => grades && grades.length >= 10 && grades.every(g => g.value >= 5.5),
        progress: (progress, grades) => grades ? grades.filter(g => g.value >= 5.5).length : 0,
        maxProgress: null
    },
    
    subject_master: {
        id: 'subject_master',
        name: 'Subject Master',
        description: 'Achieve 8+ average in any subject',
        icon: '🎯',
        category: 'GRADES',
        rarity: 'RARE',
        xp: 400,
        check: (progress, grades) => {
            if (!grades) return false;
            const subjects = {};
            grades.forEach(g => {
                if (!subjects[g.subject]) subjects[g.subject] = [];
                subjects[g.subject].push(g.value);
            });
            return Object.values(subjects).some(vals => 
                vals.length >= 3 && vals.reduce((a, b) => a + b, 0) / vals.length >= 8
            );
        },
        progress: (progress, grades) => {
            if (!grades) return 0;
            const subjects = {};
            grades.forEach(g => {
                if (!subjects[g.subject]) subjects[g.subject] = [];
                subjects[g.subject].push(g.value);
            });
            const maxAvg = Math.max(...Object.values(subjects)
                .filter(vals => vals.length >= 3)
                .map(vals => vals.reduce((a, b) => a + b, 0) / vals.length), 0);
            return Math.min(maxAvg, 8);
        },
        maxProgress: 8
    },
    
    all_subjects: {
        id: 'all_subjects',
        name: 'Jack of All Trades',
        description: 'Receive grades in 10+ different subjects',
        icon: '🃏',
        category: 'GRADES',
        rarity: 'UNCOMMON',
        xp: 250,
        check: (progress) => progress.subjectsWithGrades.size >= 10,
        progress: (progress) => progress.subjectsWithGrades.size,
        maxProgress: 10
    },
    
    grade_climber: {
        id: 'grade_climber',
        name: 'Grade Climber',
        description: 'Improve your average by 0.5 points',
        icon: '🧗',
        category: 'GRADES',
        rarity: 'UNCOMMON',
        xp: 200,
        check: (progress) => progress.averageImprovement >= 0.5,
        progress: (progress) => Math.min(progress.averageImprovement || 0, 0.5),
        maxProgress: 0.5
    },
    
    thousand_points: {
        id: 'thousand_points',
        name: 'Point Collector',
        description: 'Accumulate 1000 grade points total',
        icon: '💎',
        category: 'GRADES',
        rarity: 'RARE',
        xp: 350,
        check: (progress) => progress.totalGradePoints >= 1000,
        progress: (progress) => Math.min(progress.totalGradePoints, 1000),
        maxProgress: 1000
    },
    
    grade_diversity: {
        id: 'grade_diversity',
        name: 'Diverse Learner',
        description: 'Get every grade from 1 to 10 at least once',
        icon: '🌈',
        category: 'GRADES',
        rarity: 'EPIC',
        xp: 500,
        check: (progress) => progress.uniqueGrades && progress.uniqueGrades.size >= 10,
        progress: (progress) => progress.uniqueGrades?.size || 0,
        maxProgress: 10
    },
    
    // ========== STUDY ACHIEVEMENTS (10) ==========
    first_homework: {
        id: 'first_homework',
        name: 'Homework Hero',
        description: 'Complete your first custom homework task',
        icon: '📝',
        category: 'STUDY',
        rarity: 'COMMON',
        xp: 50,
        check: (progress) => progress.homeworkCompleted >= 1,
        progress: (progress) => Math.min(progress.homeworkCompleted, 1),
        maxProgress: 1
    },
    
    homework_streak_5: {
        id: 'homework_streak_5',
        name: 'Consistent',
        description: 'Complete homework for 5 days in a row',
        icon: '📆',
        category: 'STUDY',
        rarity: 'UNCOMMON',
        xp: 150,
        check: (progress) => progress.homeworkStreak >= 5,
        progress: (progress) => Math.min(progress.homeworkStreak || 0, 5),
        maxProgress: 5
    },
    
    homework_streak_30: {
        id: 'homework_streak_30',
        name: 'Dedicated Student',
        description: 'Complete homework for 30 days in a row',
        icon: '🎖️',
        category: 'STUDY',
        rarity: 'EPIC',
        xp: 750,
        check: (progress) => progress.homeworkStreak >= 30,
        progress: (progress) => Math.min(progress.homeworkStreak || 0, 30),
        maxProgress: 30
    },
    
    homework_100: {
        id: 'homework_100',
        name: 'Homework Master',
        description: 'Complete 100 homework tasks',
        icon: '📚',
        category: 'STUDY',
        rarity: 'RARE',
        xp: 400,
        check: (progress) => progress.homeworkCompleted >= 100,
        progress: (progress) => Math.min(progress.homeworkCompleted, 100),
        maxProgress: 100
    },
    
    early_bird: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Log in before 7 AM',
        icon: '🐦',
        category: 'STUDY',
        rarity: 'UNCOMMON',
        xp: 100,
        check: (progress) => progress.earlyBirdLogins >= 1,
        progress: (progress) => Math.min(progress.earlyBirdLogins, 1),
        maxProgress: 1
    },
    
    night_owl: {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Log in after 11 PM',
        icon: '🦉',
        category: 'STUDY',
        rarity: 'UNCOMMON',
        xp: 100,
        check: (progress) => progress.nightOwlLogins >= 1,
        progress: (progress) => Math.min(progress.nightOwlLogins, 1),
        maxProgress: 1
    },
    
    study_group_creator: {
        id: 'study_group_creator',
        name: 'Group Leader',
        description: 'Create your first study group',
        icon: '👥',
        category: 'STUDY',
        rarity: 'UNCOMMON',
        xp: 150,
        check: (progress) => progress.studyGroupsCreated >= 1,
        progress: (progress) => Math.min(progress.studyGroupsCreated || 0, 1),
        maxProgress: 1
    },
    
    study_group_member: {
        id: 'study_group_member',
        name: 'Team Player',
        description: 'Join 3 different study groups',
        icon: '🤝',
        category: 'STUDY',
        rarity: 'RARE',
        xp: 250,
        check: (progress) => progress.studyGroupsJoined >= 3,
        progress: (progress) => Math.min(progress.studyGroupsJoined || 0, 3),
        maxProgress: 3
    },
    
    notes_shared: {
        id: 'notes_shared',
        name: 'Knowledge Sharer',
        description: 'Share notes in a study group',
        icon: '📤',
        category: 'STUDY',
        rarity: 'UNCOMMON',
        xp: 150,
        check: (progress) => progress.notesShared >= 1,
        progress: (progress) => Math.min(progress.notesShared || 0, 1),
        maxProgress: 1
    },
    
    study_session: {
        id: 'study_session',
        name: 'Study Buddy',
        description: 'Participate in a scheduled study session',
        icon: '⏰',
        category: 'STUDY',
        rarity: 'RARE',
        xp: 200,
        check: (progress) => progress.studySessions >= 1,
        progress: (progress) => Math.min(progress.studySessions || 0, 1),
        maxProgress: 1
    },
    
    // ========== STREAK ACHIEVEMENTS (8) ==========
    streak_3: {
        id: 'streak_3',
        name: 'Getting Started',
        description: 'Maintain a 3-day login streak',
        icon: '🔥',
        category: 'STREAK',
        rarity: 'COMMON',
        xp: 75,
        check: (progress) => progress.currentStreak >= 3,
        progress: (progress) => Math.min(progress.currentStreak, 3),
        maxProgress: 3
    },
    
    streak_7: {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day login streak',
        icon: '🗓️',
        category: 'STREAK',
        rarity: 'UNCOMMON',
        xp: 200,
        check: (progress) => progress.currentStreak >= 7,
        progress: (progress) => Math.min(progress.currentStreak, 7),
        maxProgress: 7
    },
    
    streak_30: {
        id: 'streak_30',
        name: 'Month Master',
        description: 'Maintain a 30-day login streak',
        icon: '📅',
        category: 'STREAK',
        rarity: 'RARE',
        xp: 500,
        check: (progress) => progress.currentStreak >= 30,
        progress: (progress) => Math.min(progress.currentStreak, 30),
        maxProgress: 30
    },
    
    streak_100: {
        id: 'streak_100',
        name: 'Century Streak',
        description: 'Maintain a 100-day login streak',
        icon: '🏅',
        category: 'STREAK',
        rarity: 'LEGENDARY',
        xp: 1500,
        check: (progress) => progress.currentStreak >= 100,
        progress: (progress) => Math.min(progress.currentStreak, 100),
        maxProgress: 100
    },
    
    streak_365: {
        id: 'streak_365',
        name: 'Year of Dedication',
        description: 'Maintain a 365-day login streak',
        icon: '👑',
        category: 'STREAK',
        rarity: 'LEGENDARY',
        xp: 5000,
        check: (progress) => progress.currentStreak >= 365,
        progress: (progress) => Math.min(progress.currentStreak, 365),
        maxProgress: 365
    },
    
    streak_recovery: {
        id: 'streak_recovery',
        name: 'Phoenix',
        description: 'Rebuild a streak after losing it',
        icon: '🔄',
        category: 'STREAK',
        rarity: 'UNCOMMON',
        xp: 150,
        check: (progress) => progress.streakRecoveries >= 1,
        progress: (progress) => Math.min(progress.streakRecoveries || 0, 1),
        maxProgress: 1
    },
    
    max_streak_record: {
        id: 'max_streak_record',
        name: 'Personal Best',
        description: 'Beat your previous streak record',
        icon: '🏆',
        category: 'STREAK',
        rarity: 'RARE',
        xp: 300,
        check: (progress) => progress.currentStreak > (progress.previousMaxStreak || 0),
        progress: (progress) => progress.currentStreak,
        maxProgress: null
    },
    
    weekend_warrior: {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Log in on 10 consecutive weekends',
        icon: '🎉',
        category: 'STREAK',
        rarity: 'RARE',
        xp: 350,
        check: (progress) => progress.weekendStreak >= 10,
        progress: (progress) => Math.min(progress.weekendStreak || 0, 10),
        maxProgress: 10
    },
    
    // ========== EXPLORER ACHIEVEMENTS (10) ==========
    first_settings: {
        id: 'first_settings',
        name: 'Customizer',
        description: 'Change your first setting',
        icon: '⚙️',
        category: 'EXPLORER',
        rarity: 'COMMON',
        xp: 50,
        check: (progress) => progress.settingsCustomized >= 1,
        progress: (progress) => Math.min(progress.settingsCustomized, 1),
        maxProgress: 1
    },
    
    theme_explorer: {
        id: 'theme_explorer',
        name: 'Theme Explorer',
        description: 'Try 3 different themes',
        icon: '🎨',
        category: 'EXPLORER',
        rarity: 'UNCOMMON',
        xp: 100,
        check: (progress) => progress.themesUsed.size >= 3,
        progress: (progress) => progress.themesUsed.size,
        maxProgress: 3
    },
    
    background_master: {
        id: 'background_master',
        name: 'Background Master',
        description: 'Set a custom background',
        icon: '🖼️',
        category: 'EXPLORER',
        rarity: 'UNCOMMON',
        xp: 100,
        check: (progress) => progress.customBackgroundSet,
        progress: (progress) => progress.customBackgroundSet ? 1 : 0,
        maxProgress: 1
    },
    
    nickname_namer: {
        id: 'nickname_namer',
        name: 'Nickname Namer',
        description: 'Set your first nickname',
        icon: '🏷️',
        category: 'EXPLORER',
        rarity: 'COMMON',
        xp: 75,
        check: (progress) => progress.nicknamesSet >= 1,
        progress: (progress) => Math.min(progress.nicknamesSet || 0, 1),
        maxProgress: 1
    },
    
    analytics_user: {
        id: 'analytics_user',
        name: 'Data Driven',
        description: 'Open the analytics dashboard',
        icon: '📊',
        category: 'EXPLORER',
        rarity: 'COMMON',
        xp: 75,
        check: (progress) => progress.analyticsOpened >= 1,
        progress: (progress) => Math.min(progress.analyticsOpened || 0, 1),
        maxProgress: 1
    },
    
    whatif_explorer: {
        id: 'whatif_explorer',
        name: 'What If Wizard',
        description: 'Use the What-If calculator 5 times',
        icon: '🔮',
        category: 'EXPLORER',
        rarity: 'UNCOMMON',
        xp: 150,
        check: (progress) => progress.whatifCalculations >= 5,
        progress: (progress) => Math.min(progress.whatifCalculations || 0, 5),
        maxProgress: 5
    },
    
    extension_veteran: {
        id: 'extension_veteran',
        name: 'Veteran',
        description: 'Use Somtoday Mod for 30 days',
        icon: '🎖️',
        category: 'EXPLORER',
        rarity: 'RARE',
        xp: 400,
        check: (progress) => progress.extensionDaysUsed >= 30,
        progress: (progress) => Math.min(progress.extensionDaysUsed, 30),
        maxProgress: 30
    },
    
    extension_og: {
        id: 'extension_og',
        name: 'OG User',
        description: 'Use Somtoday Mod for 1 year',
        icon: '🏛️',
        category: 'EXPLORER',
        rarity: 'LEGENDARY',
        xp: 2000,
        check: (progress) => progress.extensionDaysUsed >= 365,
        progress: (progress) => Math.min(progress.extensionDaysUsed, 365),
        maxProgress: 365
    },
    
    settings_master: {
        id: 'settings_master',
        name: 'Settings Master',
        description: 'Customize 20 different settings',
        icon: '🛠️',
        category: 'EXPLORER',
        rarity: 'RARE',
        xp: 300,
        check: (progress) => progress.settingsCustomized >= 20,
        progress: (progress) => Math.min(progress.settingsCustomized, 20),
        maxProgress: 20
    },
    
    export_import: {
        id: 'export_import',
        name: 'Backup Pro',
        description: 'Export and import your settings',
        icon: '💾',
        category: 'EXPLORER',
        rarity: 'UNCOMMON',
        xp: 100,
        check: (progress) => progress.settingsExported && progress.settingsImported,
        progress: (progress) => (progress.settingsExported ? 0.5 : 0) + (progress.settingsImported ? 0.5 : 0),
        maxProgress: 1
    },
    
    // ========== GAME ACHIEVEMENTS (7) ==========
    first_game: {
        id: 'first_game',
        name: 'Gamer',
        description: 'Play your first minigame',
        icon: '🎮',
        category: 'GAMES',
        rarity: 'COMMON',
        xp: 50,
        check: (progress) => progress.gamesPlayed >= 1,
        progress: (progress) => Math.min(progress.gamesPlayed, 1),
        maxProgress: 1
    },
    
    game_addict: {
        id: 'game_addict',
        name: 'Game Addict',
        description: 'Play 50 minigames',
        icon: '🕹️',
        category: 'GAMES',
        rarity: 'RARE',
        xp: 300,
        check: (progress) => progress.gamesPlayed >= 50,
        progress: (progress) => Math.min(progress.gamesPlayed, 50),
        maxProgress: 50
    },
    
    platformer_complete: {
        id: 'platformer_complete',
        name: 'Platformer Pro',
        description: 'Complete the platformer game',
        icon: '🏃',
        category: 'GAMES',
        rarity: 'UNCOMMON',
        xp: 200,
        check: (progress) => progress.platformerCompleted,
        progress: (progress) => progress.platformerCompleted ? 1 : 0,
        maxProgress: 1
    },
    
    grade_defender_100: {
        id: 'grade_defender_100',
        name: 'Grade Defender',
        description: 'Score 100+ in Grade Defender',
        icon: '🛡️',
        category: 'GAMES',
        rarity: 'UNCOMMON',
        xp: 200,
        check: (progress) => progress.gradeDefenderHighScore >= 100,
        progress: (progress) => Math.min(progress.gradeDefenderHighScore || 0, 100),
        maxProgress: 100
    },
    
    grade_defender_500: {
        id: 'grade_defender_500',
        name: 'Grade Guardian',
        description: 'Score 500+ in Grade Defender',
        icon: '⚔️',
        category: 'GAMES',
        rarity: 'EPIC',
        xp: 600,
        check: (progress) => progress.gradeDefenderHighScore >= 500,
        progress: (progress) => Math.min(progress.gradeDefenderHighScore || 0, 500),
        maxProgress: 500
    },
    
    all_weapons: {
        id: 'all_weapons',
        name: 'Arsenal',
        description: 'Unlock all weapons in Grade Defender',
        icon: '🔫',
        category: 'GAMES',
        rarity: 'RARE',
        xp: 400,
        check: (progress) => progress.weaponsUnlocked >= 5,
        progress: (progress) => Math.min(progress.weaponsUnlocked || 0, 5),
        maxProgress: 5
    },
    
    speedrunner: {
        id: 'speedrunner',
        name: 'Speedrunner',
        description: 'Complete the platformer in under 60 seconds',
        icon: '⚡',
        category: 'GAMES',
        rarity: 'LEGENDARY',
        xp: 1000,
        check: (progress) => progress.platformerBestTime && progress.platformerBestTime < 60,
        progress: (progress) => progress.platformerBestTime ? Math.max(0, 60 - progress.platformerBestTime) : 0,
        maxProgress: 60
    },
    
    // ========== SECRET ACHIEVEMENTS (5) ==========
    konami_code: {
        id: 'konami_code',
        name: 'Konami Master',
        description: 'Enter the Konami code',
        icon: '🕹️',
        category: 'SECRET',
        rarity: 'SECRET',
        xp: 250,
        hidden: true,
        check: (progress) => progress.konamiEntered,
        progress: (progress) => progress.konamiEntered ? 1 : 0,
        maxProgress: 1
    },
    
    easter_egg_hunter: {
        id: 'easter_egg_hunter',
        name: 'Egg Hunter',
        description: 'Find 5 easter eggs',
        icon: '🥚',
        category: 'SECRET',
        rarity: 'SECRET',
        xp: 500,
        hidden: true,
        check: (progress) => progress.easterEggsFound >= 5,
        progress: (progress) => Math.min(progress.easterEggsFound || 0, 5),
        maxProgress: 5
    },
    
    barrel_roll: {
        id: 'barrel_roll',
        name: 'Do a Barrel Roll!',
        description: 'Make the page do a barrel roll',
        icon: '🔄',
        category: 'SECRET',
        rarity: 'SECRET',
        xp: 150,
        hidden: true,
        check: (progress) => progress.barrelRollDone,
        progress: (progress) => progress.barrelRollDone ? 1 : 0,
        maxProgress: 1
    },
    
    night_theme_midnight: {
        id: 'night_theme_midnight',
        name: 'Midnight Scholar',
        description: 'Use night theme at exactly midnight',
        icon: '🌙',
        category: 'SECRET',
        rarity: 'SECRET',
        xp: 300,
        hidden: true,
        check: (progress) => progress.midnightNightTheme,
        progress: (progress) => progress.midnightNightTheme ? 1 : 0,
        maxProgress: 1
    },
    
    the_answer: {
        id: 'the_answer',
        name: 'The Answer',
        description: 'Achieve a 4.2 GPA (the answer to everything)',
        icon: '🌌',
        category: 'SECRET',
        rarity: 'SECRET',
        xp: 420,
        hidden: true,
        check: (progress, grades) => {
            if (!grades) return false;
            const avg = grades.reduce((a, g) => a + g.value, 0) / grades.length;
            const gpa = (avg - 1) / 9 * 4;
            return Math.abs(gpa - 4.2) < 0.05;
        },
        progress: (progress, grades) => {
            if (!grades) return 0;
            const avg = grades.reduce((a, g) => a + g.value, 0) / grades.length;
            return (avg - 1) / 9 * 4;
        },
        maxProgress: 4.2
    },
    
    // ========== MILESTONE ACHIEVEMENTS (5) ==========
    level_5: {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        category: 'MILESTONE',
        rarity: 'UNCOMMON',
        xp: 0,
        check: (progress, _, data) => data && data.level >= 5,
        progress: (progress, _, data) => data?.level || 1,
        maxProgress: 5
    },
    
    level_10: {
        id: 'level_10',
        name: 'Getting Good',
        description: 'Reach level 10',
        icon: '🌟',
        category: 'MILESTONE',
        rarity: 'RARE',
        xp: 0,
        check: (progress, _, data) => data && data.level >= 10,
        progress: (progress, _, data) => data?.level || 1,
        maxProgress: 10
    },
    
    level_25: {
        id: 'level_25',
        name: 'Expert',
        description: 'Reach level 25',
        icon: '💫',
        category: 'MILESTONE',
        rarity: 'EPIC',
        xp: 0,
        check: (progress, _, data) => data && data.level >= 25,
        progress: (progress, _, data) => data?.level || 1,
        maxProgress: 25
    },
    
    level_50: {
        id: 'level_50',
        name: 'Master',
        description: 'Reach level 50',
        icon: '🏆',
        category: 'MILESTONE',
        rarity: 'LEGENDARY',
        xp: 0,
        check: (progress, _, data) => data && data.level >= 50,
        progress: (progress, _, data) => data?.level || 1,
        maxProgress: 50
    },
    
    achievement_hunter: {
        id: 'achievement_hunter',
        name: 'Achievement Hunter',
        description: 'Unlock 25 achievements',
        icon: '🎯',
        category: 'MILESTONE',
        rarity: 'EPIC',
        xp: 500,
        check: (progress, _, data) => data && data.unlockedAchievements.length >= 25,
        progress: (progress, _, data) => data?.unlockedAchievements.length || 0,
        maxProgress: 25
    }
};

// ============================================================================
// Achievement Functions
// ============================================================================

/**
 * Check all achievements and unlock new ones
 */
function checkAchievements(grades = null) {
    const progress = getAchievementProgress();
    const data = getAchievementData();
    const newlyUnlocked = [];
    
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (data.unlockedAchievements.includes(id)) continue;
        
        try {
            if (achievement.check(progress, grades, data)) {
                // Unlock the achievement
                data.unlockedAchievements.push(id);
                data.unlockedAt[id] = Date.now();
                
                // Add XP
                const rarity = RARITY[achievement.rarity];
                const xp = Math.floor(achievement.xp * rarity.xpMultiplier);
                data.totalXP += xp;
                
                // Recalculate level
                data.level = calculateLevel(data.totalXP);
                
                newlyUnlocked.push({ ...achievement, earnedXP: xp });
            }
        } catch (e) {
            console.warn(`Error checking achievement ${id}:`, e);
        }
    }
    
    if (newlyUnlocked.length > 0) {
        saveAchievementData(data);
        showAchievementPopups(newlyUnlocked);
    }
    
    return newlyUnlocked;
}

/**
 * Calculate level from XP
 */
function calculateLevel(xp) {
    // Level curve: level = floor(sqrt(xp / 100))
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

/**
 * Calculate XP needed for next level
 */
function xpForLevel(level) {
    return Math.pow(level - 1, 2) * 100;
}

/**
 * Show achievement unlock popups
 */
function showAchievementPopups(achievements) {
    achievements.forEach((achievement, index) => {
        setTimeout(() => {
            showAchievementPopup(achievement);
        }, index * 2500);
    });
}

/**
 * Show single achievement popup
 */
function showAchievementPopup(achievement) {
    const rarity = RARITY[achievement.rarity];
    
    const popup = document.createElement('div');
    popup.className = 'mod-achievement-popup';
    popup.innerHTML = `
        <div class="mod-achievement-popup-content" style="--rarity-color: ${rarity.color}">
            <div class="mod-achievement-popup-icon">${achievement.icon}</div>
            <div class="mod-achievement-popup-text">
                <div class="mod-achievement-popup-title">Achievement Unlocked!</div>
                <div class="mod-achievement-popup-name">${achievement.name}</div>
                <div class="mod-achievement-popup-desc">${achievement.description}</div>
                <div class="mod-achievement-popup-xp">+${achievement.earnedXP} XP</div>
            </div>
            <div class="mod-achievement-popup-rarity" style="color: ${rarity.color}">${rarity.name}</div>
        </div>
    `;
    
    tn('body', 0).appendChild(popup);
    
    // Play sound if available
    try {
        const sound = new Audio(getAudioUrl('correct'));
        sound.volume = 0.3;
        sound.play().catch(() => {});
    } catch {}
    
    // Animate in
    requestAnimationFrame(() => {
        popup.classList.add('mod-achievement-popup-show');
    });
    
    // Remove after animation
    setTimeout(() => {
        popup.classList.add('mod-achievement-popup-hide');
        setTimeout(() => popup.remove(), 500);
    }, 4000);
}

/**
 * Get all achievements with their status
 */
function getAllAchievements() {
    const progress = getAchievementProgress();
    const data = getAchievementData();
    const grades = window.analyticsGrades || [];
    
    return Object.values(ACHIEVEMENTS).map(achievement => {
        const isUnlocked = data.unlockedAchievements.includes(achievement.id);
        const rarity = RARITY[achievement.rarity];
        
        let currentProgress = 0;
        try {
            currentProgress = achievement.progress(progress, grades, data);
        } catch {}
        
        return {
            ...achievement,
            isUnlocked,
            unlockedAt: data.unlockedAt[achievement.id],
            currentProgress,
            rarity,
            category: CATEGORIES[achievement.category]
        };
    });
}

/**
 * Get achievements by category
 */
function getAchievementsByCategory(categoryKey) {
    return getAllAchievements().filter(a => a.category.name === CATEGORIES[categoryKey].name);
}

/**
 * Get achievement stats
 */
function getAchievementStats() {
    const data = getAchievementData();
    const all = getAllAchievements();
    
    const byRarity = {};
    for (const rarity of Object.keys(RARITY)) {
        const total = all.filter(a => a.rarity === rarity).length;
        const unlocked = all.filter(a => a.rarity === rarity && a.isUnlocked).length;
        byRarity[rarity] = { total, unlocked };
    }
    
    const byCategory = {};
    for (const cat of Object.keys(CATEGORIES)) {
        const total = all.filter(a => a.category.name === CATEGORIES[cat].name).length;
        const unlocked = all.filter(a => a.category.name === CATEGORIES[cat].name && a.isUnlocked).length;
        byCategory[cat] = { total, unlocked };
    }
    
    return {
        totalAchievements: all.length,
        unlockedCount: data.unlockedAchievements.length,
        totalXP: data.totalXP,
        level: data.level,
        xpToNextLevel: xpForLevel(data.level + 1) - data.totalXP,
        byRarity,
        byCategory
    };
}

// ============================================================================
// Progress Tracking
// ============================================================================

/**
 * Update progress when a grade is received
 */
function trackGradeReceived(grade) {
    const progress = getAchievementProgress();
    
    progress.gradesReceived++;
    progress.totalGradePoints += grade.value;
    progress.subjectsWithGrades.add(grade.subject.toLowerCase());
    
    // Track unique grades
    if (!progress.uniqueGrades) progress.uniqueGrades = new Set();
    progress.uniqueGrades.add(Math.floor(grade.value));
    
    // Track perfect scores
    if (grade.value >= 9.95) {
        progress.perfectScores++;
    }
    
    // Track high grade streaks
    if (grade.value >= 7.5) {
        progress.highGradesInRow++;
    } else {
        progress.highGradesInRow = 0;
    }
    
    saveAchievementProgress(progress);
    checkAchievements();
}

/**
 * Track homework completion
 */
function trackHomeworkCompleted() {
    const progress = getAchievementProgress();
    progress.homeworkCompleted++;
    
    // Track homework streak
    const today = new Date().toDateString();
    if (progress.lastHomeworkDate === today) {
        // Already tracked today
    } else if (isConsecutiveDay(progress.lastHomeworkDate)) {
        progress.homeworkStreak = (progress.homeworkStreak || 0) + 1;
    } else {
        progress.homeworkStreak = 1;
    }
    progress.lastHomeworkDate = today;
    
    saveAchievementProgress(progress);
    checkAchievements();
}

/**
 * Track daily login
 */
function trackDailyLogin() {
    const progress = getAchievementProgress();
    const now = new Date();
    const today = now.toDateString();
    
    if (progress.lastLoginDate === today) {
        return; // Already tracked today
    }
    
    // Track extension days used
    if (!progress.firstUseDate) {
        progress.firstUseDate = today;
    }
    progress.extensionDaysUsed = Math.floor(
        (now - new Date(progress.firstUseDate)) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    // Track streak
    if (isConsecutiveDay(progress.lastLoginDate)) {
        progress.currentStreak++;
    } else {
        if (progress.currentStreak > 0) {
            progress.previousMaxStreak = progress.maxStreak;
            progress.streakRecoveries = (progress.streakRecoveries || 0) + 1;
        }
        progress.currentStreak = 1;
    }
    
    progress.maxStreak = Math.max(progress.maxStreak || 0, progress.currentStreak);
    progress.lastLoginDate = today;
    progress.loginDays++;
    
    // Track time-based achievements
    const hour = now.getHours();
    if (hour < 7) {
        progress.earlyBirdLogins++;
    }
    if (hour >= 23) {
        progress.nightOwlLogins++;
    }
    
    // Track weekend streak
    const day = now.getDay();
    if (day === 0 || day === 6) {
        if (!progress.lastWeekendLogin || isLastWeekend(progress.lastWeekendLogin)) {
            progress.weekendStreak = (progress.weekendStreak || 0) + 1;
        } else {
            progress.weekendStreak = 1;
        }
        progress.lastWeekendLogin = today;
    }
    
    // Check midnight night theme
    if (hour === 0 && get('theme') === 'night') {
        progress.midnightNightTheme = true;
    }
    
    saveAchievementProgress(progress);
    checkAchievements();
}

/**
 * Track setting change
 */
function trackSettingChanged(settingName) {
    const progress = getAchievementProgress();
    progress.settingsCustomized++;
    
    if (settingName === 'theme') {
        progress.themesUsed.add(get('theme'));
    }
    
    if (settingName === 'background') {
        progress.customBackgroundSet = true;
    }
    
    if (settingName === 'nicknames') {
        progress.nicknamesSet = (progress.nicknamesSet || 0) + 1;
    }
    
    saveAchievementProgress(progress);
    checkAchievements();
}

/**
 * Track game played
 */
function trackGamePlayed(gameName, score = 0) {
    const progress = getAchievementProgress();
    progress.gamesPlayed++;
    
    if (gameName === 'platformer') {
        if (score > 0) {
            progress.platformerCompleted = true;
            if (!progress.platformerBestTime || score < progress.platformerBestTime) {
                progress.platformerBestTime = score;
            }
        }
    }
    
    if (gameName === 'grade_defender') {
        if (score > (progress.gradeDefenderHighScore || 0)) {
            progress.gradeDefenderHighScore = score;
        }
    }
    
    saveAchievementProgress(progress);
    checkAchievements();
}

/**
 * Track easter egg found
 */
function trackEasterEgg(eggName) {
    const progress = getAchievementProgress();
    
    if (eggName === 'konami') {
        progress.konamiEntered = true;
    } else if (eggName === 'barrel_roll') {
        progress.barrelRollDone = true;
    }
    
    progress.easterEggsFound = (progress.easterEggsFound || 0) + 1;
    
    saveAchievementProgress(progress);
    checkAchievements();
}

/**
 * Track analytics opened
 */
function trackAnalyticsOpened() {
    const progress = getAchievementProgress();
    progress.analyticsOpened = (progress.analyticsOpened || 0) + 1;
    saveAchievementProgress(progress);
    checkAchievements();
}

/**
 * Track what-if calculation
 */
function trackWhatIfCalculation() {
    const progress = getAchievementProgress();
    progress.whatifCalculations = (progress.whatifCalculations || 0) + 1;
    saveAchievementProgress(progress);
    checkAchievements();
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if date is consecutive day
 */
function isConsecutiveDay(dateString) {
    if (!dateString) return false;
    const lastDate = new Date(dateString);
    const today = new Date();
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    return diffDays === 1;
}

/**
 * Check if date was last weekend
 */
function isLastWeekend(dateString) {
    if (!dateString) return false;
    const lastDate = new Date(dateString);
    const today = new Date();
    const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    return diffDays >= 1 && diffDays <= 7;
}

// ============================================================================
// Achievement UI
// ============================================================================

/**
 * Create achievements panel
 */
function createAchievementsPanel() {
    if (id('mod-achievements-panel')) {
        id('mod-achievements-panel').remove();
    }
    
    const stats = getAchievementStats();
    const achievements = getAllAchievements();
    
    const panel = document.createElement('div');
    panel.id = 'mod-achievements-panel';
    panel.className = 'mod-achievements-panel';
    panel.innerHTML = `
        <div class="mod-achievements-header">
            <h2>🏆 Achievements</h2>
            <button class="mod-achievements-close" onclick="closeAchievementsPanel()">&times;</button>
        </div>
        
        <div class="mod-achievements-stats">
            <div class="mod-achievement-stat-card">
                <div class="mod-achievement-stat-value">${stats.unlockedCount}/${stats.totalAchievements}</div>
                <div class="mod-achievement-stat-label">Achievements</div>
            </div>
            <div class="mod-achievement-stat-card">
                <div class="mod-achievement-stat-value">${stats.totalXP.toLocaleString()}</div>
                <div class="mod-achievement-stat-label">Total XP</div>
            </div>
            <div class="mod-achievement-stat-card">
                <div class="mod-achievement-stat-value">Lvl ${stats.level}</div>
                <div class="mod-achievement-stat-label">${stats.xpToNextLevel} XP to next</div>
            </div>
        </div>
        
        <div class="mod-achievements-categories">
            ${Object.entries(CATEGORIES).map(([key, cat]) => {
                const catStats = stats.byCategory[key];
                return `
                    <button class="mod-achievement-category ${key === 'GRADES' ? 'active' : ''}" 
                            data-category="${key}">
                        ${cat.icon} ${cat.name} (${catStats.unlocked}/${catStats.total})
                    </button>
                `;
            }).join('')}
        </div>
        
        <div class="mod-achievements-list" id="mod-achievements-list">
            ${renderAchievementsList(achievements.filter(a => a.category.name === CATEGORIES.GRADES.name))}
        </div>
    `;
    
    tn('body', 0).appendChild(panel);
    
    // Add category switching
    panel.querySelectorAll('.mod-achievement-category').forEach(btn => {
        btn.addEventListener('click', () => {
            panel.querySelectorAll('.mod-achievement-category').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.dataset.category;
            const filtered = achievements.filter(a => a.category.name === CATEGORIES[cat].name);
            id('mod-achievements-list').innerHTML = renderAchievementsList(filtered);
        });
    });
}

/**
 * Render achievements list
 */
function renderAchievementsList(achievements) {
    return achievements.map(a => {
        const isHidden = a.hidden && !a.isUnlocked;
        const progressPercent = a.maxProgress ? (a.currentProgress / a.maxProgress) * 100 : (a.isUnlocked ? 100 : 0);
        
        return `
            <div class="mod-achievement-item ${a.isUnlocked ? 'unlocked' : 'locked'} ${isHidden ? 'hidden' : ''}"
                 style="--rarity-color: ${a.rarity.color}">
                <div class="mod-achievement-icon">${isHidden ? '❓' : a.icon}</div>
                <div class="mod-achievement-info">
                    <div class="mod-achievement-name">${isHidden ? '???' : a.name}</div>
                    <div class="mod-achievement-desc">${isHidden ? 'Hidden achievement' : a.description}</div>
                    ${a.maxProgress ? `
                        <div class="mod-achievement-progress">
                            <div class="mod-achievement-progress-bar">
                                <div class="mod-achievement-progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                            <span>${Math.floor(a.currentProgress)}/${a.maxProgress}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="mod-achievement-rarity" style="color: ${a.rarity.color}">
                    ${a.rarity.name}
                    <br>
                    <small>${a.xp} XP</small>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Close achievements panel
 */
function closeAchievementsPanel() {
    const panel = id('mod-achievements-panel');
    if (panel) {
        panel.classList.add('closing');
        setTimeout(() => panel.remove(), 300);
    }
}

// ============================================================================
// Initialize
// ============================================================================

/**
 * Initialize achievement system
 */
function initAchievements() {
    // Track daily login
    trackDailyLogin();
    
    // Check achievements periodically
    setInterval(() => {
        checkAchievements(window.analyticsGrades);
    }, 60000);
}

// Initialize on load
if (typeof execute === 'function') {
    execute([initAchievements]);
}

// Export for use
window.Achievements = {
    check: checkAchievements,
    getAll: getAllAchievements,
    getStats: getAchievementStats,
    showPanel: createAchievementsPanel,
    closePanel: closeAchievementsPanel,
    trackGrade: trackGradeReceived,
    trackHomework: trackHomeworkCompleted,
    trackSetting: trackSettingChanged,
    trackGame: trackGamePlayed,
    trackEasterEgg,
    trackAnalytics: trackAnalyticsOpened,
    trackWhatIf: trackWhatIfCalculation,
    ACHIEVEMENTS,
    RARITY,
    CATEGORIES
};
