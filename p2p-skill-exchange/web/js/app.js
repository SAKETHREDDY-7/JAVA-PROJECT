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
        const nav = document.getElementById('navbar');
        if (nav) nav.classList.remove('hidden');
        const navName = document.getElementById('navUserName');
        if (navName) navName.textContent = this.currentUser.fullName || 'Student';
    },

    getApiBase() {
        if (window.location.port === '8080') {
            return '';
        }
        return 'http://localhost:8080';
    },

    // ── Networking: Java HTTP Backend (with LocalStorage Fallback) ──
    async api(endpoint, method = 'GET', data = null) {
        // 1. Try connecting to the Java HttpServer (port 8080)
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
                return json;
            }
        } catch (err) {
            // Java server offline or aborted — fallback to local in-browser storage
        }

        // 2. Standalone In-Browser Local Storage Fallback
        return LocalDataStore.handle(endpoint, method, data);
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
            const modalSel = document.getElementById('newDataSkillSelect');
            const catFilter = document.getElementById('storageCategoryFilter');

            let opts = '<option value="">-- Choose skill --</option>';
            let modalOpts = '<option value="">-- Select from Catalogue or Choose Custom --</option>';
            const categories = new Set();

            if (this.catalogue && Array.isArray(this.catalogue)) {
                this.catalogue.forEach(s => {
                    opts += `<option value="${s.skillId}">${s.skillName} (${s.categoryName})</option>`;
                    modalOpts += `<option value="${s.skillId}" data-cat="${s.categoryName}">${s.skillName} — ${s.categoryName}</option>`;
                    if (s.categoryName) categories.add(s.categoryName);
                });
            }
            modalOpts += '<option value="CUSTOM">➕ Other / Custom Skill (Type your own)...</option>';

            if (offSel) offSel.innerHTML = opts;
            if (wanSel) wanSel.innerHTML = opts;
            if (modalSel) modalSel.innerHTML = modalOpts;

            if (catFilter) {
                let catOpts = '<option value="ALL">All Categories</option>';
                categories.forEach(c => {
                    catOpts += `<option value="${c}">${c}</option>`;
                });
                catFilter.innerHTML = catOpts;
            }
        } catch (err) {
            console.error('Error loading catalogue:', err);
        }
    },

    // ── Dashboard & Data Storage ───────────────────────────────────
    storedRecordsCache: [],

    async loadDashboard() {
        if (!this.currentUser) return;
        const greeting = document.getElementById('dashGreeting');
        const subtitle = document.getElementById('dashSubtitle');
        if (greeting) greeting.textContent = `Welcome, ${this.currentUser.fullName}!`;
        if (subtitle) {
            const dept = this.currentUser.department || this.currentUser.dept || 'Engineering';
            const year = this.currentUser.yearOfStudy || this.currentUser.year || 1;
            const roll = this.currentUser.studentNumber || '';
            subtitle.textContent = `${dept} • Year ${year}${roll ? ' • ID: ' + roll : ''}`;
        }

        try {
            await this.loadStoredDataRecords();
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    },

    async loadStoredDataRecords() {
        if (!this.currentUser) return;
        try {
            const sid = this.currentUser.studentId || this.currentUser.id;
            const data = await this.api(`/api/skills/my?studentId=${sid}`);
            const offered = data.offered || [];
            const wanted = data.wanted || [];

            // Retrieve local metadata (e.g. proficiency, notes, dateAdded)
            const metaKey = `record_meta_${sid}`;
            let meta = {};
            try {
                meta = JSON.parse(localStorage.getItem(metaKey) || '{}');
            } catch (e) {}

            const records = [];
            offered.forEach(s => {
                const key = `OFFERED_${s.skillId}`;
                const m = meta[key] || {};
                records.push({
                    skillId: s.skillId,
                    name: s.skillName,
                    category: s.categoryName || 'General',
                    type: 'OFFERED',
                    proficiency: m.proficiency || 'Intermediate',
                    notes: m.notes || '',
                    dateStored: m.dateStored || 'Active'
                });
            });

            wanted.forEach(s => {
                const key = `WANTED_${s.skillId}`;
                const m = meta[key] || {};
                records.push({
                    skillId: s.skillId,
                    name: s.skillName,
                    category: s.categoryName || 'General',
                    type: 'WANTED',
                    proficiency: m.proficiency || 'To Learn',
                    notes: m.notes || '',
                    dateStored: m.dateStored || 'Active'
                });
            });

            this.storedRecordsCache = records;

            // Update Metric Cards
            const statTotal = document.getElementById('statTotalRecords');
            const statOff = document.getElementById('statOffered');
            const statWan = document.getElementById('statWanted');

            if (statTotal) statTotal.textContent = records.length;
            if (statOff) statOff.textContent = offered.length;
            if (statWan) statWan.textContent = wanted.length;

            this.renderStoredDataTable();
        } catch (err) {
            console.error('Error loading stored records:', err);
            this.renderStoredDataTable();
        }
    },

    renderStoredDataTable() {
        const tbody = document.getElementById('storedDataBody');
        const emptyState = document.getElementById('storageEmptyState');
        const table = document.getElementById('storedDataTable');
        if (!tbody) return;

        const searchInput = document.getElementById('storageSearchInput');
        const typeFilter = document.getElementById('storageTypeFilter');
        const catFilter = document.getElementById('storageCategoryFilter');

        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedType = typeFilter ? typeFilter.value : 'ALL';
        const selectedCat = catFilter ? catFilter.value : 'ALL';

        const filtered = this.storedRecordsCache.filter(r => {
            if (selectedType !== 'ALL' && r.type !== selectedType) return false;
            if (selectedCat !== 'ALL' && r.category !== selectedCat) return false;
            if (query) {
                const nameMatch = r.name.toLowerCase().includes(query);
                const catMatch = r.category.toLowerCase().includes(query);
                const typeMatch = (r.type === 'OFFERED' ? 'teach can teach' : 'learn want to learn').includes(query);
                const notesMatch = (r.notes || '').toLowerCase().includes(query);
                return nameMatch || catMatch || typeMatch || notesMatch;
            }
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            if (table) table.classList.add('hidden');
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (table) table.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');

        tbody.innerHTML = filtered.map((r, idx) => {
            const isOffered = r.type === 'OFFERED';
            const typeBadge = isOffered
                ? `<span class="badge-teach">⚡ Can Teach</span>`
                : `<span class="badge-learn">🎯 Want to Learn</span>`;
            const safeName = this.escapeHtml(r.name);
            return `
                <tr>
                    <td><strong>${idx + 1}</strong></td>
                    <td><strong>${safeName}</strong></td>
                    <td><span class="badge-cat">${this.escapeHtml(r.category)}</span></td>
                    <td>${typeBadge}</td>
                    <td><span class="badge-level">${this.escapeHtml(r.proficiency)}</span></td>
                    <td style="color: var(--text-muted); font-size: 0.82rem;">${this.escapeHtml(r.dateStored)}</td>
                    <td style="text-align: center;">
                        <button class="btn-delete-record" onclick="app.handleDeleteStoredRecord(${r.skillId}, '${r.type}', '${safeName}')" title="Delete from storage">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    filterStoredData(forcedType = null) {
        if (forcedType) {
            const typeFilter = document.getElementById('storageTypeFilter');
            if (typeFilter) typeFilter.value = forcedType;
        }
        this.renderStoredDataTable();
    },

    // ── Modal: Add / Store New Data ────────────────────────────────
    openAddDataModal() {
        const modal = document.getElementById('addDataModal');
        if (!modal) return;
        modal.classList.remove('hidden');

        // Reset form inputs
        const skillSel = document.getElementById('newDataSkillSelect');
        const customTitle = document.getElementById('newDataCustomTitle');
        const customGroup = document.getElementById('customSkillGroup');
        const notes = document.getElementById('newDataNotes');

        if (skillSel) skillSel.value = '';
        if (customTitle) customTitle.value = '';
        if (customGroup) customGroup.classList.add('hidden');
        if (notes) notes.value = '';
    },

    closeAddDataModal() {
        const modal = document.getElementById('addDataModal');
        if (modal) modal.classList.add('hidden');
    },

    handleSkillSelectChange(val) {
        const customGroup = document.getElementById('customSkillGroup');
        const customTitle = document.getElementById('newDataCustomTitle');
        const catSelect = document.getElementById('newDataCategory');

        if (val === 'CUSTOM') {
            if (customGroup) customGroup.classList.remove('hidden');
            if (customTitle) customTitle.required = true;
        } else {
            if (customGroup) customGroup.classList.add('hidden');
            if (customTitle) customTitle.required = false;

            // Auto-fill category if selected from catalogue
            if (val && this.catalogue) {
                const s = this.catalogue.find(x => String(x.skillId) === String(val));
                if (s && catSelect) {
                    for (let opt of catSelect.options) {
                        if (opt.value.toLowerCase().includes(s.categoryName.toLowerCase()) ||
                            s.categoryName.toLowerCase().includes(opt.value.toLowerCase())) {
                            catSelect.value = opt.value;
                            break;
                        }
                    }
                }
            }
        }
    },

    async handleSaveDataRecord(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!this.currentUser) return;

        const skillSel = document.getElementById('newDataSkillSelect');
        const customTitle = document.getElementById('newDataCustomTitle');
        const category = document.getElementById('newDataCategory').value;
        const type = document.getElementById('newDataType').value;
        const proficiency = document.getElementById('newDataProficiency').value;
        const notes = document.getElementById('newDataNotes').value.trim();

        let skillId = null;
        let skillName = '';

        if (skillSel.value === 'CUSTOM') {
            skillName = customTitle.value.trim();
            if (!skillName) {
                this.showToast('Please enter a custom skill title', 'error');
                return;
            }
            const existing = (this.catalogue || []).find(x => x.skillName.toLowerCase() === skillName.toLowerCase());
            if (existing) {
                skillId = existing.skillId;
            } else {
                skillId = Math.abs(this.hashCode(skillName)) % 9000 + 1000;
                if (!this.catalogue) this.catalogue = [];
                this.catalogue.push({
                    skillId,
                    skillName,
                    categoryName: category
                });
            }
        } else {
            skillId = parseInt(skillSel.value);
            const found = (this.catalogue || []).find(x => x.skillId === skillId);
            skillName = found ? found.skillName : `Skill #${skillId}`;
        }

        const endpoint = type === 'OFFERED' ? '/api/skills/offered/add' : '/api/skills/wanted/add';
        const sid = this.currentUser.studentId || this.currentUser.id;

        try {
            await this.api(endpoint, 'POST', {
                studentId: sid,
                skillId: skillId
            });

            // Save extra metadata into persistent localStorage
            const metaKey = `record_meta_${sid}`;
            let meta = {};
            try { meta = JSON.parse(localStorage.getItem(metaKey) || '{}'); } catch (err) {}
            meta[`${type}_${skillId}`] = {
                proficiency,
                notes,
                dateStored: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
            localStorage.setItem(metaKey, JSON.stringify(meta));

            this.closeAddDataModal();
            this.showToast(`"${skillName}" stored successfully!`, 'success');
            await this.loadStoredDataRecords();
        } catch (err) {
            this.showToast(err.message || 'Error saving data record', 'error');
        }
    },

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    },

    async handleDeleteStoredRecord(skillId, type, skillName) {
        if (!this.currentUser) return;
        if (!confirm(`Are you sure you want to remove "${skillName}" from your stored records?`)) {
            return;
        }

        const endpoint = type === 'OFFERED' ? '/api/skills/offered/remove' : '/api/skills/wanted/remove';
        const sid = this.currentUser.studentId || this.currentUser.id;

        try {
            await this.api(endpoint, 'POST', {
                studentId: sid,
                skillId: parseInt(skillId)
            });

            // Clean metadata
            const metaKey = `record_meta_${sid}`;
            try {
                let meta = JSON.parse(localStorage.getItem(metaKey) || '{}');
                delete meta[`${type}_${skillId}`];
                localStorage.setItem(metaKey, JSON.stringify(meta));
            } catch (err) {}

            this.showToast(`"${skillName}" removed from storage.`, 'success');
            await this.loadStoredDataRecords();
        } catch (err) {
            this.showToast(err.message || 'Error deleting record', 'error');
        }
    },

    exportStoredData() {
        if (!this.currentUser) return;
        const payload = {
            student: {
                studentNumber: this.currentUser.studentNumber,
                fullName: this.currentUser.fullName,
                email: this.currentUser.email,
                department: this.currentUser.department || this.currentUser.dept,
                yearOfStudy: this.currentUser.yearOfStudy || this.currentUser.year
            },
            exportDate: new Date().toISOString(),
            totalStoredRecords: this.storedRecordsCache.length,
            records: this.storedRecordsCache
        };

        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `student_${this.currentUser.studentNumber || 'records'}_data.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        this.showToast('Data exported to JSON file!', 'success');
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
 * LOCAL DATA STORE (IN-BROWSER STORAGE FALLBACK FOR STANDALONE DEMO)
 * Stores student accounts, skills, and records in localStorage when
 * running directly in the browser without the Java server running.
 * ══════════════════════════════════════════════════════════════════════
 */
const LocalDataStore = {
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
            const allSkills = (typeof app !== 'undefined' && app.catalogue && app.catalogue.length) ? app.catalogue : this.skills;
            return {
                offered: offIds.map(id => allSkills.find(s => s.skillId === id) || { skillId: id, skillName: `Skill #${id}`, categoryName: 'General' }).filter(Boolean),
                wanted: wanIds.map(id => allSkills.find(s => s.skillId === id) || { skillId: id, skillName: `Skill #${id}`, categoryName: 'General' }).filter(Boolean)
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
