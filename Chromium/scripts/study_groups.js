// STUDY GROUPS SYSTEM
// Create and manage study groups with shared notes, chat, and study sessions

// ============================================================================
// Storage Keys
// ============================================================================

const STUDY_GROUPS_KEY = 'mod_study_groups';
const STUDY_NOTES_KEY = 'mod_study_notes';
const STUDY_CHAT_KEY = 'mod_study_chat';
const STUDY_SESSIONS_KEY = 'mod_study_sessions';

// ============================================================================
// Data Store
// ============================================================================

/**
 * Get study groups data
 */
function getStudyGroupsData() {
    const stored = get(STUDY_GROUPS_KEY);
    if (!stored) {
        return {
            myGroups: [],
            joinedGroups: [],
            invites: [],
            lastSync: null
        };
    }
    try {
        return JSON.parse(stored);
    } catch {
        return {
            myGroups: [],
            joinedGroups: [],
            invites: [],
            lastSync: null
        };
    }
}

/**
 * Save study groups data
 */
function saveStudyGroupsData(data) {
    set(STUDY_GROUPS_KEY, JSON.stringify(data));
}

/**
 * Get study notes
 */
function getStudyNotes(groupId = null) {
    const stored = get(STUDY_NOTES_KEY);
    if (!stored) return [];
    
    try {
        const notes = JSON.parse(stored);
        if (groupId) {
            return notes.filter(n => n.groupId === groupId);
        }
        return notes;
    } catch {
        return [];
    }
}

/**
 * Save study notes
 */
function saveStudyNotes(notes) {
    set(STUDY_NOTES_KEY, JSON.stringify(notes));
}

/**
 * Get chat messages for a group
 */
function getChatMessages(groupId) {
    const stored = get(STUDY_CHAT_KEY);
    if (!stored) return [];
    
    try {
        const allChats = JSON.parse(stored);
        return allChats[groupId] || [];
    } catch {
        return [];
    }
}

/**
 * Save chat message
 */
function saveChatMessage(groupId, message) {
    const stored = get(STUDY_CHAT_KEY);
    let allChats = {};
    
    try {
        allChats = JSON.parse(stored) || {};
    } catch {}
    
    if (!allChats[groupId]) {
        allChats[groupId] = [];
    }
    
    allChats[groupId].push(message);
    
    // Keep only last 100 messages per group
    if (allChats[groupId].length > 100) {
        allChats[groupId] = allChats[groupId].slice(-100);
    }
    
    set(STUDY_CHAT_KEY, JSON.stringify(allChats));
}

/**
 * Get study sessions
 */
function getStudySessions(groupId = null) {
    const stored = get(STUDY_SESSIONS_KEY);
    if (!stored) return [];
    
    try {
        const sessions = JSON.parse(stored);
        if (groupId) {
            return sessions.filter(s => s.groupId === groupId);
        }
        return sessions;
    } catch {
        return [];
    }
}

/**
 * Save study sessions
 */
function saveStudySessions(sessions) {
    set(STUDY_SESSIONS_KEY, JSON.stringify(sessions));
}

// ============================================================================
// Group Management
// ============================================================================

/**
 * Create a new study group
 */
function createStudyGroup(name, subject, description = '', isPrivate = false) {
    const data = getStudyGroupsData();
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user', displayName: 'Me' };
    
    const newGroup = {
        id: 'group_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
        name: name.trim(),
        subject: subject.trim(),
        description: description.trim(),
        isPrivate,
        createdBy: profile.id,
        createdByName: profile.displayName,
        createdAt: Date.now(),
        members: [{
            id: profile.id,
            name: profile.displayName,
            role: 'owner',
            joinedAt: Date.now()
        }],
        settings: {
            allowChat: true,
            allowNotes: true,
            allowSessions: true,
            maxMembers: 20
        },
        stats: {
            notesCount: 0,
            messagesCount: 0,
            sessionsCount: 0
        }
    };
    
    data.myGroups.push(newGroup);
    data.joinedGroups.push(newGroup.id);
    saveStudyGroupsData(data);
    
    // Track achievement progress
    if (typeof trackStudyGroupCreated === 'function') {
        trackStudyGroupCreated();
    }
    
    return newGroup;
}

/**
 * Join a study group
 */
function joinStudyGroup(groupId, groupData = null) {
    const data = getStudyGroupsData();
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user', displayName: 'Me' };
    
    if (data.joinedGroups.includes(groupId)) {
        return { success: false, error: 'Already a member' };
    }
    
    // Find the group in myGroups (simulating shared access)
    let group = data.myGroups.find(g => g.id === groupId);
    
    if (!group && groupData) {
        // Add external group
        group = { ...groupData };
        data.myGroups.push(group);
    }
    
    if (!group) {
        return { success: false, error: 'Group not found' };
    }
    
    if (group.members.length >= group.settings.maxMembers) {
        return { success: false, error: 'Group is full' };
    }
    
    // Add member
    group.members.push({
        id: profile.id,
        name: profile.displayName,
        role: 'member',
        joinedAt: Date.now()
    });
    
    data.joinedGroups.push(groupId);
    saveStudyGroupsData(data);
    
    // Track achievement progress
    if (typeof trackStudyGroupJoined === 'function') {
        trackStudyGroupJoined();
    }
    
    return { success: true, group };
}

/**
 * Leave a study group
 */
function leaveStudyGroup(groupId) {
    const data = getStudyGroupsData();
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user' };
    
    const group = data.myGroups.find(g => g.id === groupId);
    if (!group) {
        return { success: false, error: 'Group not found' };
    }
    
    // Check if owner trying to leave
    if (group.createdBy === profile.id) {
        return { success: false, error: 'Owner cannot leave. Transfer ownership or delete the group.' };
    }
    
    // Remove member
    group.members = group.members.filter(m => m.id !== profile.id);
    data.joinedGroups = data.joinedGroups.filter(id => id !== groupId);
    
    saveStudyGroupsData(data);
    return { success: true };
}

/**
 * Delete a study group
 */
function deleteStudyGroup(groupId) {
    const data = getStudyGroupsData();
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user' };
    
    const group = data.myGroups.find(g => g.id === groupId);
    if (!group) {
        return { success: false, error: 'Group not found' };
    }
    
    if (group.createdBy !== profile.id) {
        return { success: false, error: 'Only the owner can delete the group' };
    }
    
    data.myGroups = data.myGroups.filter(g => g.id !== groupId);
    data.joinedGroups = data.joinedGroups.filter(id => id !== groupId);
    
    // Clean up notes and chat
    const notes = getStudyNotes();
    saveStudyNotes(notes.filter(n => n.groupId !== groupId));
    
    const stored = get(STUDY_CHAT_KEY);
    if (stored) {
        try {
            const allChats = JSON.parse(stored);
            delete allChats[groupId];
            set(STUDY_CHAT_KEY, JSON.stringify(allChats));
        } catch {}
    }
    
    saveStudyGroupsData(data);
    return { success: true };
}

/**
 * Get all groups user is part of
 */
function getMyStudyGroups() {
    const data = getStudyGroupsData();
    return data.myGroups.filter(g => data.joinedGroups.includes(g.id));
}

/**
 * Get group by ID
 */
function getStudyGroup(groupId) {
    const data = getStudyGroupsData();
    return data.myGroups.find(g => g.id === groupId);
}

/**
 * Generate invite code
 */
function generateInviteCode(groupId) {
    const group = getStudyGroup(groupId);
    if (!group) return null;
    
    // Create a shareable code (base64 encoded group info)
    const inviteData = {
        id: group.id,
        name: group.name,
        subject: group.subject,
        createdAt: group.createdAt
    };
    
    return btoa(JSON.stringify(inviteData));
}

/**
 * Join via invite code
 */
function joinViaInviteCode(code) {
    try {
        const inviteData = JSON.parse(atob(code));
        return joinStudyGroup(inviteData.id, inviteData);
    } catch {
        return { success: false, error: 'Invalid invite code' };
    }
}

// ============================================================================
// Notes Management
// ============================================================================

/**
 * Add a note to a group
 */
function addStudyNote(groupId, title, content, tags = []) {
    const notes = getStudyNotes();
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user', displayName: 'Me' };
    
    const newNote = {
        id: 'note_' + Math.random().toString(36).substr(2, 9),
        groupId,
        title: title.trim(),
        content: content.trim(),
        tags,
        createdBy: profile.id,
        createdByName: profile.displayName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        likes: [],
        comments: []
    };
    
    notes.push(newNote);
    saveStudyNotes(notes);
    
    // Update group stats
    const data = getStudyGroupsData();
    const group = data.myGroups.find(g => g.id === groupId);
    if (group) {
        group.stats.notesCount++;
        saveStudyGroupsData(data);
    }
    
    // Track achievement
    if (typeof trackNoteShared === 'function') {
        trackNoteShared();
    }
    
    return newNote;
}

/**
 * Update a note
 */
function updateStudyNote(noteId, title, content, tags) {
    const notes = getStudyNotes();
    const note = notes.find(n => n.id === noteId);
    
    if (!note) {
        return { success: false, error: 'Note not found' };
    }
    
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user' };
    if (note.createdBy !== profile.id) {
        return { success: false, error: 'Can only edit your own notes' };
    }
    
    note.title = title.trim();
    note.content = content.trim();
    note.tags = tags;
    note.updatedAt = Date.now();
    
    saveStudyNotes(notes);
    return { success: true, note };
}

/**
 * Delete a note
 */
function deleteStudyNote(noteId) {
    const notes = getStudyNotes();
    const noteIndex = notes.findIndex(n => n.id === noteId);
    
    if (noteIndex === -1) {
        return { success: false, error: 'Note not found' };
    }
    
    const note = notes[noteIndex];
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user' };
    
    if (note.createdBy !== profile.id) {
        return { success: false, error: 'Can only delete your own notes' };
    }
    
    notes.splice(noteIndex, 1);
    saveStudyNotes(notes);
    
    // Update group stats
    const data = getStudyGroupsData();
    const group = data.myGroups.find(g => g.id === note.groupId);
    if (group && group.stats.notesCount > 0) {
        group.stats.notesCount--;
        saveStudyGroupsData(data);
    }
    
    return { success: true };
}

/**
 * Like a note
 */
function likeStudyNote(noteId) {
    const notes = getStudyNotes();
    const note = notes.find(n => n.id === noteId);
    
    if (!note) return false;
    
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user' };
    
    if (note.likes.includes(profile.id)) {
        // Unlike
        note.likes = note.likes.filter(id => id !== profile.id);
    } else {
        // Like
        note.likes.push(profile.id);
    }
    
    saveStudyNotes(notes);
    return true;
}

/**
 * Add comment to a note
 */
function addNoteComment(noteId, comment) {
    const notes = getStudyNotes();
    const note = notes.find(n => n.id === noteId);
    
    if (!note) return false;
    
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user', displayName: 'Me' };
    
    note.comments.push({
        id: 'comment_' + Math.random().toString(36).substr(2, 6),
        authorId: profile.id,
        authorName: profile.displayName,
        content: comment.trim(),
        createdAt: Date.now()
    });
    
    saveStudyNotes(notes);
    return true;
}

// ============================================================================
// Chat System
// ============================================================================

/**
 * Send chat message
 */
function sendChatMessage(groupId, content) {
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user', displayName: 'Me' };
    
    const message = {
        id: 'msg_' + Math.random().toString(36).substr(2, 9),
        authorId: profile.id,
        authorName: profile.displayName,
        content: content.trim(),
        timestamp: Date.now(),
        type: 'message'
    };
    
    saveChatMessage(groupId, message);
    
    // Update group stats
    const data = getStudyGroupsData();
    const group = data.myGroups.find(g => g.id === groupId);
    if (group) {
        group.stats.messagesCount++;
        saveStudyGroupsData(data);
    }
    
    return message;
}

/**
 * Send system message
 */
function sendSystemMessage(groupId, content) {
    const message = {
        id: 'sys_' + Math.random().toString(36).substr(2, 9),
        authorId: 'system',
        authorName: 'System',
        content,
        timestamp: Date.now(),
        type: 'system'
    };
    
    saveChatMessage(groupId, message);
    return message;
}

// ============================================================================
// Study Sessions
// ============================================================================

/**
 * Create a study session
 */
function createStudySession(groupId, title, description, scheduledTime, duration = 60) {
    const sessions = getStudySessions();
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user', displayName: 'Me' };
    
    const newSession = {
        id: 'session_' + Math.random().toString(36).substr(2, 9),
        groupId,
        title: title.trim(),
        description: description.trim(),
        scheduledTime,
        duration, // in minutes
        createdBy: profile.id,
        createdByName: profile.displayName,
        createdAt: Date.now(),
        participants: [profile.id],
        status: 'scheduled', // scheduled, active, completed, cancelled
        notes: '',
        feedback: []
    };
    
    sessions.push(newSession);
    saveStudySessions(sessions);
    
    // Update group stats
    const data = getStudyGroupsData();
    const group = data.myGroups.find(g => g.id === groupId);
    if (group) {
        group.stats.sessionsCount++;
        saveStudyGroupsData(data);
    }
    
    // Send notification
    sendSystemMessage(groupId, `📅 New study session "${title}" scheduled for ${formatDateTime(scheduledTime)}`);
    
    return newSession;
}

/**
 * Join a study session
 */
function joinStudySession(sessionId) {
    const sessions = getStudySessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) return { success: false, error: 'Session not found' };
    
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user' };
    
    if (session.participants.includes(profile.id)) {
        return { success: false, error: 'Already joined' };
    }
    
    session.participants.push(profile.id);
    saveStudySessions(sessions);
    
    // Track achievement
    if (typeof trackStudySessionJoined === 'function') {
        trackStudySessionJoined();
    }
    
    return { success: true };
}

/**
 * Start a study session
 */
function startStudySession(sessionId) {
    const sessions = getStudySessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) return { success: false, error: 'Session not found' };
    
    session.status = 'active';
    session.startedAt = Date.now();
    saveStudySessions(sessions);
    
    // Send notification
    sendSystemMessage(session.groupId, `🟢 Study session "${session.title}" has started!`);
    
    return { success: true };
}

/**
 * End a study session
 */
function endStudySession(sessionId, notes = '') {
    const sessions = getStudySessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) return { success: false, error: 'Session not found' };
    
    session.status = 'completed';
    session.endedAt = Date.now();
    session.notes = notes;
    session.actualDuration = Math.floor((session.endedAt - session.startedAt) / 60000);
    saveStudySessions(sessions);
    
    // Send notification
    sendSystemMessage(session.groupId, `🏁 Study session "${session.title}" has ended. Duration: ${session.actualDuration} minutes`);
    
    return { success: true };
}

/**
 * Get upcoming sessions
 */
function getUpcomingSessions() {
    const sessions = getStudySessions();
    const now = Date.now();
    
    return sessions
        .filter(s => s.status === 'scheduled' && s.scheduledTime > now)
        .sort((a, b) => a.scheduledTime - b.scheduledTime);
}

/**
 * Format date time
 */
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('nl-NL', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ============================================================================
// Study Groups UI
// ============================================================================

/**
 * Create study groups panel
 */
function createStudyGroupsPanel() {
    if (id('mod-study-groups-panel')) {
        id('mod-study-groups-panel').remove();
    }
    
    const groups = getMyStudyGroups();
    
    const panel = document.createElement('div');
    panel.id = 'mod-study-groups-panel';
    panel.className = 'mod-study-groups-panel';
    panel.innerHTML = `
        <div class="mod-sg-header">
            <h2>📚 Study Groups</h2>
            <button class="mod-sg-close" onclick="closeStudyGroupsPanel()">&times;</button>
        </div>
        
        <div class="mod-sg-tabs">
            <button class="mod-sg-tab active" data-tab="groups">My Groups</button>
            <button class="mod-sg-tab" data-tab="sessions">Sessions</button>
            <button class="mod-sg-tab" data-tab="create">Create/Join</button>
        </div>
        
        <div class="mod-sg-content">
            <div class="mod-sg-panel active" id="mod-sg-groups">
                ${renderGroupsPanel(groups)}
            </div>
            <div class="mod-sg-panel" id="mod-sg-sessions">
                ${renderSessionsPanel()}
            </div>
            <div class="mod-sg-panel" id="mod-sg-create">
                ${renderCreatePanel()}
            </div>
        </div>
    `;
    
    tn('body', 0).appendChild(panel);
    
    // Add tab switching
    panel.querySelectorAll('.mod-sg-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.mod-sg-tab').forEach(t => t.classList.remove('active'));
            panel.querySelectorAll('.mod-sg-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            id(`mod-sg-${tab.dataset.tab}`).classList.add('active');
        });
    });
}

/**
 * Render groups panel
 */
function renderGroupsPanel(groups) {
    if (groups.length === 0) {
        return `
            <div class="mod-sg-empty">
                <p>You're not in any study groups yet.</p>
                <p>Create a new group or join one with an invite code!</p>
            </div>
        `;
    }
    
    return `
        <div class="mod-sg-list">
            ${groups.map(g => renderGroupCard(g)).join('')}
        </div>
    `;
}

/**
 * Render group card
 */
function renderGroupCard(group) {
    const memberCount = group.members?.length || 1;
    const isOwner = group.createdBy === (getLeaderboardProfile ? getLeaderboardProfile().id : 'user');
    
    return `
        <div class="mod-sg-card" onclick="openStudyGroup('${group.id}')">
            <div class="mod-sg-card-header">
                <h3>${escapeHtml(group.name)}</h3>
                ${isOwner ? '<span class="mod-sg-owner-badge">Owner</span>' : ''}
            </div>
            <div class="mod-sg-card-subject">${escapeHtml(group.subject)}</div>
            <div class="mod-sg-card-stats">
                <span>👥 ${memberCount} members</span>
                <span>📝 ${group.stats?.notesCount || 0} notes</span>
                <span>💬 ${group.stats?.messagesCount || 0} messages</span>
            </div>
        </div>
    `;
}

/**
 * Render sessions panel
 */
function renderSessionsPanel() {
    const upcoming = getUpcomingSessions();
    
    if (upcoming.length === 0) {
        return `
            <div class="mod-sg-empty">
                <p>No upcoming study sessions.</p>
                <p>Create one from within a study group!</p>
            </div>
        `;
    }
    
    return `
        <div class="mod-sg-sessions-list">
            ${upcoming.map(s => `
                <div class="mod-sg-session-card">
                    <div class="mod-sg-session-time">${formatDateTime(s.scheduledTime)}</div>
                    <div class="mod-sg-session-title">${escapeHtml(s.title)}</div>
                    <div class="mod-sg-session-meta">
                        <span>⏱️ ${s.duration} min</span>
                        <span>👥 ${s.participants.length} joined</span>
                    </div>
                    <button class="mod-btn-small" onclick="joinSessionFromPanel('${s.id}')">Join</button>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Render create panel
 */
function renderCreatePanel() {
    return `
        <div class="mod-sg-create-section">
            <h3>Create New Group</h3>
            <div class="mod-sg-form">
                <div class="mod-sg-form-group">
                    <label>Group Name</label>
                    <input type="text" id="mod-sg-name" placeholder="e.g., Math Study Club" maxlength="50">
                </div>
                <div class="mod-sg-form-group">
                    <label>Subject</label>
                    <input type="text" id="mod-sg-subject" placeholder="e.g., Mathematics" maxlength="30">
                </div>
                <div class="mod-sg-form-group">
                    <label>Description (optional)</label>
                    <textarea id="mod-sg-description" placeholder="What's this group about?" maxlength="200"></textarea>
                </div>
                <div class="mod-sg-form-group">
                    <label class="mod-sg-checkbox">
                        <input type="checkbox" id="mod-sg-private">
                        <span>Private group (invite only)</span>
                    </label>
                </div>
                <button class="mod-btn mod-btn-primary" onclick="createGroupFromForm()">Create Group</button>
            </div>
        </div>
        
        <div class="mod-sg-create-section">
            <h3>Join with Invite Code</h3>
            <div class="mod-sg-form">
                <div class="mod-sg-form-group">
                    <label>Invite Code</label>
                    <input type="text" id="mod-sg-invite-code" placeholder="Paste invite code here">
                </div>
                <button class="mod-btn mod-btn-secondary" onclick="joinGroupFromCode()">Join Group</button>
            </div>
        </div>
    `;
}

/**
 * Open a study group detail view
 */
function openStudyGroup(groupId) {
    const group = getStudyGroup(groupId);
    if (!group) return;
    
    const panel = id('mod-study-groups-panel');
    if (!panel) return;
    
    const content = panel.querySelector('.mod-sg-content');
    const notes = getStudyNotes(groupId);
    const messages = getChatMessages(groupId);
    const sessions = getStudySessions(groupId);
    const inviteCode = generateInviteCode(groupId);
    
    content.innerHTML = `
        <div class="mod-sg-detail">
            <button class="mod-sg-back" onclick="createStudyGroupsPanel()">← Back to Groups</button>
            
            <div class="mod-sg-detail-header">
                <h2>${escapeHtml(group.name)}</h2>
                <span class="mod-sg-detail-subject">${escapeHtml(group.subject)}</span>
            </div>
            
            ${group.description ? `<p class="mod-sg-detail-desc">${escapeHtml(group.description)}</p>` : ''}
            
            <div class="mod-sg-detail-tabs">
                <button class="mod-sg-dtab active" data-dtab="notes">📝 Notes</button>
                <button class="mod-sg-dtab" data-dtab="chat">💬 Chat</button>
                <button class="mod-sg-dtab" data-dtab="members">👥 Members</button>
                <button class="mod-sg-dtab" data-dtab="settings">⚙️ Settings</button>
            </div>
            
            <div class="mod-sg-detail-content">
                <div class="mod-sg-dpanel active" id="mod-sg-dnotes">
                    ${renderNotesSection(groupId, notes)}
                </div>
                <div class="mod-sg-dpanel" id="mod-sg-dchat">
                    ${renderChatSection(groupId, messages)}
                </div>
                <div class="mod-sg-dpanel" id="mod-sg-dmembers">
                    ${renderMembersSection(group)}
                </div>
                <div class="mod-sg-dpanel" id="mod-sg-dsettings">
                    ${renderGroupSettings(group, inviteCode)}
                </div>
            </div>
        </div>
    `;
    
    // Add detail tab switching
    content.querySelectorAll('.mod-sg-dtab').forEach(tab => {
        tab.addEventListener('click', () => {
            content.querySelectorAll('.mod-sg-dtab').forEach(t => t.classList.remove('active'));
            content.querySelectorAll('.mod-sg-dpanel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            id(`mod-sg-d${tab.dataset.dtab}`).classList.add('active');
        });
    });
    
    // Store current group ID for actions
    window.currentStudyGroupId = groupId;
}

/**
 * Render notes section
 */
function renderNotesSection(groupId, notes) {
    return `
        <div class="mod-sg-notes-header">
            <h4>Shared Notes</h4>
            <button class="mod-btn-small" onclick="showAddNoteForm('${groupId}')">+ Add Note</button>
        </div>
        
        <div id="mod-sg-add-note-form" class="mod-sg-add-note-form" style="display: none;">
            <input type="text" id="mod-sg-note-title" placeholder="Note title">
            <textarea id="mod-sg-note-content" placeholder="Note content..."></textarea>
            <input type="text" id="mod-sg-note-tags" placeholder="Tags (comma separated)">
            <div class="mod-sg-form-actions">
                <button class="mod-btn-small mod-btn-primary" onclick="submitNote('${groupId}')">Save</button>
                <button class="mod-btn-small" onclick="hideAddNoteForm()">Cancel</button>
            </div>
        </div>
        
        ${notes.length === 0 
            ? '<p class="mod-sg-empty-small">No notes yet. Be the first to share!</p>'
            : `<div class="mod-sg-notes-list">
                ${notes.map(n => renderNoteCard(n)).join('')}
               </div>`
        }
    `;
}

/**
 * Render note card
 */
function renderNoteCard(note) {
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user' };
    const isOwner = note.createdBy === profile.id;
    const isLiked = note.likes.includes(profile.id);
    
    return `
        <div class="mod-sg-note-card">
            <div class="mod-sg-note-header">
                <h5>${escapeHtml(note.title)}</h5>
                ${isOwner ? `<button class="mod-sg-note-delete" onclick="deleteNote('${note.id}')">🗑️</button>` : ''}
            </div>
            <p class="mod-sg-note-content">${escapeHtml(note.content)}</p>
            <div class="mod-sg-note-tags">
                ${note.tags.map(t => `<span class="mod-sg-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
            <div class="mod-sg-note-footer">
                <span>By ${escapeHtml(note.createdByName)}</span>
                <span>${formatTimeAgo(note.createdAt)}</span>
                <button class="mod-sg-like ${isLiked ? 'liked' : ''}" onclick="toggleLike('${note.id}')">
                    ❤️ ${note.likes.length}
                </button>
            </div>
        </div>
    `;
}

/**
 * Render chat section
 */
function renderChatSection(groupId, messages) {
    return `
        <div class="mod-sg-chat-container">
            <div class="mod-sg-chat-messages" id="mod-sg-chat-messages">
                ${messages.map(m => renderChatMessage(m)).join('')}
            </div>
            <div class="mod-sg-chat-input">
                <input type="text" id="mod-sg-chat-text" placeholder="Type a message..." 
                       onkeypress="if(event.key==='Enter')sendMessage('${groupId}')">
                <button onclick="sendMessage('${groupId}')">Send</button>
            </div>
        </div>
    `;
}

/**
 * Render chat message
 */
function renderChatMessage(message) {
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user' };
    const isOwn = message.authorId === profile.id;
    const isSystem = message.type === 'system';
    
    if (isSystem) {
        return `
            <div class="mod-sg-chat-msg system">
                <span>${escapeHtml(message.content)}</span>
            </div>
        `;
    }
    
    return `
        <div class="mod-sg-chat-msg ${isOwn ? 'own' : ''}">
            <span class="mod-sg-chat-author">${escapeHtml(message.authorName)}</span>
            <span class="mod-sg-chat-content">${escapeHtml(message.content)}</span>
            <span class="mod-sg-chat-time">${formatTimeAgo(message.timestamp)}</span>
        </div>
    `;
}

/**
 * Render members section
 */
function renderMembersSection(group) {
    return `
        <div class="mod-sg-members-list">
            ${group.members.map(m => `
                <div class="mod-sg-member">
                    <span class="mod-sg-member-avatar">👤</span>
                    <span class="mod-sg-member-name">${escapeHtml(m.name)}</span>
                    <span class="mod-sg-member-role ${m.role}">${m.role}</span>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Render group settings
 */
function renderGroupSettings(group, inviteCode) {
    const profile = getLeaderboardProfile ? getLeaderboardProfile() : { id: 'user' };
    const isOwner = group.createdBy === profile.id;
    
    return `
        <div class="mod-sg-settings">
            <div class="mod-sg-setting-group">
                <h4>Invite Code</h4>
                <div class="mod-sg-invite-code">
                    <code id="mod-sg-invite-display">${inviteCode}</code>
                    <button onclick="copyInviteCode()">Copy</button>
                </div>
            </div>
            
            ${isOwner ? `
                <div class="mod-sg-setting-group">
                    <h4>Danger Zone</h4>
                    <button class="mod-btn mod-btn-danger" onclick="deleteCurrentGroup()">Delete Group</button>
                </div>
            ` : `
                <div class="mod-sg-setting-group">
                    <button class="mod-btn mod-btn-secondary" onclick="leaveCurrentGroup()">Leave Group</button>
                </div>
            `}
        </div>
    `;
}

/**
 * Format time ago
 */
function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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
// Global Functions for UI Actions
// ============================================================================

window.createGroupFromForm = function() {
    const name = id('mod-sg-name')?.value;
    const subject = id('mod-sg-subject')?.value;
    const description = id('mod-sg-description')?.value;
    const isPrivate = id('mod-sg-private')?.checked;
    
    if (!name || !subject) {
        alert('Please enter a group name and subject.');
        return;
    }
    
    const group = createStudyGroup(name, subject, description, isPrivate);
    openStudyGroup(group.id);
};

window.joinGroupFromCode = function() {
    const code = id('mod-sg-invite-code')?.value;
    if (!code) {
        alert('Please enter an invite code.');
        return;
    }
    
    const result = joinViaInviteCode(code);
    if (result.success) {
        createStudyGroupsPanel();
    } else {
        alert(result.error);
    }
};

window.openStudyGroup = openStudyGroup;

window.showAddNoteForm = function(groupId) {
    const form = id('mod-sg-add-note-form');
    if (form) form.style.display = 'block';
};

window.hideAddNoteForm = function() {
    const form = id('mod-sg-add-note-form');
    if (form) form.style.display = 'none';
};

window.submitNote = function(groupId) {
    const title = id('mod-sg-note-title')?.value;
    const content = id('mod-sg-note-content')?.value;
    const tagsStr = id('mod-sg-note-tags')?.value || '';
    const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);
    
    if (!title || !content) {
        alert('Please enter a title and content.');
        return;
    }
    
    addStudyNote(groupId, title, content, tags);
    openStudyGroup(groupId);
};

window.deleteNote = function(noteId) {
    if (confirm('Delete this note?')) {
        deleteStudyNote(noteId);
        if (window.currentStudyGroupId) {
            openStudyGroup(window.currentStudyGroupId);
        }
    }
};

window.toggleLike = function(noteId) {
    likeStudyNote(noteId);
    if (window.currentStudyGroupId) {
        openStudyGroup(window.currentStudyGroupId);
    }
};

window.sendMessage = function(groupId) {
    const input = id('mod-sg-chat-text');
    if (!input || !input.value.trim()) return;
    
    sendChatMessage(groupId, input.value);
    input.value = '';
    
    // Refresh chat
    const messages = getChatMessages(groupId);
    const container = id('mod-sg-chat-messages');
    if (container) {
        container.innerHTML = messages.map(m => renderChatMessage(m)).join('');
        container.scrollTop = container.scrollHeight;
    }
};

window.copyInviteCode = function() {
    const code = id('mod-sg-invite-display')?.textContent;
    if (code) {
        navigator.clipboard.writeText(code).then(() => {
            alert('Invite code copied!');
        });
    }
};

window.deleteCurrentGroup = function() {
    if (confirm('Are you sure you want to delete this group? This cannot be undone.')) {
        const result = deleteStudyGroup(window.currentStudyGroupId);
        if (result.success) {
            createStudyGroupsPanel();
        } else {
            alert(result.error);
        }
    }
};

window.leaveCurrentGroup = function() {
    if (confirm('Are you sure you want to leave this group?')) {
        const result = leaveStudyGroup(window.currentStudyGroupId);
        if (result.success) {
            createStudyGroupsPanel();
        } else {
            alert(result.error);
        }
    }
};

window.joinSessionFromPanel = function(sessionId) {
    const result = joinStudySession(sessionId);
    if (result.success) {
        alert('You joined the session!');
    } else {
        alert(result.error);
    }
};

window.closeStudyGroupsPanel = function() {
    const panel = id('mod-study-groups-panel');
    if (panel) {
        panel.classList.add('closing');
        setTimeout(() => panel.remove(), 300);
    }
};

// ============================================================================
// Initialize
// ============================================================================

function initStudyGroups() {
    // Nothing needed on init
}

if (typeof execute === 'function') {
    execute([initStudyGroups]);
}

// Export
window.StudyGroups = {
    create: createStudyGroup,
    join: joinStudyGroup,
    leave: leaveStudyGroup,
    delete: deleteStudyGroup,
    getGroups: getMyStudyGroups,
    getGroup: getStudyGroup,
    addNote: addStudyNote,
    sendMessage: sendChatMessage,
    createSession: createStudySession,
    joinSession: joinStudySession,
    showPanel: createStudyGroupsPanel,
    closePanel: closeStudyGroupsPanel
};
