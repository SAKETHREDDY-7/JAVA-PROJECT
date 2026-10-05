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

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    escapeForJs(str) {
        if (!str) return '';
        return String(str)
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, ' ')
            .replace(/\r/g, '');
    },

    // ── View Switching ────────────────────────────────────────────
    showView(viewName) {
        if (this.activeChatMatchId) {
            this.closeChatModal();
        }

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
    activePeerId: null,
    activeProfileContext: null,

    async viewPeerProfile(peerId, context = null) {
        this.activePeerId = peerId;
        this.activeProfileContext = context;
        this.showView('peer-profile');

        const backBtn = document.getElementById('peerProfileBackBtn');
        if (context && context.fromProposal) {
            if (backBtn) backBtn.textContent = '← Back to Proposals';
        } else if (context && context.fromMatches) {
            if (backBtn) backBtn.textContent = '← Back to Matches';
        } else {
            if (backBtn) backBtn.textContent = '← Back to Peers';
        }

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

            // Check active match / request status
            const hasMatch = !!(data.hasActiveMatch || (context && context.status === 'ACCEPTED') ||
                (data.incomingRequest && data.incomingRequest.status === 'ACCEPTED') ||
                (data.outgoingRequest && data.outgoingRequest.status === 'ACCEPTED'));
            const hasCompletedMatch = !hasMatch && !!data.hasCompletedMatch;
            const activeMatchId = data.matchId || (context && context.matchId);

            const isIncomingPending = (context && context.fromProposal && context.status === 'PENDING') ||
                (!hasMatch && !hasCompletedMatch && data.incomingRequest && data.incomingRequest.status === 'PENDING');

            const isRejected = (context && context.status === 'REJECTED') ||
                (!hasMatch && !hasCompletedMatch && data.incomingRequest && data.incomingRequest.status === 'REJECTED');

            const banner = document.getElementById('peerProfileProposalBanner');
            const chipEl = document.getElementById('peerProfileBannerChip');
            const titleEl = document.getElementById('peerProfileProposalTitle');
            const msgEl = document.getElementById('peerProfileProposalMsg');
            const actionsEl = document.getElementById('peerProfileBannerActions');
            const formBox = document.getElementById('peerProposalFormBox') || document.getElementById('proposalBox');
            const notice = document.getElementById('proposalNotice');

            if (hasMatch) {
                // Confirmed active partnership - replace proposal actions with direct Chat, Feedback, & End Exchange
                if (banner) {
                    banner.className = 'proposal-action-banner banner-matched';
                    banner.style.background = '';
                    banner.style.border = '';
                    banner.classList.remove('hidden');
                    if (chipEl) {
                        chipEl.className = 'proposal-banner-chip chip-matched';
                        chipEl.style.background = '';
                        chipEl.style.color = '';
                        chipEl.textContent = '🤝 Active Study Partnership';
                    }
                    if (titleEl) {
                        titleEl.textContent = `Connected with ${p.fullName}`;
                    }
                    if (msgEl) {
                        msgEl.textContent = 'You and this peer are confirmed skill exchange partners! Coordinate study sessions in live chat.';
                    }
                    if (actionsEl) {
                        actionsEl.innerHTML = `
                            <button class="btn btn-primary" onclick="app.openChatWithPeer(${peerId}, '${this.escapeForJs(p.fullName)}', '${this.escapeForJs(p.department)}')">💬 Open Chat</button>
                            <button class="btn btn-accent" onclick="app.openFeedbackForPeer(${peerId}, ${activeMatchId || 0})">⭐ Leave Feedback</button>
                            <button class="btn btn-outline-danger" onclick="app.openCompleteExchangeModal(${activeMatchId || 0}, '${this.escapeForJs(p.fullName)}')">✓ End Exchange</button>
                        `;
                    }
                }
                if (formBox) formBox.classList.add('hidden');
            } else if (hasCompletedMatch) {
                // Confirmed completed exchange
                if (banner) {
                    banner.className = 'proposal-action-banner';
                    banner.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
                    banner.style.border = '1px solid #cbd5e1';
                    banner.classList.remove('hidden');
                    if (chipEl) {
                        chipEl.className = 'proposal-banner-chip';
                        chipEl.style.background = '#e2e8f0';
                        chipEl.style.color = '#334155';
                        chipEl.textContent = '✓ Skill Exchange Completed';
                    }
                    if (titleEl) {
                        titleEl.textContent = `Completed Collaboration with ${p.fullName}`;
                    }
                    if (msgEl) {
                        msgEl.textContent = 'This skill exchange has concluded. You can review past messages or leave feedback anytime.';
                    }
                    if (actionsEl) {
                        actionsEl.innerHTML = `
                            <button class="btn btn-primary" onclick="app.openChatWithPeer(${peerId}, '${this.escapeForJs(p.fullName)}', '${this.escapeForJs(p.department)}')">💬 Chat History</button>
                            <button class="btn btn-accent" onclick="app.openFeedbackForPeer(${peerId}, ${activeMatchId || 0})">⭐ Leave Feedback</button>
                        `;
                    }
                }
                if (formBox) formBox.classList.add('hidden');
            } else if (isIncomingPending) {
                // Pending incoming request awaiting response
                if (banner) {
                    banner.className = 'proposal-action-banner';
                    banner.style.background = '';
                    banner.style.border = '';
                    banner.classList.remove('hidden');
                    if (chipEl) {
                        chipEl.className = 'proposal-banner-chip';
                        chipEl.style.background = '';
                        chipEl.style.color = '';
                        chipEl.textContent = '📬 Pending Exchange Proposal';
                    }
                    if (titleEl) {
                        titleEl.textContent = `Exchange Proposal from ${p.fullName}`;
                    }
                    const note = (context && context.message) || (data.incomingRequest && data.incomingRequest.message) || '';
                    if (msgEl) {
                        msgEl.textContent = note ? `"${note}"` : 'Review their skills and past ratings above, then choose to accept or decline.';
                    }
                    const reqId = (context && context.requestId) || (data.incomingRequest && data.incomingRequest.requestId);
                    this.activeProfileContext = { fromProposal: true, requestId: reqId, peerId, message: note, status: 'PENDING' };
                    if (actionsEl) {
                        actionsEl.innerHTML = `
                            <button class="btn btn-primary" onclick="app.respondFromProfile('ACCEPT')">✓ Accept Match</button>
                            <button class="btn btn-danger" onclick="app.respondFromProfile('REJECT')">✕ Decline</button>
                        `;
                    }
                }
                if (formBox) formBox.classList.add('hidden');
            } else if (isRejected) {
                // Proposal was declined
                if (banner) {
                    banner.className = 'proposal-action-banner banner-rejected';
                    banner.style.background = '';
                    banner.style.border = '';
                    banner.classList.remove('hidden');
                    if (chipEl) {
                        chipEl.className = 'proposal-banner-chip chip-rejected';
                        chipEl.style.background = '';
                        chipEl.style.color = '';
                        chipEl.textContent = '✕ Proposal Declined';
                    }
                    if (titleEl) {
                        titleEl.textContent = 'Exchange Proposal Declined';
                    }
                    if (msgEl) {
                        msgEl.textContent = 'This skill exchange proposal has been declined.';
                    }
                    if (actionsEl) actionsEl.innerHTML = '';
                }
                if (formBox) formBox.classList.add('hidden');
            } else {
                // Standard profile browse
                if (banner) banner.classList.add('hidden');
                if (formBox) {
                    formBox.classList.remove('hidden');
                    const formInner = document.getElementById('proposalFormBox');
                    if (data.hasExistingRequest) {
                        if (formInner) formInner.classList.add('hidden');
                        if (notice) {
                            notice.classList.remove('hidden');
                            notice.textContent = (data.outgoingRequest && data.outgoingRequest.status === 'PENDING')
                                ? 'You have already sent an exchange proposal to this student. Waiting for their response.'
                                : 'An active exchange proposal already exists with this student.';
                        }
                    } else {
                        if (formInner) formInner.classList.remove('hidden');
                        if (notice) notice.classList.add('hidden');
                        const pMsg = document.getElementById('proposalMessage');
                        if (pMsg) pMsg.value = '';
                    }
                }
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

    navigateBackFromProfile() {
        if (this.activeProfileContext && this.activeProfileContext.fromProposal) {
            this.showView('requests');
        } else if (this.activeProfileContext && this.activeProfileContext.fromMatches) {
            this.showView('matches');
        } else {
            this.showView('peers');
        }
    },

    viewPeerProfileFromRequest(peerId, requestId, message, status = 'PENDING') {
        this.viewPeerProfile(peerId, { fromProposal: true, requestId, message, status });
    },

    async respondFromProfile(action) {
        if (!this.activeProfileContext || !this.activeProfileContext.requestId) return;
        const reqId = this.activeProfileContext.requestId;
        const peerId = this.activePeerId;
        await this.respondRequest(reqId, action);
        if (action === 'ACCEPT') {
            await this.viewPeerProfile(peerId, {
                fromProposal: true,
                requestId: reqId,
                status: 'ACCEPTED'
            });
        } else {
            this.showView('requests');
        }
    },

    async openChatWithPeer(peerId, peerName, peerDept) {
        try {
            const matches = await this.api(`/api/matches?studentId=${this.currentUser.studentId}`);
            const pid = Number(peerId);
            const found = (Array.isArray(matches) ? matches : []).find(item => {
                const m = item.match;
                if (!m) return false;
                const s1 = Number(m.studentId1 ?? (m.student1 ? m.student1.studentId : 0));
                const s2 = Number(m.studentId2 ?? (m.student2 ? m.student2.studentId : 0));
                return (s1 === pid || s2 === pid);
            });
            if (found && found.match && found.match.matchId) {
                this.openChatModal(found.match.matchId, peerName, peerDept);
            } else {
                this.showToast('Opening study partnerships...', 'info');
                await this.loadMatches();
                this.showView('matches');
            }
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    async openFeedbackForPeer(peerId, matchId) {
        if (matchId && Number(matchId) > 0) {
            this.openFeedbackModal(matchId);
            return;
        }
        try {
            const matches = await this.api(`/api/matches?studentId=${this.currentUser.studentId}`);
            const pid = Number(peerId);
            const found = (Array.isArray(matches) ? matches : []).find(item => {
                const m = item.match;
                if (!m) return false;
                const s1 = Number(m.studentId1 ?? 0);
                const s2 = Number(m.studentId2 ?? 0);
                return (s1 === pid || s2 === pid);
            });
            if (found && found.match && found.match.matchId) {
                this.openFeedbackModal(found.match.matchId);
            } else {
                this.showView('matches');
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
                            <h3>Proposal from <a href="javascript:void(0)" class="proposal-sender-link" onclick="app.viewPeerProfileFromRequest(${r.senderId}, ${r.requestId}, '${this.escapeForJs(r.message || '')}', '${r.status}')">${this.escapeHtml(r.senderName)}</a> (${this.escapeHtml(r.senderDept)})</h3>
                            <p class="text-muted" style="font-size:0.85rem">Received on: ${r.createdAt ? r.createdAt.substring(0, 10) : 'Recent'}</p>
                            ${r.message ? `<div class="request-card-msg">"${this.escapeHtml(r.message)}"</div>` : ''}
                        </div>
                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <button class="btn btn-secondary btn-sm" onclick="app.viewPeerProfileFromRequest(${r.senderId}, ${r.requestId}, '${this.escapeForJs(r.message || '')}', '${r.status}')">👁 View Profile</button>
                            ${r.status === 'PENDING' ? `
                                <button class="btn btn-primary btn-sm" onclick="app.respondRequest(${r.requestId}, 'ACCEPT')">✓ Accept Match</button>
                                <button class="btn btn-danger btn-sm" onclick="app.respondRequest(${r.requestId}, 'REJECT')">✕ Decline</button>
                            ` : r.status === 'ACCEPTED' ? `
                                <span class="badge badge-high">ACCEPTED</span>
                                <button class="btn btn-primary btn-sm" onclick="app.openChatWithPeer(${r.senderId}, '${this.escapeForJs(r.senderName)}', '${this.escapeForJs(r.senderDept)}')">💬 Chat</button>
                            ` : `<span class="badge badge-low">${r.status}</span>`}
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
                            <h3>Sent to <a href="javascript:void(0)" class="proposal-sender-link" onclick="app.viewPeerProfile(${r.receiverId})">${this.escapeHtml(r.receiverName)}</a> (${this.escapeHtml(r.receiverDept)})</h3>
                            <p class="text-muted" style="font-size:0.85rem">Sent on: ${r.createdAt ? r.createdAt.substring(0, 10) : 'Recent'}</p>
                            ${r.message ? `<div class="request-card-msg">"${r.message}"</div>` : ''}
                        </div>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <button class="btn btn-secondary btn-sm" onclick="app.viewPeerProfile(${r.receiverId})">👁 View Profile</button>
                            <span class="badge ${r.status === 'ACCEPTED' ? 'badge-high' : r.status === 'PENDING' ? 'badge-medium' : 'badge-low'}">${r.status}</span>
                            ${r.status === 'ACCEPTED' ? `
                                <button class="btn btn-primary btn-sm" onclick="app.openChatWithPeer(${r.receiverId}, '${this.escapeForJs(r.receiverName)}', '${this.escapeForJs(r.receiverDept)}')">💬 Chat</button>
                            ` : ''}
                        </div>
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
            await this.loadRequests();
            this.loadMatches();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    // ── My Matches ────────────────────────────────────────────────
    matchActiveTab: 'active',

    switchMatchTab(tab) {
        this.matchActiveTab = tab;
        const actBtn = document.getElementById('tabActiveMatchesBtn');
        const compBtn = document.getElementById('tabCompletedMatchesBtn');
        const actBox = document.getElementById('activeMatchesBox');
        const compBox = document.getElementById('completedMatchesBox');

        if (tab === 'active') {
            if (actBtn) actBtn.classList.add('active');
            if (compBtn) compBtn.classList.remove('active');
            if (actBox) actBox.classList.remove('hidden');
            if (compBox) compBox.classList.add('hidden');
        } else {
            if (actBtn) actBtn.classList.remove('active');
            if (compBtn) compBtn.classList.add('active');
            if (actBox) actBox.classList.add('hidden');
            if (compBox) compBox.classList.remove('hidden');
        }
    },

    async loadMatches() {
        if (!this.currentUser) return;
        const actListEl = document.getElementById('matchesList');
        const compListEl = document.getElementById('completedMatchesList');
        const actCountEl = document.getElementById('activeMatchesCount');
        const compCountEl = document.getElementById('completedMatchesCount');

        if (actListEl) actListEl.innerHTML = '<p class="empty-state">Loading partnerships...</p>';
        if (compListEl) compListEl.innerHTML = '<p class="empty-state">Loading completed exchanges...</p>';

        try {
            const data = await this.api(`/api/matches?studentId=${this.currentUser.studentId}`);
            const items = Array.isArray(data) ? data : [];

            const activeList = items.filter(item => {
                const m = item.match;
                if (!m) return false;
                return (m.isActive !== false && !m.isCompleted && m.status !== 'COMPLETED');
            });

            const completedList = items.filter(item => {
                const m = item.match;
                if (!m) return false;
                return (m.isActive === false || m.isCompleted || m.status === 'COMPLETED');
            });

            if (actCountEl) actCountEl.textContent = activeList.length;
            if (compCountEl) compCountEl.textContent = completedList.length;

            // Render active
            if (actListEl) {
                if (activeList.length === 0) {
                    actListEl.innerHTML = '<p class="empty-state">No active study partnerships yet. Accept an incoming request or find peers to begin!</p>';
                } else {
                    actListEl.innerHTML = activeList.map(item => this.renderMatchCard(item, true)).join('');
                }
            }

            // Render completed
            if (compListEl) {
                if (completedList.length === 0) {
                    compListEl.innerHTML = '<p class="empty-state">No completed skill exchanges yet.</p>';
                } else {
                    compListEl.innerHTML = completedList.map(item => this.renderMatchCard(item, false)).join('');
                }
            }

        } catch (err) {
            if (actListEl) actListEl.innerHTML = `<p class="empty-state">Error loading matches: ${err.message}</p>`;
            if (compListEl) compListEl.innerHTML = `<p class="empty-state">Error loading matches: ${err.message}</p>`;
        }
    },

    renderMatchCard(item, isActive) {
        const m = item.match;
        const myId = Number(this.currentUser.studentId || this.currentUser.id);
        const s1 = Number(m.studentId1 ?? (m.student1 ? m.student1.studentId : 0));
        const peer = (s1 === myId) ? (m.student2 || {}) : (m.student1 || {});
        const peerId = peer.studentId || peer.id || ((s1 === myId) ? m.studentId2 : m.studentId1);
        const score = Math.round(m.matchScore || 85);
        const peerName = peer.fullName || 'Partner';
        const peerDept = peer.department || '';
        const peerEmail = peer.email || '';

        return `
            <div class="match-card ${isActive ? '' : 'match-card-completed'}">
                <div>
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <h3>${isActive ? '🤝 Active Partner:' : '✓ Completed Partner:'} <a href="javascript:void(0)" class="proposal-sender-link" onclick="app.viewPeerProfile(${peerId}, { fromMatches: true })">${this.escapeHtml(peerName)}</a></h3>
                        ${isActive ? '' : '<span class="badge badge-low" style="background:#e2e8f0; color:#475569; font-weight:600;">✓ Completed</span>'}
                    </div>
                    <p class="text-muted" style="font-size:0.88rem">${this.escapeHtml(peerDept)}${peerEmail ? ` • Email: ${this.escapeHtml(peerEmail)}` : ''}</p>
                    <p class="text-muted" style="font-size:0.82rem; margin-top:4px;">
                        Matched: ${m.matchedAt ? m.matchedAt.substring(0, 10) : 'Active'}
                        ${m.completedAt ? ` • Finished: ${m.completedAt.substring(0, 10)}` : ''}
                    </p>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                    <span class="badge ${score >= 70 ? 'badge-high' : score >= 40 ? 'badge-medium' : 'badge-low'}">${score}% Match</span>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; align-items:center;">
                        <button class="btn btn-secondary btn-sm" onclick="app.viewPeerProfile(${peerId}, { fromMatches: true })">👁 Profile</button>
                        <button class="btn btn-primary btn-sm" onclick="app.openChatModal(${m.matchId}, '${this.escapeForJs(peerName)}', '${this.escapeForJs(peerDept)}')">
                            💬 ${isActive ? 'Chat' : 'Chat History'}
                        </button>
                        ${isActive ? `
                            <button class="btn btn-outline-danger btn-sm" onclick="app.openCompleteExchangeModal(${m.matchId}, '${this.escapeForJs(peerName)}')">
                                ✓ End Exchange
                            </button>
                        ` : ''}
                        ${item.reviewed ? `
                            <span class="badge badge-low">✓ Reviewed</span>
                        ` : `
                            <button class="btn btn-accent btn-sm" onclick="app.openFeedbackModal(${m.matchId})">⭐ Leave Feedback</button>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    // ── Conclude / Complete Exchange Modal ────────────────────────
    pendingCompleteMatchId: null,

    openCompleteExchangeModal(matchId, partnerName) {
        this.pendingCompleteMatchId = matchId;
        const textEl = document.getElementById('completeExchangeModalText');
        if (textEl) {
            textEl.innerHTML = `Are you ready to mark your skill exchange with <strong>${this.escapeHtml(partnerName || 'your peer')}</strong> as completed?`;
        }
        const modal = document.getElementById('completeExchangeModal');
        if (modal) modal.classList.remove('hidden');
    },

    closeCompleteExchangeModal() {
        this.pendingCompleteMatchId = null;
        const modal = document.getElementById('completeExchangeModal');
        if (modal) modal.classList.add('hidden');
    },

    async confirmCompleteExchange() {
        if (!this.pendingCompleteMatchId) return;
        const matchId = this.pendingCompleteMatchId;
        try {
            await this.api('/api/matches/complete', 'POST', {
                matchId: parseInt(matchId),
                currentUserId: this.currentUser.studentId
            });
            this.showToast('Skill exchange marked as completed! Partnership moved to Completed Exchanges.');
            this.closeCompleteExchangeModal();
            await this.loadMatches();
            await this.loadDashboard();
            if (this.activePeerId) {
                await this.viewPeerProfile(this.activePeerId, this.activeProfileContext);
            }
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    // ── Feedback Modal ────────────────────────────────────────────
    openFeedbackModal(matchId) {
        document.getElementById('modalMatchId').value = matchId;
        document.getElementById('modalComment').value = '';
        const chk = document.getElementById('modalCompleteExchange');
        if (chk) chk.checked = true;
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
        const markCompleted = document.getElementById('modalCompleteExchange')?.checked ?? false;

        try {
            await this.api('/api/feedback/submit', 'POST', {
                matchId: parseInt(matchId),
                reviewerId: this.currentUser.studentId,
                rating: parseInt(rating),
                comment: comment,
                markCompleted: !!markCompleted
            });
            this.showToast(markCompleted ? 'Feedback saved and skill exchange marked as completed!' : 'Thank you! Your rating and feedback have been recorded.');
            this.closeFeedbackModal();
            await this.loadMatches();
            await this.loadDashboard();
            if (this.activePeerId) {
                await this.viewPeerProfile(this.activePeerId, this.activeProfileContext);
            }
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    },

    // ── Chat Modal & Real-Time Messaging ──────────────────────────
    activeChatMatchId: null,
    chatPollInterval: null,
    unsubscribeChat: null,
    lastChatMessageCount: 0,

    openChatModal(matchId, partnerName, partnerDept) {
        this.activeChatMatchId = matchId;
        this.lastChatMessageCount = 0;

        const nameEl = document.getElementById('chatPartnerName');
        const subEl = document.getElementById('chatPartnerSubtitle');
        const avatarEl = document.getElementById('chatPartnerAvatar');
        const inputEl = document.getElementById('chatInputField');
        const feedEl = document.getElementById('chatMessageFeed');

        if (nameEl) nameEl.textContent = partnerName || 'Study Partner';
        if (subEl) subEl.textContent = partnerDept ? `${partnerDept} • Active Match` : 'Skill Exchange Partner';
        if (avatarEl) {
            const clean = (partnerName || 'SP').trim();
            const words = clean.split(/\s+/);
            const initials = (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
            avatarEl.textContent = initials || 'SP';
        }
        if (feedEl) {
            feedEl.innerHTML = '<div class="chat-empty-state"><p class="text-muted">Loading messages...</p></div>';
        }
        if (inputEl) {
            inputEl.value = '';
        }

        const modal = document.getElementById('chatModal');
        if (modal) modal.classList.remove('hidden');

        if (inputEl) setTimeout(() => inputEl.focus(), 150);

        // 1. Initial load
        this.loadChatMessages(matchId, false);

        // 2. Real-time Firestore subscription if in Firestore mode
        if (typeof FirestoreBackend !== 'undefined' && FirestoreBackend.isAvailable() && FirestoreBackend.db) {
            if (this.unsubscribeChat) {
                this.unsubscribeChat();
                this.unsubscribeChat = null;
            }
            try {
                this.unsubscribeChat = FirestoreBackend.db.collection('messages')
                    .where('matchId', '==', parseInt(matchId))
                    .onSnapshot(snap => {
                        if (this.activeChatMatchId !== matchId) return;
                        const msgs = [];
                        snap.forEach(d => msgs.push(d.data()));
                        msgs.sort((a, b) => (a.sentAt || '').localeCompare(b.sentAt || ''));
                        this.renderChatMessageList(msgs, true);
                    }, () => {});
            } catch (err) {
                console.warn('Firestore chat listener notice:', err);
            }
        }

        // 3. Polling fallback
        this.startChatPolling(matchId);
    },

    closeChatModal() {
        this.stopChatPolling();
        if (this.unsubscribeChat) {
            this.unsubscribeChat();
            this.unsubscribeChat = null;
        }
        const modal = document.getElementById('chatModal');
        if (modal) modal.classList.add('hidden');
        this.activeChatMatchId = null;
    },

    startChatPolling(matchId) {
        this.stopChatPolling();
        this.chatPollInterval = setInterval(() => {
            if (this.activeChatMatchId === matchId) {
                this.loadChatMessages(matchId, true);
            }
        }, 3000);
    },

    stopChatPolling() {
        if (this.chatPollInterval) {
            clearInterval(this.chatPollInterval);
            this.chatPollInterval = null;
        }
    },

    async loadChatMessages(matchId, isPoll = false) {
        if (!this.currentUser || !this.activeChatMatchId) return;
        const feedEl = document.getElementById('chatMessageFeed');
        if (!feedEl) return;

        try {
            const res = await this.api(`/api/chat/messages?matchId=${matchId}&studentId=${this.currentUser.studentId}`);
            const messages = Array.isArray(res) ? res : (res && Array.isArray(res.messages) ? res.messages : []);
            this.renderChatMessageList(messages, isPoll);
        } catch (err) {
            if (!isPoll) {
                feedEl.innerHTML = `<p class="empty-state">Error loading conversation: ${this.escapeHtml(err.message)}</p>`;
            }
        }
    },

    renderChatMessageList(messages, isUpdate = false) {
        const feedEl = document.getElementById('chatMessageFeed');
        if (!feedEl) return;

        const msgList = Array.isArray(messages) ? messages : [];

        // If polling/update and count hasn't changed, don't re-render DOM
        if (isUpdate && msgList.length === this.lastChatMessageCount) {
            return;
        }
        this.lastChatMessageCount = msgList.length;

        if (msgList.length === 0) {
            feedEl.innerHTML = `
                <div class="chat-empty-state">
                    <div class="chat-empty-icon">💬</div>
                    <h4>No messages yet</h4>
                    <p class="text-muted">Say hello to coordinate your skill exchange session!</p>
                </div>
            `;
            return;
        }

        const currentUserId = Number(this.currentUser.studentId || this.currentUser.id);
        const isNearBottom = (feedEl.scrollHeight - feedEl.scrollTop - feedEl.clientHeight) < 140;

        feedEl.innerHTML = msgList.map(msg => {
            const isMine = Number(msg.senderId) === currentUserId;
            const timeStr = this.formatChatTime(msg.sentAt);

            return `
                <div class="chat-bubble-wrapper ${isMine ? 'mine' : 'theirs'}">
                    ${!isMine ? `<span class="chat-bubble-sender">${this.escapeHtml(msg.senderName)}</span>` : ''}
                    <div class="chat-bubble ${isMine ? 'mine' : 'theirs'}">${this.escapeHtml(msg.content)}</div>
                    <span class="chat-bubble-time">${timeStr}</span>
                </div>
            `;
        }).join('');

        // Scroll down on first load or if already near bottom
        if (!isUpdate || isNearBottom) {
            feedEl.scrollTop = feedEl.scrollHeight;
        }
    },

    async handleSendChatMessage(e) {
        if (e) e.preventDefault();
        if (!this.currentUser || !this.activeChatMatchId) return;

        const inputEl = document.getElementById('chatInputField');
        const sendBtn = document.getElementById('chatSendBtn');
        const content = inputEl ? inputEl.value.trim() : '';

        if (!content) return;

        try {
            if (sendBtn) sendBtn.disabled = true;
            inputEl.value = '';

            await this.api('/api/chat/send', 'POST', {
                matchId: this.activeChatMatchId,
                senderId: this.currentUser.studentId,
                content: content
            });

            await this.loadChatMessages(this.activeChatMatchId, false);
            if (inputEl) inputEl.focus();

        } catch (err) {
            this.showToast(err.message, 'error');
            if (inputEl) inputEl.value = content;
        } finally {
            if (sendBtn) sendBtn.disabled = false;
        }
    },

    formatChatTime(dateTimeStr) {
        if (!dateTimeStr) return '';
        try {
            const date = new Date(dateTimeStr);
            if (isNaN(date.getTime())) return dateTimeStr.substring(11, 16);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
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

const STARTER_STUDENTS = [];
const STARTER_REQUESTS = [];
const STARTER_MATCHES = [];
const STARTER_FEEDBACK = [];

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
        // Sample accounts removed - start with clean database
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
                this.db.collection('matches').where('studentId1', '==', sid).get(),
                this.db.collection('matches').where('studentId2', '==', sid).get()
            ]);
            const matchMap = new Map();
            m1.forEach(d => matchMap.set(d.id, d.data()));
            m2.forEach(d => matchMap.set(d.id, d.data()));

            let activeCount = 0;
            matchMap.forEach(m => {
                if (m.isActive !== false && !m.isCompleted && m.status !== 'COMPLETED') {
                    activeCount++;
                }
            });

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
                activeMatches: activeCount,
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

            const [pDoc, myDoc, outSnap1, outSnap2, inSnap1, inSnap2, m1Snap, m2Snap, fbSnap] = await Promise.all([
                this.db.collection('students').doc(String(pid)).get(),
                this.db.collection('students').doc(String(myId)).get(),
                this.db.collection('requests').where('fromId', '==', myId).get(),
                this.db.collection('requests').where('senderId', '==', myId).get(),
                this.db.collection('requests').where('toId', '==', myId).get(),
                this.db.collection('requests').where('receiverId', '==', myId).get(),
                this.db.collection('matches').where('studentId1', '==', myId).get(),
                this.db.collection('matches').where('studentId2', '==', myId).get(),
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

            // Incoming requests from pid to myId
            const inMap = new Map();
            inSnap1.forEach(d => inMap.set(d.id, this.normalizeRequest(d.data())));
            inSnap2.forEach(d => inMap.set(d.id, this.normalizeRequest(d.data())));
            const incomingList = Array.from(inMap.values())
                .filter(r => r.senderId === pid)
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            const latestIncoming = incomingList[0] || null;

            // Outgoing requests from myId to pid
            const outMap = new Map();
            outSnap1.forEach(d => outMap.set(d.id, this.normalizeRequest(d.data())));
            outSnap2.forEach(d => outMap.set(d.id, this.normalizeRequest(d.data())));
            const outgoingList = Array.from(outMap.values())
                .filter(r => r.receiverId === pid)
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            const latestOutgoing = outgoingList[0] || null;

            // Check matches between myId and pid
            const matchMap = new Map();
            m1Snap.forEach(d => matchMap.set(d.id, d.data()));
            m2Snap.forEach(d => matchMap.set(d.id, d.data()));
            let activeMatch = null;
            let completedMatch = null;
            for (const m of matchMap.values()) {
                const s1 = Number(m.studentId1 ?? m.fromId ?? 0);
                const s2 = Number(m.studentId2 ?? m.toId ?? 0);
                const hasIdsArray = Array.isArray(m.studentIds) && m.studentIds.map(Number).includes(myId) && m.studentIds.map(Number).includes(pid);
                if ((s1 === myId && s2 === pid) || (s1 === pid && s2 === myId) || hasIdsArray) {
                    if (m.isActive !== false && !m.isCompleted && m.status !== 'COMPLETED') {
                        activeMatch = m;
                        break;
                    } else {
                        completedMatch = m;
                    }
                }
            }

            const hasAccepted = (latestIncoming && latestIncoming.status === 'ACCEPTED') || (latestOutgoing && latestOutgoing.status === 'ACCEPTED');
            const hasActiveMatch = !!activeMatch || (hasAccepted && !completedMatch);
            const hasCompletedMatch = !hasActiveMatch && !!completedMatch;
            const matchId = activeMatch ? Number(activeMatch.matchId || activeMatch.id) : (completedMatch ? Number(completedMatch.matchId || completedMatch.id) : null);
            const hasExistingRequest = hasActiveMatch || hasCompletedMatch ||
                (latestOutgoing && latestOutgoing.status === 'PENDING') ||
                (latestIncoming && latestIncoming.status === 'PENDING');

            return {
                peer,
                matchScore: score,
                avgRating: avg,
                hasActiveMatch,
                hasCompletedMatch,
                matchId,
                incomingRequest: latestIncoming ? { requestId: latestIncoming.requestId, status: latestIncoming.status, message: latestIncoming.message } : null,
                outgoingRequest: latestOutgoing ? { requestId: latestOutgoing.requestId, status: latestOutgoing.status, message: latestOutgoing.message } : null,
                hasExistingRequest,
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

        if (path === '/api/matches/complete') {
            const mid = parseInt(data.matchId);
            const matchRef = this.db.collection('matches').doc(String(mid));
            const matchDoc = await matchRef.get();
            if (!matchDoc.exists) throw new Error('Match not found.');
            await matchRef.update({
                isActive: false,
                isCompleted: true,
                status: 'COMPLETED',
                completedAt: new Date().toISOString().substring(0, 10),
                completedBy: data.currentUserId || 0
            });
            return { success: true };
        }

        if (path === '/api/matches') {
            const sid = parseInt(params.studentId);
            const [m1, m2, fbSnap] = await Promise.all([
                this.db.collection('matches').where('studentId1', '==', sid).get(),
                this.db.collection('matches').where('studentId2', '==', sid).get(),
                this.db.collection('feedback').where('reviewerId', '==', sid).get()
            ]);
            const matchMap = new Map();
            m1.forEach(d => matchMap.set(d.id, d.data()));
            m2.forEach(d => matchMap.set(d.id, d.data()));

            const reviewedMatchIds = new Set();
            fbSnap.forEach(d => reviewedMatchIds.add(d.data().matchId));

            const results = [];
            for (const m of matchMap.values()) {
                const isActive = (m.isActive !== false && !m.isCompleted && m.status !== 'COMPLETED');
                m.isActive = isActive;
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
            const matchRef = this.db.collection('matches').doc(String(data.matchId));
            const matchDoc = await matchRef.get();
            if (matchDoc.exists) {
                const m = matchDoc.data();
                reviewedId = (m.studentId1 === data.reviewerId) ? m.studentId2 : m.studentId1;
                if (data.markCompleted) {
                    await matchRef.update({
                        isActive: false,
                        isCompleted: true,
                        status: 'COMPLETED',
                        completedAt: new Date().toISOString().substring(0, 10),
                        completedBy: data.reviewerId || 0
                    });
                }
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

        if (path === '/api/chat/messages') {
            const mid = parseInt(params.matchId);
            const snap = await this.db.collection('messages')
                .where('matchId', '==', mid)
                .get();
            const list = [];
            snap.forEach(d => list.push(d.data()));
            list.sort((a, b) => (a.sentAt || '').localeCompare(b.sentAt || ''));
            return list;
        }

        if (path === '/api/chat/send') {
            const sid = Number(data.senderId);
            const senderDoc = await this.db.collection('students').doc(String(sid)).get();
            const sender = senderDoc.exists ? this.normalizeStudent(senderDoc.data()) : {};
            const msgId = Date.now();
            const msgObj = {
                messageId: msgId,
                matchId: parseInt(data.matchId),
                senderId: sid,
                senderName: sender.fullName || 'Student',
                content: data.content,
                sentAt: new Date().toISOString(),
                isRead: false
            };
            await this.db.collection('messages').doc(String(msgId)).set(msgObj);
            return { success: true, message: msgObj };
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
            try {
                const parsed = JSON.parse(state);
                if (parsed.students && parsed.students.some(s => s.studentNumber && s.studentNumber.startsWith('CS202400'))) {
                    localStorage.removeItem('mock_p2p_state');
                    state = null;
                } else {
                    return parsed;
                }
            } catch (e) {}
        }
        state = {
            students: [],
            offered: {},
            wanted: {},
            requests: [],
            matches: [],
            feedback: []
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
            const matches = state.matches.filter(m => (m.studentId1 === sid || m.studentId2 === sid) && m.isActive !== false && !m.isCompleted && m.status !== 'COMPLETED').length;
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

            const activeMatch = state.matches.find(m =>
                ((m.studentId1 === myId && m.studentId2 === pid) || (m.studentId1 === pid && m.studentId2 === myId)) &&
                m.isActive !== false && !m.isCompleted && m.status !== 'COMPLETED'
            );
            const completedMatch = state.matches.find(m =>
                ((m.studentId1 === myId && m.studentId2 === pid) || (m.studentId1 === pid && m.studentId2 === myId)) &&
                (m.isActive === false || m.isCompleted || m.status === 'COMPLETED')
            );
            const inReqs = state.requests.filter(r => r.senderId === pid && r.receiverId === myId).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            const outReqs = state.requests.filter(r => r.senderId === myId && r.receiverId === pid).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            const latestIn = inReqs[0] || null;
            const latestOut = outReqs[0] || null;

            const hasAccepted = (latestIn && latestIn.status === 'ACCEPTED') || (latestOut && latestOut.status === 'ACCEPTED');
            const hasActiveMatch = !!activeMatch || (hasAccepted && !completedMatch);
            const hasCompletedMatch = !hasActiveMatch && !!completedMatch;
            const matchId = activeMatch ? activeMatch.matchId : (completedMatch ? completedMatch.matchId : null);
            const hasExisting = hasActiveMatch || hasCompletedMatch || (latestOut && latestOut.status === 'PENDING') || (latestIn && latestIn.status === 'PENDING');

            return {
                peer,
                matchScore: score,
                avgRating: avg,
                hasActiveMatch,
                hasCompletedMatch,
                matchId,
                incomingRequest: latestIn ? { requestId: latestIn.requestId, status: latestIn.status, message: latestIn.message } : null,
                outgoingRequest: latestOut ? { requestId: latestOut.requestId, status: latestOut.status, message: latestOut.message } : null,
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

        if (path === '/api/matches/complete') {
            const mid = parseInt(data.matchId);
            const m = state.matches.find(item => item.matchId === mid);
            if (m) {
                m.isActive = false;
                m.isCompleted = true;
                m.status = 'COMPLETED';
                m.completedAt = new Date().toISOString().substring(0, 10);
                this.saveState(state);
            }
            return { success: true };
        }

        if (path === '/api/matches') {
            const sid = parseInt(params.studentId);
            const myMatches = state.matches.filter(m => (m.studentId1 === sid || m.studentId2 === sid));
            return myMatches.map(m => {
                const isActive = (m.isActive !== false && !m.isCompleted && m.status !== 'COMPLETED');
                m.isActive = isActive;
                const reviewed = state.feedback.some(f => f.matchId === m.matchId && f.reviewerId === sid);
                return { match: m, reviewed };
            });
        }

        if (path === '/api/feedback/submit') {
            const reviewer = state.students.find(s => s.studentId === data.reviewerId);
            const match = state.matches.find(m => m.matchId === data.matchId);
            const reviewedId = match ? (match.studentId1 === data.reviewerId ? match.studentId2 : match.studentId1) : 0;
            if (match && data.markCompleted) {
                match.isActive = false;
                match.isCompleted = true;
                match.status = 'COMPLETED';
                match.completedAt = new Date().toISOString().substring(0, 10);
            }
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

        if (path === '/api/chat/messages') {
            const mid = parseInt(params.matchId);
            if (!state.messages) state.messages = [];
            return state.messages
                .filter(m => Number(m.matchId) === mid)
                .sort((a, b) => (a.sentAt || '').localeCompare(b.sentAt || ''));
        }

        if (path === '/api/chat/send') {
            if (!state.messages) state.messages = [];
            const sid = Number(data.senderId);
            const sender = state.students.find(s => Number(s.studentId) === sid);
            const msgObj = {
                messageId: Date.now(),
                matchId: parseInt(data.matchId),
                senderId: sid,
                senderName: sender ? sender.fullName : 'Student',
                content: data.content,
                sentAt: new Date().toISOString(),
                isRead: false
            };
            state.messages.push(msgObj);
            this.saveState(state);
            return { success: true, message: msgObj };
        }

        return { success: true };
    }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => app.init());
