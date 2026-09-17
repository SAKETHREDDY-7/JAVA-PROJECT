/**
 * ══════════════════════════════════════════════════════════════════════
 * PEER-TO-PEER SKILL EXCHANGE SYSTEM — CLIENT-SIDE JAVASCRIPT (VANILLA)
 * Pure standard JavaScript communicating with Java HttpServer via fetch()
 * ══════════════════════════════════════════════════════════════════════
 */

const app = {
    currentUser: null,
    catalogue: [],
    peersCache: [],
    activePeerId: null,

    init() {
        // Load saved session if exists
        const saved = localStorage.getItem('currentUser');
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
            } catch (e) {
                this.currentUser = null;
            }
        }

        if (this.currentUser) {
            this.setupLoggedInUI();
            this.showView('dashboard');
        } else {
            this.showView('auth');
        }

        this.loadCatalogue();
    },

    setupLoggedInUI() {
        document.getElementById('navbar').classList.remove('hidden');
        document.getElementById('navUserName').textContent = this.currentUser.fullName || 'Student';
        this.initRealtimeSync();
    },

    unsubscribeRealtime: null,

    initRealtimeSync() {
        if (this.unsubscribeRealtime) {
            this.unsubscribeRealtime();
            this.unsubscribeRealtime = null;
        }
        if (typeof FirestoreBackend !== 'undefined' && FirestoreBackend.isAvailable() && this.currentUser) {
            FirestoreBackend.init().then(() => {
                if (FirestoreBackend.db) {
                    const sid = Number(this.currentUser.studentId || this.currentUser.id);
                    this.unsubscribeRealtime = FirestoreBackend.db.collection('requests')
                        .where('toId', '==', sid)
                        .where('status', '==', 'PENDING')
                        .onSnapshot(snap => {
                            const badge = document.getElementById('navReqBadge');
                            if (badge) {
                                badge.textContent = snap.size;
                                badge.classList.toggle('hidden', snap.size === 0);
                            }
                            const statBadge = document.getElementById('statRequests');
                            if (statBadge) {
                                statBadge.textContent = snap.size;
                            }
                        }, () => {});
                }
            });
        }
    },

    backendMode: 'auto',

    getApiBase() {
        if (window.location.port === '8080') {
            return '';
        }
        return 'http://localhost:8080';
    },

    setBackendMode(mode) {
        this.backendMode = mode;
        const navBadge = document.getElementById('serverStatusBadge');
        const authBadge = document.getElementById('authServerStatus');

        if (mode === 'java') {
            if (navBadge) {
                navBadge.textContent = '🟢 Java Backend (Port 8080)';
                navBadge.className = 'badge-server-live';
                navBadge.title = 'Connected to Java HttpServer & MySQL/H2 Database';
            }
            if (authBadge) {
                authBadge.textContent = '🟢 Connected to Java Backend (Port 8080 & MySQL)';
                authBadge.className = 'badge-server-live';
            }
        } else if (mode === 'firestore') {
            if (navBadge) {
                navBadge.textContent = '🔥 Firestore Cloud (Live Sync)';
                navBadge.className = 'badge-server-live';
                navBadge.title = 'Connected to Google Cloud Firestore — Data Persists Across All Devices';
            }
            if (authBadge) {
                authBadge.textContent = '🔥 Google Cloud Firestore (Permanent Live Storage)';
                authBadge.className = 'badge-server-live';
            }
        } else {
            if (navBadge) {
                navBadge.textContent = '🟢 Local Browser Mode';
                navBadge.className = 'badge-server-offline';
                navBadge.title = 'Running locally with in-browser storage.';
            }
            if (authBadge) {
                authBadge.textContent = '🟢 Local Browser Mode';
                authBadge.className = 'badge-server-offline';
            }
        }
    },

    // ── Networking Helper (Supports Java Backend, Cloud Firestore, & Local Storage) ─
    async api(endpoint, method = 'GET', data = null) {
        // 1. If running locally on Java server port 8080, try Java backend first
        if (window.location.port === '8080' && this.backendMode !== 'firestore') {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1200);

                const url = `${this.getApiBase()}${endpoint}`;
                const options = {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    signal: controller.signal
                };
                if (data && (method === 'POST' || method === 'PUT')) {
                    options.body = JSON.stringify(data);
                }

                const res = await fetch(url, options);
                clearTimeout(timeoutId);
                const json = await res.json();
                if (res.ok && json.success !== false) {
                    this.setBackendMode('java');
                    return json;
                }
            } catch (err) {
                // Java not running or error, fall through to Firestore
            }
        }

        // 2. Try Google Cloud Firestore (Real-Time Cross-Device Storage)
        if (typeof FirestoreBackend !== 'undefined' && FirestoreBackend.isAvailable()) {
            try {
                const result = await FirestoreBackend.handle(endpoint, method, data);
                this.setBackendMode('firestore');
                return result;
            } catch (err) {
                console.warn('Firestore request notice:', err.message);
                if (err.message && (
                    err.message.toLowerCase().includes('password') ||
                    err.message.includes('already registered') ||
                    err.message.includes('No account found') ||
                    err.message.includes('Match not found') ||
                    err.message.includes('Request not found')
                )) {
                    throw err;
                }
            }
        }

        // 3. Fallback to MockBackend (In-browser LocalStorage)
        this.setBackendMode('mock');
        return MockBackend.handle(endpoint, method, data);
    },

    // ── Toast Messages ────────────────────────────────────────────
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3500);
    },

    // ── View Switching ────────────────────────────────────────────
    showView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        const target = document.getElementById(`view-${viewName}`);
        if (target) target.classList.remove('hidden');

        // Update nav active link
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Close mobile nav menu
        document.getElementById('navLinks').classList.remove('show');

        // Trigger view-specific data loader
        if (this.currentUser) {
            if (viewName === 'dashboard') this.loadDashboard();
            if (viewName === 'peers') this.loadPeers();
            if (viewName === 'skills') this.loadMySkills();
            if (viewName === 'requests') this.loadRequests();
            if (viewName === 'matches') this.loadMatches();
            if (viewName === 'profile') this.loadProfile();
        }
    },

    toggleMobileNav() {
        document.getElementById('navLinks').classList.toggle('show');
    },

    switchAuthTab(tab) {
        const loginBtn = document.getElementById('tabLoginBtn');
        const regBtn = document.getElementById('tabRegisterBtn');
        const loginBox = document.getElementById('authLoginBox');
        const regBox = document.getElementById('authRegisterBox');

        if (tab === 'login') {
            loginBtn.classList.add('active');
            regBtn.classList.remove('active');
            loginBox.classList.remove('hidden');
            regBox.classList.add('hidden');
        } else {
            loginBtn.classList.remove('active');
            regBtn.classList.add('active');
            loginBox.classList.add('hidden');
            regBox.classList.remove('hidden');
        }
    },

    // ── Authentication ────────────────────────────────────────────
    quickLogin(email, password) {
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = password;
        this.handleLogin(new Event('submit'));
    },

    async handleLogin(e) {
        if (e && e.preventDefault) e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await this.api('/api/auth/login', 'POST', { email, password });
            this.currentUser = data.student;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.setupLoggedInUI();
            this.showToast(`Welcome, ${this.currentUser.fullName}!`);
            this.showView('dashboard');
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    async handleRegister(e) {
        if (e) e.preventDefault();
        const studentNumber = document.getElementById('regStudentNumber').value.trim();
        const fullName = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirmPassword').value;
        const department = document.getElementById('regDepartment').value.trim();
        const yearOfStudy = document.getElementById('regYear').value;
        const bio = document.getElementById('regBio').value.trim();

        if (password !== confirm) {
            this.showToast('Passwords do not match!', 'error');
            return;
        }

        try {
            const data = await this.api('/api/auth/register', 'POST', {
                studentNumber, fullName, email, password, department, yearOfStudy, bio
            });
            this.currentUser = data.student;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.setupLoggedInUI();
            this.showToast('Account registered successfully!');
            this.showView('dashboard');
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    logout() {
        if (this.unsubscribeRealtime) {
            this.unsubscribeRealtime();
            this.unsubscribeRealtime = null;
        }
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('navbar').classList.add('hidden');
        this.showToast('You have signed out.');
        this.showView('auth');
    },

    // ── Catalogue ─────────────────────────────────────────────────
    async loadCatalogue() {
        try {
            this.catalogue = await this.api('/api/skills/catalogue');
            const offSel = document.getElementById('catalogueOfferedSelect');
            const wanSel = document.getElementById('catalogueWantedSelect');
            if (!offSel || !wanSel) return;

            let opts = '<option value="">-- Choose skill --</option>';
            this.catalogue.forEach(s => {
                opts += `<option value="${s.skillId}">${s.skillName} (${s.categoryName})</option>`;
            });
            offSel.innerHTML = opts;
            wanSel.innerHTML = opts;
        } catch (err) {
            console.error('Error loading catalogue:', err);
        }
    },

    // ── Dashboard ─────────────────────────────────────────────────
    async loadDashboard() {
        if (!this.currentUser) return;
        document.getElementById('dashGreeting').textContent = `Welcome back, ${this.currentUser.fullName}!`;

        try {
            const stats = await this.api(`/api/dashboard?studentId=${this.currentUser.studentId}`);
            document.getElementById('statOffered').textContent = stats.offeredCount;
            document.getElementById('statWanted').textContent = stats.wantedCount;
            document.getElementById('statMatches').textContent = stats.activeMatches;
            document.getElementById('statRequests').textContent = stats.pendingRequests;
            document.getElementById('statRating').textContent = stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)} ⭐` : 'New';

            const badge = document.getElementById('navReqBadge');
            if (stats.pendingRequests > 0) {
                badge.textContent = stats.pendingRequests;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }

            // Load top recommendations
            const matches = await this.api(`/api/peers?studentId=${this.currentUser.studentId}`);
            const topBox = document.getElementById('dashTopMatches');
            if (!matches || matches.length === 0) {
                topBox.innerHTML = '<p class="empty-state">Add your offered and wanted skills to discover compatible study partners!</p>';
                return;
            }

            topBox.innerHTML = matches.slice(0, 3).map(m => this.renderPeerCard(m)).join('');
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    },

    // ── Find Peers ────────────────────────────────────────────────
    async loadPeers() {
        if (!this.currentUser) return;
        const box = document.getElementById('peersList');
        box.innerHTML = '<p class="empty-state">Calculating compatibility via MatchingAlgorithm...</p>';

        try {
            this.peersCache = await this.api(`/api/peers?studentId=${this.currentUser.studentId}`);
            this.renderPeers(this.peersCache);
        } catch (err) {
            box.innerHTML = `<p class="empty-state">Error loading peers: ${err.message}</p>`;
        }
    },

    filterPeers() {
        const query = document.getElementById('peerSearchInput').value.trim().toLowerCase();
        if (!query) {
            this.renderPeers(this.peersCache);
            return;
        }

        const filtered = this.peersCache.filter(m => {
            const p = m.peer;
            const nameMatch = p.fullName && p.fullName.toLowerCase().includes(query);
            const deptMatch = p.department && p.department.toLowerCase().includes(query);
            const teachMatch = m.canTeachMe.some(s => s.skillName.toLowerCase().includes(query));
            const wantMatch = m.wantsFromMe.some(s => s.skillName.toLowerCase().includes(query));
            return nameMatch || deptMatch || teachMatch || wantMatch;
        });

        this.renderPeers(filtered);
    },

    renderPeers(list) {
        const box = document.getElementById('peersList');
        if (!list || list.length === 0) {
            box.innerHTML = '<p class="empty-state">No matching peers found. Try adding more skills to your profile!</p>';
            return;
        }
        box.innerHTML = list.map(m => this.renderPeerCard(m)).join('');
    },

    renderPeerCard(m) {
        const p = m.peer;
        const score = Math.round(m.score);
        const badgeClass = score >= 70 ? 'badge-high' : score >= 40 ? 'badge-medium' : 'badge-low';

        const canTeachTags = m.canTeachMe.length > 0
            ? m.canTeachMe.map(s => `<span class="skill-tag">🔹 ${s.skillName}</span>`).join('')
            : '<span class="text-muted" style="font-size:0.8rem">No overlap yet</span>';

        const wantsTags = m.wantsFromMe.length > 0
            ? m.wantsFromMe.map(s => `<span class="skill-tag skill-tag-wanted">🔸 ${s.skillName}</span>`).join('')
            : '<span class="text-muted" style="font-size:0.8rem">No overlap yet</span>';

        return `
            <div class="peer-card">
                <div>
                    <div class="peer-card-header">
                        <div>
                            <h3>${p.fullName}</h3>
                            <p class="peer-card-meta">${p.department} • Year ${p.yearOfStudy}</p>
                        </div>
                        <span class="badge ${badgeClass}">${score}% Match</span>
                    </div>
                    
                    <div class="peer-skills-section">
                        <h4>They Can Teach You:</h4>
                        <div class="skill-tag-group">${canTeachTags}</div>
                        <h4>You Can Teach Them:</h4>
                        <div class="skill-tag-group">${wantsTags}</div>
                    </div>
                </div>

                <button class="btn btn-primary btn-block mt-2" onclick="app.viewPeerProfile(${p.studentId})">
                    View Profile & Exchange Proposal →
                </button>
            </div>
        `;
    },

    // ── Peer Profile ──────────────────────────────────────────────
    async viewPeerProfile(peerId) {
        this.activePeerId = peerId;
        this.showView('peer-profile');

        try {
            const data = await this.api(`/api/peers/profile?peerId=${peerId}&currentUserId=${this.currentUser.studentId}`);
            const p = data.peer;

            document.getElementById('peerDetailName').textContent = p.fullName;
            document.getElementById('peerDetailMeta').textContent = `${p.department} • Year ${p.yearOfStudy} • ID: ${p.studentNumber}`;
            
            const badge = document.getElementById('peerDetailScoreBadge');
            const score = Math.round(data.matchScore);
            badge.textContent = `${score}% Mutual Compatibility`;
            badge.className = `badge ${score >= 70 ? 'badge-high' : score >= 40 ? 'badge-medium' : 'badge-low'} mt-2`;

            document.getElementById('peerDetailRating').textContent = `${data.avgRating} ⭐ (${data.reviews.length} reviews)`;
            document.getElementById('peerDetailBio').textContent = p.bio || 'No bio provided.';

            // Offered skills
            document.getElementById('peerDetailOffered').innerHTML = data.offeredSkills.map(s =>
                `<span class="skill-tag">🔹 ${s.skillName}</span>`
            ).join('') || '<span class="empty-state">None added</span>';

            // Wanted skills
            document.getElementById('peerDetailWanted').innerHTML = data.wantedSkills.map(s =>
                `<span class="skill-tag skill-tag-wanted">🔸 ${s.skillName}</span>`
            ).join('') || '<span class="empty-state">None added</span>';

            // Proposal box state
            const formBox = document.getElementById('proposalFormBox');
            const notice = document.getElementById('proposalNotice');
            if (data.hasExistingRequest) {
                formBox.classList.add('hidden');
                notice.classList.remove('hidden');
            } else {
                formBox.classList.remove('hidden');
                notice.classList.add('hidden');
                document.getElementById('proposalMessage').value = '';
            }

            // Reviews
            const rList = document.getElementById('peerReviewsList');
            if (data.reviews.length === 0) {
                rList.innerHTML = '<p class="empty-state">No peer reviews recorded yet.</p>';
            } else {
                rList.innerHTML = data.reviews.map(r => `
                    <div class="review-item">
                        <div class="review-rating">${r.ratingStars} (${r.rating}/5)</div>
                        <div class="review-comment">"${r.comment || 'Great learning partner!'}"</div>
                        <div class="review-reviewer">By ${r.reviewerName} • ${r.createdAt ? r.createdAt.substring(0, 10) : ''}</div>
                    </div>
                `).join('');
            }

        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    async sendProposal() {
        if (!this.activePeerId || !this.currentUser) return;
        const msg = document.getElementById('proposalMessage').value.trim();

        try {
            await this.api('/api/requests/send', 'POST', {
                senderId: this.currentUser.studentId,
                receiverId: this.activePeerId,
                message: msg
            });
            this.showToast('Skill exchange proposal sent successfully!');
            document.getElementById('proposalFormBox').classList.add('hidden');
            document.getElementById('proposalNotice').classList.remove('hidden');
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    // ── Manage My Skills ──────────────────────────────────────────
    async loadMySkills() {
        if (!this.currentUser) return;
        try {
            const data = await this.api(`/api/skills/my?studentId=${this.currentUser.studentId}`);
            
            // Offered
            const offBox = document.getElementById('myOfferedSkillsList');
            document.getElementById('offeredBadgeCount').textContent = `${data.offered.length} Skills`;
            if (data.offered.length === 0) {
                offBox.innerHTML = '<p class="empty-state">No offered skills added yet.</p>';
            } else {
                offBox.innerHTML = data.offered.map(s => `
                    <div class="skill-pill">
                        <span>🔹 ${s.skillName} <small style="color:#64748b">(${s.categoryName})</small></span>
                        <button onclick="app.removeSkill('OFFERED', ${s.skillId})" title="Remove skill">✕</button>
                    </div>
                `).join('');
            }

            // Wanted
            const wanBox = document.getElementById('myWantedSkillsList');
            document.getElementById('wantedBadgeCount').textContent = `${data.wanted.length} Skills`;
            if (data.wanted.length === 0) {
                wanBox.innerHTML = '<p class="empty-state">No wanted skills added yet.</p>';
            } else {
                wanBox.innerHTML = data.wanted.map(s => `
                    <div class="skill-pill">
                        <span>🔸 ${s.skillName} <small style="color:#64748b">(${s.categoryName})</small></span>
                        <button onclick="app.removeSkill('WANTED', ${s.skillId})" title="Remove skill">✕</button>
                    </div>
                `).join('');
            }

        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    async addSkill(type) {
        const selectId = type === 'OFFERED' ? 'catalogueOfferedSelect' : 'catalogueWantedSelect';
        const skillId = document.getElementById(selectId).value;
        if (!skillId) {
            this.showToast('Please select a skill from the dropdown first', 'error');
            return;
        }

        const endpoint = type === 'OFFERED' ? '/api/skills/offered/add' : '/api/skills/wanted/add';
        try {
            await this.api(endpoint, 'POST', {
                studentId: this.currentUser.studentId,
                skillId: parseInt(skillId)
            });
            this.showToast(`${type === 'OFFERED' ? 'Offered' : 'Wanted'} skill added!`);
            document.getElementById(selectId).value = '';
            this.loadMySkills();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    async removeSkill(type, skillId) {
        const endpoint = type === 'OFFERED' ? '/api/skills/offered/remove' : '/api/skills/wanted/remove';
        try {
            await this.api(endpoint, 'POST', {
                studentId: this.currentUser.studentId,
                skillId: parseInt(skillId)
            });
            this.showToast('Skill removed successfully.');
            this.loadMySkills();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    // ── Requests ──────────────────────────────────────────────────
    switchRequestTab(tab) {
        const inBtn = document.getElementById('tabIncomingBtn');
        const outBtn = document.getElementById('tabOutgoingBtn');
        const inBox = document.getElementById('incomingRequestsBox');
        const outBox = document.getElementById('outgoingRequestsBox');

        if (tab === 'incoming') {
            inBtn.classList.add('active');
            outBtn.classList.remove('active');
            inBox.classList.remove('hidden');
            outBox.classList.add('hidden');
        } else {
            inBtn.classList.remove('active');
            outBtn.classList.add('active');
            inBox.classList.add('hidden');
            outBox.classList.remove('hidden');
        }
    },

    async loadRequests() {
        if (!this.currentUser) return;
        try {
            const [incoming, outgoing] = await Promise.all([
                this.api(`/api/requests/incoming?studentId=${this.currentUser.studentId}`),
                this.api(`/api/requests/outgoing?studentId=${this.currentUser.studentId}`)
            ]);

            // Render incoming
            const inBox = document.getElementById('incomingList');
            if (incoming.length === 0) {
                inBox.innerHTML = '<p class="empty-state">No incoming exchange proposals.</p>';
            } else {
                inBox.innerHTML = incoming.map(r => `
                    <div class="request-card">
                        <div class="request-card-info">
                            <h3>Proposal from ${r.senderName} (${r.senderDept})</h3>
                            <p class="text-muted" style="font-size:0.85rem">Received on: ${r.createdAt ? r.createdAt.substring(0, 10) : 'Recent'}</p>
                            ${r.message ? `<div class="request-card-msg">"${r.message}"</div>` : ''}
                        </div>
                        <div style="display:flex; gap:8px; align-items:center;">
                            ${r.status === 'PENDING' ? `
                                <button class="btn btn-primary btn-sm" onclick="app.respondRequest(${r.requestId}, 'ACCEPT')">✓ Accept Match</button>
                                <button class="btn btn-danger btn-sm" onclick="app.respondRequest(${r.requestId}, 'REJECT')">✕ Decline</button>
                            ` : `<span class="badge ${r.status === 'ACCEPTED' ? 'badge-high' : 'badge-low'}">${r.status}</span>`}
                        </div>
                    </div>
                `).join('');
            }

            // Render outgoing
            const outBox = document.getElementById('outgoingList');
            if (outgoing.length === 0) {
                outBox.innerHTML = '<p class="empty-state">No sent requests.</p>';
            } else {
                outBox.innerHTML = outgoing.map(r => `
                    <div class="request-card">
                        <div class="request-card-info">
                            <h3>Sent to ${r.receiverName} (${r.receiverDept})</h3>
                            <p class="text-muted" style="font-size:0.85rem">Sent on: ${r.createdAt ? r.createdAt.substring(0, 10) : 'Recent'}</p>
                            ${r.message ? `<div class="request-card-msg">"${r.message}"</div>` : ''}
                        </div>
                        <span class="badge ${r.status === 'ACCEPTED' ? 'badge-high' : r.status === 'PENDING' ? 'badge-medium' : 'badge-low'}">${r.status}</span>
                    </div>
                `).join('');
            }

        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    async respondRequest(requestId, action) {
        try {
            await this.api('/api/requests/respond', 'POST', {
                requestId,
                action,
                currentUserId: this.currentUser.studentId,
                matchScore: 85.0
            });
            this.showToast(action === 'ACCEPT' ? 'Proposal accepted! Partnership created.' : 'Proposal declined.');
            this.loadRequests();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    // ── My Matches ────────────────────────────────────────────────
    async loadMatches() {
        if (!this.currentUser) return;
        const box = document.getElementById('matchesList');
        box.innerHTML = '<p class="empty-state">Loading partnerships...</p>';

        try {
            const data = await this.api(`/api/matches?studentId=${this.currentUser.studentId}`);
            if (data.length === 0) {
                box.innerHTML = '<p class="empty-state">No active study partnerships yet. Accept an incoming request or find peers to begin!</p>';
                return;
            }

            box.innerHTML = data.map(item => {
                const m = item.match;
                const peer = m.studentId1 === this.currentUser.studentId ? m.student2 : m.student1;
                const score = Math.round(m.matchScore);

                return `
                    <div class="match-card">
                        <div>
                            <h3>🤝 Exchange Partner: ${peer ? peer.fullName : 'Partner'}</h3>
                            <p class="text-muted" style="font-size:0.88rem">${peer ? peer.department : ''} • Email: ${peer ? peer.email : ''}</p>
                            <p class="text-muted" style="font-size:0.82rem; margin-top:4px;">Matched: ${m.matchedAt ? m.matchedAt.substring(0, 10) : 'Active'}</p>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                            <span class="badge badge-high">${score}% Match</span>
                            ${item.reviewed ? `
                                <span class="badge badge-low">✓ Review Submitted</span>
                            ` : `
                                <button class="btn btn-accent btn-sm" onclick="app.openFeedbackModal(${m.matchId})">⭐ Leave Feedback</button>
                            `}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            box.innerHTML = `<p class="empty-state">Error loading matches: ${err.message}</p>`;
        }
    },

    // ── Feedback Modal ────────────────────────────────────────────
    openFeedbackModal(matchId) {
        document.getElementById('modalMatchId').value = matchId;
        document.getElementById('modalComment').value = '';
        document.getElementById('feedbackModal').classList.remove('hidden');
    },

    closeFeedbackModal() {
        document.getElementById('feedbackModal').classList.add('hidden');
    },

    async submitFeedback(e) {
        if (e) e.preventDefault();
        const matchId = document.getElementById('modalMatchId').value;
        const rating = document.getElementById('modalRating').value;
        const comment = document.getElementById('modalComment').value.trim();

        try {
            await this.api('/api/feedback/submit', 'POST', {
                matchId: parseInt(matchId),
                reviewerId: this.currentUser.studentId,
                rating: parseInt(rating),
                comment: comment
            });
            this.showToast('Thank you! Your rating and feedback have been recorded.');
            this.closeFeedbackModal();
            this.loadMatches();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    // ── Profile ───────────────────────────────────────────────────
    async loadProfile() {
        if (!this.currentUser) return;
        document.getElementById('profStudentNumber').value = this.currentUser.studentNumber || '';
        document.getElementById('profEmail').value = this.currentUser.email || '';
        document.getElementById('profFullName').value = this.currentUser.fullName || '';
        document.getElementById('profDepartment').value = this.currentUser.department || '';
        document.getElementById('profYear').value = this.currentUser.yearOfStudy || 1;
        document.getElementById('profBio').value = this.currentUser.bio || '';

        try {
            const reviews = await this.api(`/api/feedback/student?studentId=${this.currentUser.studentId}`);
            const revBox = document.getElementById('myReceivedReviewsList');
            if (reviews.length === 0) {
                revBox.innerHTML = '<p class="empty-state">No reviews received from peers yet.</p>';
            } else {
                revBox.innerHTML = reviews.map(r => `
                    <div class="review-item">
                        <div class="review-rating">${r.ratingStars} (${r.rating}/5)</div>
                        <div class="review-comment">"${r.comment || 'Great exchange partner!'}"</div>
                        <div class="review-reviewer">From ${r.reviewerName} • ${r.createdAt ? r.createdAt.substring(0, 10) : ''}</div>
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error('Profile feedback load error:', err);
        }
    },

    async handleSaveProfile(e) {
        if (e) e.preventDefault();
        const fullName = document.getElementById('profFullName').value.trim();
        const department = document.getElementById('profDepartment').value.trim();
        const yearOfStudy = parseInt(document.getElementById('profYear').value);
        const bio = document.getElementById('profBio').value.trim();

        try {
            const res = await this.api('/api/profile/update', 'POST', {
                studentId: this.currentUser.studentId,
                fullName, department, yearOfStudy, bio
            });
            this.currentUser = res.student;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.setupLoggedInUI();
            this.showToast('Profile updated successfully!');
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    }
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * SHARED DATA DEFINITIONS (CATALOGUE & REALISTIC STARTER CAMPUS DATA)
 * ══════════════════════════════════════════════════════════════════════
 */
const SKILL_CATALOGUE = [
    { skillId: 1, skillName: 'Java', categoryId: 1, categoryName: 'Programming Languages' },
    { skillId: 2, skillName: 'Python', categoryId: 1, categoryName: 'Programming Languages' },
    { skillId: 3, skillName: 'C Programming', categoryId: 1, categoryName: 'Programming Languages' },
    { skillId: 4, skillName: 'C++', categoryId: 1, categoryName: 'Programming Languages' },
    { skillId: 5, skillName: 'JavaScript', categoryId: 1, categoryName: 'Programming Languages' },
    { skillId: 6, skillName: 'Kotlin', categoryId: 1, categoryName: 'Programming Languages' },
    { skillId: 7, skillName: 'Swift', categoryId: 1, categoryName: 'Programming Languages' },
    { skillId: 8, skillName: 'R Programming', categoryId: 1, categoryName: 'Programming Languages' },
    { skillId: 9, skillName: 'HTML & CSS', categoryId: 2, categoryName: 'Web Development' },
    { skillId: 10, skillName: 'React.js', categoryId: 2, categoryName: 'Web Development' },
    { skillId: 11, skillName: 'Node.js', categoryId: 2, categoryName: 'Web Development' },
    { skillId: 12, skillName: 'Spring Boot', categoryId: 2, categoryName: 'Web Development' },
    { skillId: 13, skillName: 'Django', categoryId: 2, categoryName: 'Web Development' },
    { skillId: 14, skillName: 'Machine Learning', categoryId: 3, categoryName: 'Data Science & ML' },
    { skillId: 15, skillName: 'Deep Learning', categoryId: 3, categoryName: 'Data Science & ML' },
    { skillId: 16, skillName: 'Data Analysis', categoryId: 3, categoryName: 'Data Science & ML' },
    { skillId: 17, skillName: 'NLP', categoryId: 3, categoryName: 'Data Science & ML' },
    { skillId: 18, skillName: 'Computer Vision', categoryId: 3, categoryName: 'Data Science & ML' },
    { skillId: 19, skillName: 'SQL', categoryId: 4, categoryName: 'Database' },
    { skillId: 20, skillName: 'MySQL', categoryId: 4, categoryName: 'Database' },
    { skillId: 21, skillName: 'MongoDB', categoryId: 4, categoryName: 'Database' },
    { skillId: 22, skillName: 'PostgreSQL', categoryId: 4, categoryName: 'Database' },
    { skillId: 23, skillName: 'Android (Java)', categoryId: 5, categoryName: 'Mobile Development' },
    { skillId: 24, skillName: 'Flutter', categoryId: 5, categoryName: 'Mobile Development' },
    { skillId: 25, skillName: 'React Native', categoryId: 5, categoryName: 'Mobile Development' },
    { skillId: 26, skillName: 'Git & GitHub', categoryId: 6, categoryName: 'DevOps & Cloud' },
    { skillId: 27, skillName: 'Docker', categoryId: 6, categoryName: 'DevOps & Cloud' },
    { skillId: 28, skillName: 'Linux', categoryId: 6, categoryName: 'DevOps & Cloud' },
    { skillId: 29, skillName: 'AWS', categoryId: 6, categoryName: 'DevOps & Cloud' },
    { skillId: 30, skillName: 'UI/UX Design', categoryId: 7, categoryName: 'Design & UX' }
];

const STARTER_STUDENTS = [
    { studentId: 1, studentNumber: 'CS2024001', fullName: 'Saketh Reddy', email: 'saketh.reddy@college.edu', password: 'password123', department: 'Computer Science', yearOfStudy: 3, bio: 'Passionate about backend development and databases. Looking to expand into Data Science.', offered: [1, 19, 20, 3, 26], wanted: [2, 14, 15, 13] },
    { studentId: 2, studentNumber: 'CS2024002', fullName: 'Priya Sharma', email: 'priya.sharma@college.edu', password: 'password123', department: 'Information Technology', yearOfStudy: 3, bio: 'Data Science enthusiast who loves Python and Machine Learning. Want to learn Java.', offered: [2, 14, 16, 15], wanted: [1, 19, 12, 9] },
    { studentId: 3, studentNumber: 'CS2024003', fullName: 'Arjun Mehta', email: 'arjun.mehta@college.edu', password: 'password123', department: 'Computer Science', yearOfStudy: 2, bio: 'Full-stack web developer. Excited about mobile apps and AI.', offered: [9, 10, 5, 11], wanted: [24, 2, 23] },
    { studentId: 4, studentNumber: 'CS2024004', fullName: 'Divya Nair', email: 'divya.nair@college.edu', password: 'password123', department: 'Computer Science', yearOfStudy: 3, bio: 'Mobile developer with Flutter expertise. Keen to learn web development.', offered: [24, 23, 6], wanted: [9, 10, 14] },
    { studentId: 5, studentNumber: 'CS2024005', fullName: 'Rahul Verma', email: 'rahul.verma@college.edu', password: 'password123', department: 'Information Technology', yearOfStudy: 4, bio: 'DevOps and cloud enthusiast. Love automating things.', offered: [28, 27, 26, 29], wanted: [2, 19] },
    { studentId: 6, studentNumber: 'CS2024006', fullName: 'Anjali Singh', email: 'anjali.singh@college.edu', password: 'password123', department: 'Computer Applications', yearOfStudy: 2, bio: 'Creative designer who codes. Looking to learn Python and Android.', offered: [30, 9, 5], wanted: [2, 23] }
];

const STARTER_REQUESTS = [
    { requestId: 101, senderId: 2, senderName: 'Priya Sharma', senderDept: 'Information Technology', receiverId: 1, receiverName: 'Saketh Reddy', receiverDept: 'Computer Science', message: 'Hey Saketh, saw you are strong in Java & SQL! I can teach Python/ML in exchange.', status: 'PENDING', createdAt: '2026-09-09' }
];

const STARTER_MATCHES = [
    {
        matchId: 201, requestId: 99, studentId1: 1, studentId2: 5, studentIds: [1, 5], matchScore: 85.0, isActive: true, matchedAt: '2026-09-08',
        student1: { studentId: 1, fullName: 'Saketh Reddy', department: 'Computer Science', email: 'saketh.reddy@college.edu' },
        student2: { studentId: 5, fullName: 'Rahul Verma', department: 'Information Technology', email: 'rahul.verma@college.edu' }
    }
];

const STARTER_FEEDBACK = [
    { feedbackId: 1, matchId: 201, reviewerId: 5, reviewerName: 'Rahul Verma', reviewedId: 1, rating: 5, ratingStars: '★★★★★', comment: 'Saketh helped me understand SQL joins and database indexes clearly!', createdAt: '2026-09-09' }
];

/**
 * ══════════════════════════════════════════════════════════════════════
 * GOOGLE CLOUD FIRESTORE BACKEND (PERMANENT REAL-TIME CLOUD STORAGE)
 * Synchronizes student accounts, skills, requests, matches & feedback
 * in real-time across all mobile phones, laptops, and web browsers.
 * ══════════════════════════════════════════════════════════════════════
 */
const FirestoreBackend = {
    db: null,
    initPromise: null,
    skills: SKILL_CATALOGUE,

    isAvailable() {
        return typeof firebase !== 'undefined' && typeof firebase.firestore === 'function';
    },

    normalizeStudent(s) {
        if (!s) return null;
        const sid = Number(s.studentId ?? s.id ?? 0);
        return {
            studentId: sid,
            id: sid,
            studentNumber: s.studentNumber || `STU${sid}`,
            fullName: s.fullName || s.name || 'Student',
            name: s.fullName || s.name || 'Student',
            email: (s.email || '').trim().toLowerCase(),
            password: s.password || '',
            department: s.department || s.dept || 'Engineering',
            dept: s.department || s.dept || 'Engineering',
            yearOfStudy: Number(s.yearOfStudy ?? s.year ?? 1),
            year: Number(s.yearOfStudy ?? s.year ?? 1),
            bio: s.bio || '',
            offered: Array.isArray(s.offered) ? s.offered : [],
            wanted: Array.isArray(s.wanted) ? s.wanted : []
        };
    },

    skillToId(item) {
        if (typeof item === 'number') return item;
        const s = this.skills.find(x => x.skillName.toLowerCase() === String(item).toLowerCase());
        return s ? s.skillId : null;
    },

    skillToObject(item) {
        if (typeof item === 'number') {
            const s = this.skills.find(x => x.skillId === item);
            if (s) return s;
        }
        const found = this.skills.find(x => x.skillName.toLowerCase() === String(item).toLowerCase());
        if (found) return found;
        return { skillId: typeof item === 'number' ? item : 999, skillName: String(item), categoryName: 'General' };
    },

    normalizeRequest(r) {
        if (!r) return null;
        const reqId = Number(r.requestId ?? r.id ?? Date.now());
        const senderId = Number(r.senderId ?? r.fromId ?? 0);
        const receiverId = Number(r.receiverId ?? r.toId ?? 0);
        return {
            requestId: reqId,
            id: reqId,
            senderId,
            fromId: senderId,
            senderName: r.senderName || '',
            senderDept: r.senderDept || '',
            receiverId,
            toId: receiverId,
            receiverName: r.receiverName || '',
            receiverDept: r.receiverDept || '',
            message: r.message || r.msg || '',
            msg: r.message || r.msg || '',
            status: r.status || 'PENDING',
            createdAt: r.createdAt || (r.timestamp ? new Date(Number(r.timestamp)).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10)),
            timestamp: r.timestamp || Date.now()
        };
    },

    async init() {
        if (this.db) return this.db;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            if (!this.isAvailable()) {
                throw new Error('Firebase SDK not loaded.');
            }

            const firebaseConfig = {
                apiKey: "AIzaSyCchbDm0Gghty4lIeYXWhKZs2LMwXCvcoU",
                authDomain: "peer-to-peer-interaction-7.firebaseapp.com",
                projectId: "peer-to-peer-interaction-7",
                storageBucket: "peer-to-peer-interaction-7.firebasestorage.app",
                messagingSenderId: "780710040418"
            };

            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }

            this.db = firebase.firestore();

            try {
                await this.db.enablePersistence({ synchronizeTabs: true });
            } catch (e) {}

            await this.ensureSeeded();
            return this.db;
        })();

        return this.initPromise;
    },

    async ensureSeeded() {
        try {
            const snap = await this.db.collection('students').limit(1).get();
            if (snap.empty) {
                const batch = this.db.batch();
                for (const s of STARTER_STUDENTS) {
                    batch.set(this.db.collection('students').doc(String(s.studentId)), s);
                }
                for (const r of STARTER_REQUESTS) {
                    batch.set(this.db.collection('requests').doc(String(r.requestId)), {
                        id: r.requestId,
                        requestId: r.requestId,
                        fromId: r.senderId,
                        senderId: r.senderId,
                        toId: r.receiverId,
                        receiverId: r.receiverId,
                        senderName: r.senderName,
                        receiverName: r.receiverName,
                        senderDept: r.senderDept,
                        receiverDept: r.receiverDept,
                        msg: r.message,
                        message: r.message,
                        status: r.status,
                        createdAt: r.createdAt,
                        timestamp: Date.now()
                    });
                }
                for (const m of STARTER_MATCHES) {
                    batch.set(this.db.collection('matches').doc(String(m.matchId)), m);
                }
                for (const f of STARTER_FEEDBACK) {
                    batch.set(this.db.collection('feedback').doc(String(f.feedbackId)), f);
                }
                await batch.commit();
                console.log('✅ Firestore automatically seeded with starter college community!');
            }
        } catch (err) {
            console.warn('Seed check notice:', err.message);
        }
    },

    async handle(endpoint, method = 'GET', data = null) {
        await this.init();
        const url = new URL(endpoint, 'http://dummy.local');
        const path = url.pathname;
        const params = Object.fromEntries(url.searchParams);

        if (path === '/api/skills/catalogue') {
            return this.skills;
        }

        if (path === '/api/auth/login') {
            const emailInput = (data.email || '').trim().toLowerCase();
            const snap = await this.db.collection('students')
                .where('email', '==', emailInput)
                .limit(1)
                .get();

            if (snap.empty) {
                throw new Error('No account found with this email address.');
            }
            const rawStu = snap.docs[0].data();
            const stu = this.normalizeStudent(rawStu);

            // Strict password check: Only allow login with the exact right password
            const expectedPassword = rawStu.password || 'password123';
            const enteredPassword = data.password || '';

            if (enteredPassword !== expectedPassword) {
                throw new Error('Incorrect password. Please enter the correct password.');
            }

            if (!rawStu.password) {
                this.db.collection('students').doc(String(stu.studentId)).update({ password: expectedPassword }).catch(() => {});
                stu.password = expectedPassword;
            }

            return { success: true, student: stu };
        }

        if (path === '/api/auth/register') {
            const emailInput = (data.email || '').trim().toLowerCase();
            const existingSnap = await this.db.collection('students')
                .where('email', '==', emailInput)
                .limit(1)
                .get();

            if (!existingSnap.empty) {
                throw new Error('Email already registered.');
            }

            const allSnap = await this.db.collection('students').get();
            let maxId = 0;
            allSnap.forEach(d => {
                const s = d.data();
                const sid = Number(s.studentId ?? s.id ?? 0);
                if (sid > maxId) maxId = sid;
            });
            const newId = maxId + 1;

            const stu = {
                id: newId,
                studentId: newId,
                studentNumber: data.studentNumber || `STU${newId}`,
                name: data.fullName,
                fullName: data.fullName,
                email: emailInput,
                password: data.password || '',
                dept: data.department || '',
                department: data.department || '',
                year: parseInt(data.yearOfStudy) || 1,
                yearOfStudy: parseInt(data.yearOfStudy) || 1,
                bio: data.bio || '',
                offered: [],
                wanted: [],
                createdAt: new Date().toISOString()
            };

            await this.db.collection('students').doc(String(newId)).set(stu);
            return { success: true, student: this.normalizeStudent(stu) };
        }

        if (path === '/api/dashboard') {
            const sid = parseInt(params.studentId);
            const stuDoc = await this.db.collection('students').doc(String(sid)).get();
            const stu = stuDoc.exists ? this.normalizeStudent(stuDoc.data()) : { offered: [], wanted: [] };
            const offCount = (stu.offered || []).length;
            const wanCount = (stu.wanted || []).length;

            const [m1, m2] = await Promise.all([
                this.db.collection('matches').where('studentId1', '==', sid).where('isActive', '==', true).get(),
                this.db.collection('matches').where('studentId2', '==', sid).where('isActive', '==', true).get()
            ]);
            const matchMap = new Map();
            m1.forEach(d => matchMap.set(d.id, d.data()));
            m2.forEach(d => matchMap.set(d.id, d.data()));

            const [reqSnapTo, reqSnapRecv] = await Promise.all([
                this.db.collection('requests').where('toId', '==', sid).where('status', '==', 'PENDING').get(),
                this.db.collection('requests').where('receiverId', '==', sid).where('status', '==', 'PENDING').get()
            ]);
            const pendingSet = new Set();
            reqSnapTo.forEach(d => pendingSet.add(d.id));
            reqSnapRecv.forEach(d => pendingSet.add(d.id));

            const fbSnap = await this.db.collection('feedback').where('reviewedId', '==', sid).get();
            let totalRating = 0;
            fbSnap.forEach(d => { totalRating += (d.data().rating || 0); });
            const avg = fbSnap.size > 0 ? (totalRating / fbSnap.size) : 0;

            return {
                offeredCount: offCount,
                wantedCount: wanCount,
                activeMatches: matchMap.size,
                pendingRequests: pendingSet.size,
                avgRating: avg
            };
        }

        if (path === '/api/skills/my') {
            const sid = parseInt(params.studentId);
            const stuDoc = await this.db.collection('students').doc(String(sid)).get();
            const stu = stuDoc.exists ? this.normalizeStudent(stuDoc.data()) : {};
            const offItems = stu.offered || [];
            const wanItems = stu.wanted || [];
            return {
                offered: offItems.map(item => this.skillToObject(item)).filter(Boolean),
                wanted: wanItems.map(item => this.skillToObject(item)).filter(Boolean)
            };
        }

        if (path === '/api/skills/offered/add') {
            const sid = data.studentId;
            const skid = data.skillId;
            const skillObj = this.skills.find(s => s.skillId === Number(skid));
            const skillName = skillObj ? skillObj.skillName : skid;
            await this.db.collection('students').doc(String(sid)).update({
                offered: firebase.firestore.FieldValue.arrayUnion(skillName)
            });
            return { success: true };
        }

        if (path === '/api/skills/offered/remove') {
            const sid = data.studentId;
            const skid = data.skillId;
            const skillObj = this.skills.find(s => s.skillId === Number(skid));
            const skillName = skillObj ? skillObj.skillName : skid;
            await this.db.collection('students').doc(String(sid)).update({
                offered: firebase.firestore.FieldValue.arrayRemove(skillName, skid, Number(skid))
            });
            return { success: true };
        }

        if (path === '/api/skills/wanted/add') {
            const sid = data.studentId;
            const skid = data.skillId;
            const skillObj = this.skills.find(s => s.skillId === Number(skid));
            const skillName = skillObj ? skillObj.skillName : skid;
            await this.db.collection('students').doc(String(sid)).update({
                wanted: firebase.firestore.FieldValue.arrayUnion(skillName)
            });
            return { success: true };
        }

        if (path === '/api/skills/wanted/remove') {
            const sid = data.studentId;
            const skid = data.skillId;
            const skillObj = this.skills.find(s => s.skillId === Number(skid));
            const skillName = skillObj ? skillObj.skillName : skid;
            await this.db.collection('students').doc(String(sid)).update({
                wanted: firebase.firestore.FieldValue.arrayRemove(skillName, skid, Number(skid))
            });
            return { success: true };
        }

        if (path === '/api/peers') {
            const sid = parseInt(params.studentId);
            const stuDoc = await this.db.collection('students').doc(String(sid)).get();
            const myData = stuDoc.exists ? this.normalizeStudent(stuDoc.data()) : { offered: [], wanted: [] };
            const myOfferedIds = (myData.offered || []).map(x => this.skillToId(x)).filter(Boolean);
            const myWantedIds = (myData.wanted || []).map(x => this.skillToId(x)).filter(Boolean);

            const allSnap = await this.db.collection('students').get();
            const results = [];

            allSnap.forEach(d => {
                const peer = this.normalizeStudent(d.data());
                if (peer.studentId === sid) return;

                const peerOfferedIds = (peer.offered || []).map(x => this.skillToId(x)).filter(Boolean);
                const peerWantedIds = (peer.wanted || []).map(x => this.skillToId(x)).filter(Boolean);

                const canTeachMeIds = peerOfferedIds.filter(id => myWantedIds.includes(id));
                const wantsFromMeIds = myOfferedIds.filter(id => peerWantedIds.includes(id));

                const fwd = peerWantedIds.length ? (wantsFromMeIds.length / peerWantedIds.length) : 0;
                const bwd = peerOfferedIds.length ? (canTeachMeIds.length / peerOfferedIds.length) : 0;
                const score = Math.round(((fwd + bwd) / 2) * 100);

                results.push({
                    peer,
                    score,
                    canTeachMe: canTeachMeIds.map(id => this.skillToObject(id)).filter(Boolean),
                    wantsFromMe: wantsFromMeIds.map(id => this.skillToObject(id)).filter(Boolean)
                });
            });

            results.sort((a, b) => b.score - a.score);
            return results;
        }

        if (path === '/api/peers/profile') {
            const pid = parseInt(params.peerId);
            const myId = parseInt(params.currentUserId);

            const [pDoc, myDoc, reqSnap, fbSnap] = await Promise.all([
                this.db.collection('students').doc(String(pid)).get(),
                this.db.collection('students').doc(String(myId)).get(),
                this.db.collection('requests')
                    .where('fromId', '==', myId)
                    .where('toId', '==', pid)
                    .where('status', '==', 'PENDING')
                    .get(),
                this.db.collection('feedback').where('reviewedId', '==', pid).get()
            ]);

            const peer = pDoc.exists ? this.normalizeStudent(pDoc.data()) : null;
            const myData = myDoc.exists ? this.normalizeStudent(myDoc.data()) : {};

            const myOfferedIds = (myData.offered || []).map(x => this.skillToId(x)).filter(Boolean);
            const myWantedIds = (myData.wanted || []).map(x => this.skillToId(x)).filter(Boolean);
            const peerOfferedIds = ((peer && peer.offered) || []).map(x => this.skillToId(x)).filter(Boolean);
            const peerWantedIds = ((peer && peer.wanted) || []).map(x => this.skillToId(x)).filter(Boolean);

            const canTeachMeIds = peerOfferedIds.filter(id => myWantedIds.includes(id));
            const wantsFromMeIds = myOfferedIds.filter(id => peerWantedIds.includes(id));
            const fwd = peerWantedIds.length ? (wantsFromMeIds.length / peerWantedIds.length) : 0;
            const bwd = peerOfferedIds.length ? (canTeachMeIds.length / peerOfferedIds.length) : 0;
            const score = Math.round(((fwd + bwd) / 2) * 100);

            let totalRating = 0;
            const reviews = [];
            fbSnap.forEach(d => {
                const data = d.data();
                reviews.push(data);
                totalRating += (data.rating || 0);
            });
            const avg = reviews.length ? (totalRating / reviews.length) : 0;

            return {
                peer,
                matchScore: score,
                avgRating: avg,
                hasExistingRequest: !reqSnap.empty,
                offeredSkills: (peer ? peer.offered : []).map(x => this.skillToObject(x)).filter(Boolean),
                wantedSkills: (peer ? peer.wanted : []).map(x => this.skillToObject(x)).filter(Boolean),
                reviews
            };
        }

        if (path === '/api/requests/incoming') {
            const sid = parseInt(params.studentId);
            const [snap1, snap2] = await Promise.all([
                this.db.collection('requests').where('toId', '==', sid).get(),
                this.db.collection('requests').where('receiverId', '==', sid).get()
            ]);
            const map = new Map();
            snap1.forEach(d => map.set(d.id, this.normalizeRequest(d.data())));
            snap2.forEach(d => map.set(d.id, this.normalizeRequest(d.data())));
            return Array.from(map.values());
        }

        if (path === '/api/requests/outgoing') {
            const sid = parseInt(params.studentId);
            const [snap1, snap2] = await Promise.all([
                this.db.collection('requests').where('fromId', '==', sid).get(),
                this.db.collection('requests').where('senderId', '==', sid).get()
            ]);
            const map = new Map();
            snap1.forEach(d => map.set(d.id, this.normalizeRequest(d.data())));
            snap2.forEach(d => map.set(d.id, this.normalizeRequest(d.data())));
            return Array.from(map.values());
        }

        if (path === '/api/requests/send') {
            const [senderDoc, receiverDoc] = await Promise.all([
                this.db.collection('students').doc(String(data.senderId)).get(),
                this.db.collection('students').doc(String(data.receiverId)).get()
            ]);
            const sData = senderDoc.exists ? this.normalizeStudent(senderDoc.data()) : {};
            const rData = receiverDoc.exists ? this.normalizeStudent(receiverDoc.data()) : {};

            const reqId = Date.now();
            const reqObj = {
                id: reqId,
                requestId: reqId,
                fromId: data.senderId,
                senderId: data.senderId,
                senderName: sData.fullName || 'Student',
                senderDept: sData.department || '',
                toId: data.receiverId,
                receiverId: data.receiverId,
                receiverName: rData.fullName || 'Student',
                receiverDept: rData.department || '',
                msg: data.message || '',
                message: data.message || '',
                status: 'PENDING',
                timestamp: Date.now(),
                createdAt: new Date().toISOString().substring(0, 10)
            };
            await this.db.collection('requests').doc(String(reqId)).set(reqObj);
            return { success: true };
        }

        if (path === '/api/requests/respond') {
            const reqRef = this.db.collection('requests').doc(String(data.requestId));
            const reqDoc = await reqRef.get();
            if (!reqDoc.exists) throw new Error('Request not found.');

            const req = this.normalizeRequest(reqDoc.data());
            const newStatus = (data.action === 'ACCEPT') ? 'ACCEPTED' : 'REJECTED';
            await reqRef.update({ status: newStatus });

            if (data.action === 'ACCEPT') {
                const [s1Doc, s2Doc] = await Promise.all([
                    this.db.collection('students').doc(String(req.senderId)).get(),
                    this.db.collection('students').doc(String(req.receiverId)).get()
                ]);
                const matchId = Date.now();
                const matchObj = {
                    matchId,
                    id: matchId,
                    requestId: req.requestId,
                    studentId1: req.senderId,
                    fromId: req.senderId,
                    studentId2: req.receiverId,
                    toId: req.receiverId,
                    studentIds: [req.senderId, req.receiverId],
                    matchScore: data.matchScore || 85.0,
                    isActive: true,
                    matchedAt: new Date().toISOString().substring(0, 10),
                    student1: s1Doc.exists ? this.normalizeStudent(s1Doc.data()) : { studentId: req.senderId },
                    student2: s2Doc.exists ? this.normalizeStudent(s2Doc.data()) : { studentId: req.receiverId }
                };
                await this.db.collection('matches').doc(String(matchId)).set(matchObj);
            }
            return { success: true };
        }

        if (path === '/api/matches') {
            const sid = parseInt(params.studentId);
            const [m1, m2, fbSnap] = await Promise.all([
                this.db.collection('matches').where('studentId1', '==', sid).where('isActive', '==', true).get(),
                this.db.collection('matches').where('studentId2', '==', sid).where('isActive', '==', true).get(),
                this.db.collection('feedback').where('reviewerId', '==', sid).get()
            ]);
            const matchMap = new Map();
            m1.forEach(d => matchMap.set(d.id, d.data()));
            m2.forEach(d => matchMap.set(d.id, d.data()));

            const reviewedMatchIds = new Set();
            fbSnap.forEach(d => reviewedMatchIds.add(d.data().matchId));

            const results = [];
            for (const m of matchMap.values()) {
                results.push({
                    match: m,
                    reviewed: reviewedMatchIds.has(m.matchId)
                });
            }
            return results;
        }

        if (path === '/api/feedback/submit') {
            const revDoc = await this.db.collection('students').doc(String(data.reviewerId)).get();
            const reviewer = revDoc.exists ? this.normalizeStudent(revDoc.data()) : {};

            let reviewedId = 0;
            const matchDoc = await this.db.collection('matches').doc(String(data.matchId)).get();
            if (matchDoc.exists) {
                const m = matchDoc.data();
                reviewedId = (m.studentId1 === data.reviewerId) ? m.studentId2 : m.studentId1;
            }

            const fid = Date.now();
            const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
            const fbObj = {
                feedbackId: fid,
                matchId: data.matchId,
                reviewerId: data.reviewerId,
                reviewerName: reviewer.fullName || 'Peer',
                reviewedId,
                rating: data.rating,
                ratingStars: stars,
                comment: data.comment || '',
                createdAt: new Date().toISOString().substring(0, 10)
            };
            await this.db.collection('feedback').doc(String(fid)).set(fbObj);
            return { success: true };
        }

        if (path === '/api/feedback/student') {
            const sid = parseInt(params.studentId);
            const snap = await this.db.collection('feedback').where('reviewedId', '==', sid).get();
            const list = [];
            snap.forEach(d => list.push(d.data()));
            return list;
        }

        if (path === '/api/profile/update') {
            const stuRef = this.db.collection('students').doc(String(data.studentId));
            await stuRef.update({
                name: data.fullName,
                fullName: data.fullName,
                dept: data.department,
                department: data.department,
                year: parseInt(data.yearOfStudy) || 1,
                yearOfStudy: parseInt(data.yearOfStudy) || 1,
                bio: data.bio || ''
            });
            const updated = await stuRef.get();
            return { success: true, student: this.normalizeStudent(updated.data()) };
        }

        return { success: true };
    }
};

/**
 * ══════════════════════════════════════════════════════════════════════
 * STANDALONE MOCK BACKEND FOR VS CODE LIVE SERVER (OFFLINE FALLBACK)
 * Automatically handles data & executes MatchingAlgorithm in-browser
 * when running directly from VS Code Live Server without Java or Firestore.
 * ══════════════════════════════════════════════════════════════════════
 */
const MockBackend = {
    skills: SKILL_CATALOGUE,

    getState() {
        let state = localStorage.getItem('mock_p2p_state');
        if (state) {
            try { return JSON.parse(state); } catch (e) {}
        }
        state = {
            students: JSON.parse(JSON.stringify(STARTER_STUDENTS)),
            offered: {
                1: [1, 19, 20, 3, 26], // Java, SQL, MySQL, C, Git
                2: [2, 14, 16, 15],     // Python, ML, Data Analysis, Deep Learning
                3: [9, 10, 5, 11],      // HTML/CSS, React, JS, Node
                4: [24, 23, 6],         // Flutter, Android, Kotlin
                5: [28, 27, 26, 29],    // Linux, Docker, Git, AWS
                6: [30, 9, 5]           // UI/UX, HTML/CSS, JS
            },
            wanted: {
                1: [2, 14, 15, 13],     // Python, ML, Deep Learning, Django
                2: [1, 19, 12, 9],      // Java, SQL, Spring Boot, HTML/CSS
                3: [24, 2, 23],         // Flutter, Python, Android
                4: [9, 10, 14],         // HTML/CSS, React, ML
                5: [2, 19],             // Python, SQL
                6: [2, 23]              // Python, Android
            },
            requests: JSON.parse(JSON.stringify(STARTER_REQUESTS)),
            matches: JSON.parse(JSON.stringify(STARTER_MATCHES)),
            feedback: JSON.parse(JSON.stringify(STARTER_FEEDBACK))
        };
        this.saveState(state);
        return state;
    },

    saveState(state) {
        localStorage.setItem('mock_p2p_state', JSON.stringify(state));
    },

    handle(endpoint, method = 'GET', data = null) {
        const state = this.getState();
        const url = new URL(endpoint, 'http://dummy.local');
        const path = url.pathname;
        const params = Object.fromEntries(url.searchParams);

        if (path === '/api/skills/catalogue') {
            return this.skills;
        }

        if (path === '/api/auth/login') {
            const stu = state.students.find(s => s.email.toLowerCase() === data.email.trim().toLowerCase());
            if (!stu) throw new Error('No account found with this email address.');
            const expectedPassword = stu.password || 'password123';
            const enteredPassword = data.password || '';
            if (enteredPassword !== expectedPassword) {
                throw new Error('Incorrect password. Please enter the correct password.');
            }
            return { success: true, student: stu };
        }

        if (path === '/api/auth/register') {
            const existing = state.students.find(s => s.email.toLowerCase() === data.email.trim().toLowerCase());
            if (existing) throw new Error('Email already registered.');
            const newId = state.students.length + 1;
            const stu = {
                studentId: newId,
                studentNumber: data.studentNumber,
                fullName: data.fullName,
                email: data.email.toLowerCase(),
                password: data.password || '',
                department: data.department,
                yearOfStudy: parseInt(data.yearOfStudy) || 1,
                bio: data.bio || ''
            };
            state.students.push(stu);
            state.offered[newId] = [];
            state.wanted[newId] = [];
            this.saveState(state);
            return { success: true, student: stu };
        }

        if (path === '/api/dashboard') {
            const sid = parseInt(params.studentId);
            const off = (state.offered[sid] || []).length;
            const wan = (state.wanted[sid] || []).length;
            const matches = state.matches.filter(m => (m.studentId1 === sid || m.studentId2 === sid) && m.isActive).length;
            const pending = state.requests.filter(r => r.receiverId === sid && r.status === 'PENDING').length;
            const reviews = state.feedback.filter(f => f.reviewedId === sid);
            const avg = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length) : 0;
            return { offeredCount: off, wantedCount: wan, activeMatches: matches, pendingRequests: pending, avgRating: avg };
        }

        if (path === '/api/skills/my') {
            const sid = parseInt(params.studentId);
            const offIds = state.offered[sid] || [];
            const wanIds = state.wanted[sid] || [];
            return {
                offered: offIds.map(id => this.skills.find(s => s.skillId === id)).filter(Boolean),
                wanted: wanIds.map(id => this.skills.find(s => s.skillId === id)).filter(Boolean)
            };
        }

        if (path === '/api/skills/offered/add') {
            const sid = data.studentId;
            const skid = data.skillId;
            if (!state.offered[sid]) state.offered[sid] = [];
            if (!state.offered[sid].includes(skid)) state.offered[sid].push(skid);
            this.saveState(state);
            return { success: true };
        }

        if (path === '/api/skills/offered/remove') {
            const sid = data.studentId;
            const skid = data.skillId;
            if (state.offered[sid]) state.offered[sid] = state.offered[sid].filter(id => id !== skid);
            this.saveState(state);
            return { success: true };
        }

        if (path === '/api/skills/wanted/add') {
            const sid = data.studentId;
            const skid = data.skillId;
            if (!state.wanted[sid]) state.wanted[sid] = [];
            if (!state.wanted[sid].includes(skid)) state.wanted[sid].push(skid);
            this.saveState(state);
            return { success: true };
        }

        if (path === '/api/skills/wanted/remove') {
            const sid = data.studentId;
            const skid = data.skillId;
            if (state.wanted[sid]) state.wanted[sid] = state.wanted[sid].filter(id => id !== skid);
            this.saveState(state);
            return { success: true };
        }

        if (path === '/api/peers') {
            const sid = parseInt(params.studentId);
            const myOffered = state.offered[sid] || [];
            const myWanted = state.wanted[sid] || [];
            const results = [];

            for (const peer of state.students) {
                if (peer.studentId === sid) continue;
                const peerOffered = state.offered[peer.studentId] || [];
                const peerWanted = state.wanted[peer.studentId] || [];

                const canTeachMeIds = peerOffered.filter(id => myWanted.includes(id));
                const wantsFromMeIds = myOffered.filter(id => peerWanted.includes(id));

                const fwd = peerWanted.length ? (wantsFromMeIds.length / peerWanted.length) : 0;
                const bwd = peerOffered.length ? (canTeachMeIds.length / peerOffered.length) : 0;
                const score = Math.round(((fwd + bwd) / 2) * 100);

                results.push({
                    peer,
                    score,
                    canTeachMe: canTeachMeIds.map(id => this.skills.find(s => s.skillId === id)).filter(Boolean),
                    wantsFromMe: wantsFromMeIds.map(id => this.skills.find(s => s.skillId === id)).filter(Boolean)
                });
            }
            results.sort((a, b) => b.score - a.score);
            return results;
        }

        if (path === '/api/peers/profile') {
            const pid = parseInt(params.peerId);
            const myId = parseInt(params.currentUserId);
            const peer = state.students.find(s => s.studentId === pid);
            const myOffered = state.offered[myId] || [];
            const myWanted = state.wanted[myId] || [];
            const peerOffered = state.offered[pid] || [];
            const peerWanted = state.wanted[pid] || [];

            const canTeachMeIds = peerOffered.filter(id => myWanted.includes(id));
            const wantsFromMeIds = myOffered.filter(id => peerWanted.includes(id));
            const fwd = peerWanted.length ? (wantsFromMeIds.length / peerWanted.length) : 0;
            const bwd = peerOffered.length ? (canTeachMeIds.length / peerOffered.length) : 0;
            const score = Math.round(((fwd + bwd) / 2) * 100);

            const reviews = state.feedback.filter(f => f.reviewedId === pid);
            const avg = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length) : 0;
            const hasExisting = state.requests.some(r => r.senderId === myId && r.receiverId === pid && r.status === 'PENDING');

            return {
                peer,
                matchScore: score,
                avgRating: avg,
                hasExistingRequest: hasExisting,
                offeredSkills: peerOffered.map(id => this.skills.find(s => s.skillId === id)).filter(Boolean),
                wantedSkills: peerWanted.map(id => this.skills.find(s => s.skillId === id)).filter(Boolean),
                reviews
            };
        }

        if (path === '/api/requests/incoming') {
            const sid = parseInt(params.studentId);
            return state.requests.filter(r => r.receiverId === sid);
        }

        if (path === '/api/requests/outgoing') {
            const sid = parseInt(params.studentId);
            return state.requests.filter(r => r.senderId === sid);
        }

        if (path === '/api/requests/send') {
            const req = {
                requestId: Date.now(),
                senderId: data.senderId,
                senderName: (state.students.find(s => s.studentId === data.senderId) || {}).fullName || 'Student',
                senderDept: (state.students.find(s => s.studentId === data.senderId) || {}).department || '',
                receiverId: data.receiverId,
                receiverName: (state.students.find(s => s.studentId === data.receiverId) || {}).fullName || 'Student',
                receiverDept: (state.students.find(s => s.studentId === data.receiverId) || {}).department || '',
                message: data.message,
                status: 'PENDING',
                createdAt: new Date().toISOString().substring(0, 10)
            };
            state.requests.push(req);
            this.saveState(state);
            return { success: true };
        }

        if (path === '/api/requests/respond') {
            const req = state.requests.find(r => r.requestId === data.requestId);
            if (req) {
                req.status = (data.action === 'ACCEPT') ? 'ACCEPTED' : 'REJECTED';
                if (data.action === 'ACCEPT') {
                    state.matches.push({
                        matchId: Date.now(),
                        requestId: req.requestId,
                        studentId1: req.senderId,
                        studentId2: req.receiverId,
                        matchScore: data.matchScore || 85.0,
                        isActive: true,
                        matchedAt: new Date().toISOString().substring(0, 10),
                        student1: state.students.find(s => s.studentId === req.senderId),
                        student2: state.students.find(s => s.studentId === req.receiverId)
                    });
                }
                this.saveState(state);
            }
            return { success: true };
        }

        if (path === '/api/matches') {
            const sid = parseInt(params.studentId);
            const myMatches = state.matches.filter(m => (m.studentId1 === sid || m.studentId2 === sid) && m.isActive);
            return myMatches.map(m => {
                const reviewed = state.feedback.some(f => f.matchId === m.matchId && f.reviewerId === sid);
                return { match: m, reviewed };
            });
        }

        if (path === '/api/feedback/submit') {
            const reviewer = state.students.find(s => s.studentId === data.reviewerId);
            const match = state.matches.find(m => m.matchId === data.matchId);
            const reviewedId = match ? (match.studentId1 === data.reviewerId ? match.studentId2 : match.studentId1) : 0;
            const stars = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);

            state.feedback.push({
                feedbackId: Date.now(),
                matchId: data.matchId,
                reviewerId: data.reviewerId,
                reviewerName: reviewer ? reviewer.fullName : 'Peer',
                reviewedId,
                rating: data.rating,
                ratingStars: stars,
                comment: data.comment,
                createdAt: new Date().toISOString().substring(0, 10)
            });
            this.saveState(state);
            return { success: true };
        }

        if (path === '/api/feedback/student') {
            const sid = parseInt(params.studentId);
            return state.feedback.filter(f => f.reviewedId === sid);
        }

        if (path === '/api/profile/update') {
            const stu = state.students.find(s => s.studentId === data.studentId);
            if (stu) {
                stu.fullName = data.fullName;
                stu.department = data.department;
                stu.yearOfStudy = data.yearOfStudy;
                stu.bio = data.bio;
                this.saveState(state);
            }
            return { success: true, student: stu };
        }

        return { success: true };
    }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());
