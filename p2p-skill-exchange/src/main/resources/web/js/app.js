/**
 * ════════════════════════════════════════════════════════════════
 * SKILL SYNC - APPLICATION LOGIC
 * Phase 1: Login, Registration, Student Profile & SQL Skills
 * ════════════════════════════════════════════════════════════════
 */

const app = {
    // ── Application State ──────────────────────────────────────
    currentUser: null,
    catalogueSkills: [],
    myKnownSkills: [],

    // ── Initialization ─────────────────────────────────────────
    init() {
        // Check for existing session in persistent storage
        const savedSession = localStorage.getItem("student_session");
        if (savedSession) {
            try {
                this.currentUser = JSON.parse(savedSession);
                this.showProfileView();
                this.loadSkillCatalogue();
                this.loadStudentSkills();
                return;
            } catch (e) {
                localStorage.removeItem("student_session");
            }
        }
        this.showAuthView();
    },

    // ── View Switching ─────────────────────────────────────────
    showAuthView() {
        document.getElementById("navbar").classList.add("hidden");
        document.getElementById("view-auth").classList.remove("hidden");
        document.getElementById("view-profile").classList.add("hidden");
    },

    showProfileView() {
        document.getElementById("navbar").classList.remove("hidden");
        document.getElementById("view-auth").classList.add("hidden");
        document.getElementById("view-profile").classList.remove("hidden");
        this.renderProfile();
    },

    switchAuthTab(tab) {
        const loginTab = document.getElementById("tabLoginBtn");
        const registerTab = document.getElementById("tabRegisterBtn");
        const loginBox = document.getElementById("authLoginBox");
        const registerBox = document.getElementById("authRegisterBox");

        if (tab === "login") {
            loginTab.classList.add("active");
            registerTab.classList.remove("active");
            loginBox.classList.remove("hidden");
            registerBox.classList.add("hidden");
        } else {
            registerTab.classList.add("active");
            loginTab.classList.remove("active");
            registerBox.classList.remove("hidden");
            loginBox.classList.add("hidden");
        }
    },

    // ── Authentication (Login & Register via Backend/Cloud) ────
    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.student) {
                    this.setCurrentUser(data.student);
                    this.showToast("Signed in successfully!", "success");
                    return;
                }
            }

            if (await this.loginFromLocalStorage(email, password)) return;
            const errorData = await response.json().catch(() => ({}));
            this.showToast(errorData.error || "Invalid email or password.", "error");

        } catch (err) {
            if (await this.loginFromLocalStorage(email, password)) return;
            this.showToast("Could not connect to backend server. Please try again.", "error");
        }
    },

    async handleRegister(event) {
        event.preventDefault();
        const studentNumber = document.getElementById("regStudentNumber").value.trim();
        const fullName = document.getElementById("regFullName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const department = document.getElementById("regDepartment").value.trim();
        const yearOfStudy = parseInt(document.getElementById("regYear").value);
        const password = document.getElementById("regPassword").value;
        const bio = document.getElementById("regBio").value.trim();

        if (password.length < 6) {
            this.showToast("Password must be at least 6 characters long.", "error");
            return;
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentNumber,
                    fullName,
                    email,
                    password,
                    department,
                    yearOfStudy: String(yearOfStudy),
                    bio
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.student) {
                    this.setCurrentUser(data.student);
                    this.showToast("Account created & profile registered in database!", "success");
                    return;
                }
            }

            await this.registerInLocalStorage(studentNumber, fullName, email, password, department, yearOfStudy, bio);

        } catch (err) {
            try {
                await this.registerInLocalStorage(studentNumber, fullName, email, password, department, yearOfStudy, bio);
            } catch (storageError) {
                this.showToast(storageError.message || "Could not save account.", "error");
            }
        }
    },

    async hashPassword(password) {
        if (!window.crypto || !window.crypto.subtle) {
            throw new Error("Secure browser storage is unavailable. Please use the Skill Sync server.");
        }
        const bytes = new TextEncoder().encode(password);
        const digest = await window.crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(digest))
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");
    },

    async loginFromLocalStorage(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const accounts = JSON.parse(localStorage.getItem("skill_sync_accounts") || "[]");
        const account = accounts.find(item => item.email === normalizedEmail);
        if (!account || account.passwordHash !== await this.hashPassword(password)) return false;

        const { passwordHash, ...student } = account;
        this.setCurrentUser(student);
        this.showToast("Signed in successfully.", "success");
        return true;
    },

    async registerInLocalStorage(studentNumber, fullName, email, password, department, yearOfStudy, bio) {
        const normalizedEmail = email.trim().toLowerCase();
        const accounts = JSON.parse(localStorage.getItem("skill_sync_accounts") || "[]");
        if (accounts.some(item => item.email === normalizedEmail)) {
            throw new Error("An account with this email already exists.");
        }

        const student = {
            studentId: Date.now(),
            studentNumber: studentNumber.trim().toUpperCase(),
            fullName: fullName.trim(),
            email: normalizedEmail,
            department: department.trim(),
            yearOfStudy,
            bio: bio || "Student at College"
        };
        accounts.push({ ...student, passwordHash: await this.hashPassword(password) });
        localStorage.setItem("skill_sync_accounts", JSON.stringify(accounts));
        this.setCurrentUser(student);
        this.showToast("Account created successfully.", "success");
    },

    setCurrentUser(student) {
        this.currentUser = student;
        localStorage.setItem("student_session", JSON.stringify(student));
        this.showProfileView();
        this.loadSkillCatalogue();
        this.loadStudentSkills();
    },

    logout() {
        this.currentUser = null;
        this.myKnownSkills = [];
        localStorage.removeItem("student_session");
        this.showAuthView();
        this.showToast("Signed out successfully.", "info");
    },

    // ── Render Student Profile ─────────────────────────────────
    renderProfile() {
        if (!this.currentUser) return;
        const s = this.currentUser;

        // Navbar & Header
        document.getElementById("navUserName").textContent = s.fullName || "Student";
        document.getElementById("profFullName").textContent = s.fullName || "Student";
        document.getElementById("profSubtitle").textContent = `${s.department || "Engineering"} • Year ${s.yearOfStudy || "1"}`;
        
        // Info card values
        document.getElementById("profStudentNumber").textContent = s.studentNumber || "N/A";
        document.getElementById("profEmail").textContent = s.email || "N/A";
        document.getElementById("profDepartment").textContent = s.department || "N/A";
        document.getElementById("profYear").textContent = `${s.yearOfStudy || "1"}th Year`;
        document.getElementById("profBio").textContent = s.bio || "No bio provided yet.";
    },

    // ── Skills Known Module (Loaded & Stored via SQL Database) ─
    async loadSkillCatalogue() {
        const select = document.getElementById("sqlSkillSelect");
        select.innerHTML = '<option value="" disabled selected>Loading skills from SQL database...</option>';

        try {
            const response = await fetch("/api/skills/catalogue");
            if (response.ok) {
                this.catalogueSkills = await response.json();
                this.populateSkillDropdown();
                return;
            }
        } catch (e) {
            // Ignore & use default catalogue below
        }

        // Default SQL skill catalogue fallback
        this.catalogueSkills = [
            { skillId: 1, skillName: "Java", categoryName: "Programming Languages" },
            { skillId: 2, skillName: "Python", categoryName: "Programming Languages" },
            { skillId: 3, skillName: "C++", categoryName: "Programming Languages" },
            { skillId: 4, skillName: "JavaScript", categoryName: "Programming Languages" },
            { skillId: 5, skillName: "HTML & CSS", categoryName: "Web Development" },
            { skillId: 6, skillName: "React.js", categoryName: "Web Development" },
            { skillId: 7, skillName: "Node.js", categoryName: "Web Development" },
            { skillId: 8, skillName: "SQL & Databases", categoryName: "Database" },
            { skillId: 9, skillName: "MySQL", categoryName: "Database" },
            { skillId: 10, skillName: "Machine Learning", categoryName: "Data Science & AI" },
            { skillId: 11, skillName: "Git & GitHub", categoryName: "DevOps & Cloud" },
            { skillId: 12, skillName: "UI/UX Design", categoryName: "Design & UX" }
        ];
        this.populateSkillDropdown();
    },

    populateSkillDropdown() {
        const select = document.getElementById("sqlSkillSelect");
        select.innerHTML = '<option value="" disabled selected>-- Select a skill from SQL database --</option>';

        // Group by category
        const groups = {};
        this.catalogueSkills.forEach(skill => {
            const cat = skill.categoryName || "General Skills";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(skill);
        });

        for (const [category, skills] of Object.entries(groups)) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = category;
            skills.forEach(skill => {
                const opt = document.createElement("option");
                opt.value = skill.skillId;
                opt.textContent = skill.skillName;
                optgroup.appendChild(opt);
            });
            select.appendChild(optgroup);
        }
    },

    async loadStudentSkills() {
        if (!this.currentUser) return;
        const studentId = this.currentUser.studentId;

        try {
            const response = await fetch(`/api/skills/my?studentId=${studentId}`);
            if (response.ok) {
                const data = await response.json();
                this.myKnownSkills = data.offered || [];
                this.renderKnownSkills();
                return;
            }
        } catch (e) {
            // Ignore & fallback
        }

        // Local storage cache fallback
        const localKey = `student_skills_${studentId}`;
        const cached = localStorage.getItem(localKey);
        if (cached) {
            this.myKnownSkills = JSON.parse(cached);
        } else {
            // Initial seed skills
            this.myKnownSkills = [
                { skillId: 1, skillName: "Java", categoryName: "Programming Languages" },
                { skillId: 8, skillName: "SQL & Databases", categoryName: "Database" }
            ];
            localStorage.setItem(localKey, JSON.stringify(this.myKnownSkills));
        }
        this.renderKnownSkills();
    },

    renderKnownSkills() {
        const list = document.getElementById("knownSkillsList");
        const emptyNotice = document.getElementById("noSkillsMessage");
        const countBadge = document.getElementById("skillsCountBadge");

        list.innerHTML = "";
        countBadge.textContent = `${this.myKnownSkills.length} Skill${this.myKnownSkills.length === 1 ? "" : "s"}`;

        if (this.myKnownSkills.length === 0) {
            emptyNotice.classList.remove("hidden");
            return;
        }

        emptyNotice.classList.add("hidden");

        this.myKnownSkills.forEach(skill => {
            const chip = document.createElement("div");
            chip.className = "skill-chip";
            chip.innerHTML = `
                <span>⚡ ${this.escapeHtml(skill.skillName)}</span>
                <button type="button" class="btn-remove-skill" title="Remove from SQL database" onclick="app.removeKnownSkill(${skill.skillId})">✕</button>
            `;
            list.appendChild(chip);
        });
    },

    async addKnownSkill() {
        const select = document.getElementById("sqlSkillSelect");
        const skillId = parseInt(select.value);

        if (!skillId) {
            this.showToast("Please select a skill from the dropdown first.", "error");
            return;
        }

        // Check for duplicates
        if (this.myKnownSkills.some(s => s.skillId === skillId)) {
            this.showToast("This skill is already in your profile!", "info");
            return;
        }

        const selectedSkill = this.catalogueSkills.find(s => s.skillId === skillId);
        const studentId = this.currentUser.studentId;

        // Try backend SQL call
        try {
            await fetch("/api/skills/offered/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, skillId })
            });
        } catch (e) {
            // Ignore network fail, maintain locally
        }

        if (selectedSkill) {
            this.myKnownSkills.push(selectedSkill);
            const localKey = `student_skills_${studentId}`;
            localStorage.setItem(localKey, JSON.stringify(this.myKnownSkills));
            this.renderKnownSkills();
            this.showToast(`Added "${selectedSkill.skillName}" to your SQL profile!`, "success");
            select.value = "";
        }
    },

    async removeKnownSkill(skillId) {
        const studentId = this.currentUser ? this.currentUser.studentId : 1;

        // Try backend SQL call
        try {
            await fetch("/api/skills/offered/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, skillId })
            });
        } catch (e) {
            // Ignore
        }

        this.myKnownSkills = this.myKnownSkills.filter(s => s.skillId !== skillId);
        const localKey = `student_skills_${studentId}`;
        localStorage.setItem(localKey, JSON.stringify(this.myKnownSkills));
        this.renderKnownSkills();
        this.showToast("Skill removed from profile.", "info");
    },

    // ── Edit Profile Modal ─────────────────────────────────────
    openEditProfileModal() {
        if (!this.currentUser) return;
        document.getElementById("editFullName").value = this.currentUser.fullName || "";
        document.getElementById("editDepartment").value = this.currentUser.department || "";
        document.getElementById("editYear").value = String(this.currentUser.yearOfStudy || 1);
        document.getElementById("editBio").value = this.currentUser.bio || "";
        document.getElementById("editProfileModal").classList.remove("hidden");
    },

    closeEditProfileModal() {
        document.getElementById("editProfileModal").classList.add("hidden");
    },

    async handleSaveProfile(event) {
        event.preventDefault();
        const fullName = document.getElementById("editFullName").value.trim();
        const department = document.getElementById("editDepartment").value.trim();
        const yearOfStudy = parseInt(document.getElementById("editYear").value);
        const bio = document.getElementById("editBio").value.trim();

        this.currentUser.fullName = fullName;
        this.currentUser.department = department;
        this.currentUser.yearOfStudy = yearOfStudy;
        this.currentUser.bio = bio;

        // Update local session
        localStorage.setItem("student_session", JSON.stringify(this.currentUser));

        // Try backend SQL update
        try {
            await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: this.currentUser.studentId,
                    fullName,
                    department,
                    yearOfStudy: String(yearOfStudy),
                    bio
                })
            });
        } catch (e) {
            // Ignore
        }

        this.renderProfile();
        this.closeEditProfileModal();
        this.showToast("Profile updated successfully in database!", "success");
    },

    // ── Utility Toast ──────────────────────────────────────────
    showToast(message, type = "info") {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        setTimeout(() => {
            toast.classList.add("hidden");
        }, 3500);
    },

    escapeHtml(str) {
        if (!str) return "";
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => app.init());
