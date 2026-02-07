// --- State Management ---

// Global State
let currentUser = null;
try {
    const saved = localStorage.getItem('currentUser');
    if (saved && saved !== 'undefined' && saved !== 'null') {
        currentUser = JSON.parse(saved);
    }
} catch (e) {
    console.warn('Could not parse currentUser from localStorage', e);
    localStorage.removeItem('currentUser');
}

let currentView = currentUser ? 'dashboard' : 'landing';

// Elements will be retrieved when needed to ensure they exist
const getApp = () => document.getElementById('main-content');
const getNavActions = () => document.getElementById('nav-actions');

const API_BASE = 'api';

// --- Helper Functions ---
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}/${endpoint}`, {
            ...options,
            headers: {
                ...options.headers,
                'Accept': 'application/json',
            },
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (err) {
        showNotification(err.message, 'danger');
        throw err;
    }
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(note);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => note.remove(), 4000);
}

window.setView = (view) => {
    currentView = view;
    render();
};

function renderNavbar() {
    const navActions = getNavActions();
    if (!navActions) return;

    if (currentUser) {
        navActions.innerHTML = `
            <div style="display:flex; align-items:center; gap:1.5rem">
                <span class="text-sm" style="color:white">
                    <i data-lucide="user" style="width:14px; display:inline; margin-right:0.4rem"></i>
                    ${currentUser.role}: <strong>${currentUser.name}</strong>
                </span>
                <button class="btn btn-outline" onclick="logout()" style="padding:0.4rem 1rem; font-size:0.875rem">
                    <i data-lucide="log-out"></i> Logout
                </button>
            </div>
        `;
    } else {
        navActions.innerHTML = `
            <button class="btn btn-outline" onclick="setView('auth')" style="padding:0.4rem 1rem; font-size:0.875rem">Login</button>
        `;
    }
}

// --- Component Rendering ---

async function render() {
    try {
        renderNavbar();

        // View Router
        if (currentView === 'landing') {
            renderLanding();
        } else if (currentView === 'auth') {
            renderAuth();
        } else if (currentView === 'register') {
            renderRegister();
        } else if (currentView === 'dashboard') {
            if (!currentUser) {
                setView('landing');
                return;
            }
            if (currentUser.role === 'Student') {
                await renderStudentDashboard();
            } else {
                await renderFacultyDashboard();
            }
        }

        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error('Render Error:', e);
        showNotification('An error occurred during rendering. Check console for details.', 'danger');
    }
}

// --- Views ---

function renderLanding() {
    const app = getApp();
    if (!app) return;
    app.innerHTML = `
        <section class="hero">
            <div class="hero-text">
                <span class="hero-badge">Academic Excellence Redefined</span>
                <h1>Streamline Your Assignments with Precision.</h1>
                <p style="font-size: 1.2rem; margin: 1.5rem 0 2.5rem 0;">
                    Experience a seamless workflow for submissions, grading, and feedback. 
                    GradeFlow eliminates the chaos of paperwork and email attachments.
                </p>
                <div style="display:flex; gap: 1rem">
                    <button class="btn btn-primary" onclick="setView('register')">
                        Get Started <i data-lucide="arrow-right"></i>
                    </button>
                    <button class="btn btn-outline" onclick="setView('auth')">Login</button>
                </div>
            </div>
            <div class="hero-image floating">
                <div style="width: 400px; height: 300px; background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; backdrop-filter: blur(20px); position: relative; padding: 2rem;">
                    <div style="width: 60px; height: 60px; background: var(--primary); border-radius: 12px; margin-bottom: 1.5rem; display:flex; align-items:center; justify-content:center">
                        <i data-lucide="check-circle" style="color:white; width:30px; height:30px"></i>
                    </div>
                    <h3 style="margin-bottom:0.5rem">Assignment Submitted!</h3>
                    <p class="text-sm">Web Development Project</p>
                    <div style="margin-top: 2rem; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px;">
                        <div style="width: 100%; height: 100%; background: var(--success); border-radius: 2px;"></div>
                    </div>
                    <p class="text-sm" style="margin-top: 0.5rem; color: var(--success)">Graded: A+</p>
                </div>
            </div>
        </section>

        <section class="features-grid">
            <div class="feature-card">
                <div class="feature-icon"><i data-lucide="upload-cloud"></i></div>
                <h3>Secure Submissions</h3>
                <p>Upload your assignments securely in PDF, DOC, or ZIP formats with automated validation.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon"><i data-lucide="clock"></i></div>
                <h3>Deadline Tracking</h3>
                <p>Never miss a due date with real-time tracking and automated late submission handling.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon"><i data-lucide="check-square"></i></div>
                <h3>Instant Grading</h3>
                <p>Faculty can review submissions and provide structured feedback instantly.</p>
            </div>
        </section>
    `;
}

function renderAuth() {
    const app = getApp();
    if (!app) return;
    app.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card card">
                <div style="text-align:center">
                    <h2 style="margin-bottom:0.5rem">Welcome Back</h2>
                    <p class="mb-2">Login to your dashboard</p>
                </div>
                
                <form onsubmit="handleLogin(event)" style="margin-top: 2rem">
                    <div style="margin-bottom: 1.5rem">
                        <label class="text-sm" style="margin-bottom:0.5rem; display:block">Email Address</label>
                        <input type="email" id="login-email" placeholder="student@university.edu" required>
                    </div>
                    <div style="margin-bottom: 2rem">
                        <label class="text-sm" style="margin-bottom:0.5rem; display:block">Password</label>
                        <input type="password" id="login-password" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%">
                        Login to Portal
                        <i data-lucide="arrow-right"></i>
                    </button>
                    
                    <p class="text-sm" style="text-align:center; margin-top:1.5rem">
                        Don't have an account? <a href="#" onclick="setView('register'); return false;" style="color:var(--primary)">Register here</a>
                    </p>
                </form>
            </div>
        </div>
    `;
}

function renderRegister() {
    const app = getApp();
    if (!app) return;
    app.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card card">
                <div style="text-align:center">
                    <h2 style="margin-bottom:0.5rem">Create Account</h2>
                    <p class="mb-2">Join GradeFlow today</p>
                </div>
                
                <div class="role-switcher" style="margin-top: 2rem">
                    <div class="role-btn active" id="role-student" onclick="selectRole('Student')">Student</div>
                    <div class="role-btn" id="role-faculty" onclick="selectRole('Faculty')">Faculty</div>
                </div>

                <form onsubmit="handleRegister(event)">
                    <div style="margin-bottom: 1rem">
                        <label class="text-sm" style="margin-bottom:0.5rem; display:block">Full Name</label>
                        <input type="text" name="name" placeholder="John Doe" required>
                    </div>
                    <div style="margin-bottom: 1rem">
                        <label class="text-sm" style="margin-bottom:0.5rem; display:block">Email Address</label>
                        <input type="email" name="email" placeholder="john@university.edu" required>
                    </div>
                    <div style="margin-bottom: 2rem">
                        <label class="text-sm" style="margin-bottom:0.5rem; display:block">Password</label>
                        <input type="password" name="password" placeholder="••••••••" required>
                    </div>
                    <div style="margin-bottom: 2rem">
                        <label class="text-sm" style="margin-bottom:0.5rem; display:block">Department</label>
                        <select name="department" required>
                            <option value="" disabled selected>Select Department</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                            <option value="Business Administration">Business Administration</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%">
                        Create Account
                        <i data-lucide="user-plus"></i>
                    </button>
                    
                     <p class="text-sm" style="text-align:center; margin-top:1.5rem">
                        Already have an account? <a href="#" onclick="setView('auth'); return false;" style="color:var(--primary)">Login here</a>
                    </p>
                </form>
            </div>
        </div>
    `;
    window.selectedRole = 'Student'; // Default role for registration
}

async function renderStudentDashboard() {
    const app = getApp();
    if (!app) return;
    const assignments = await apiFetch(`assignments.php?department=${encodeURIComponent(currentUser.department)}`);
    const submissions = await apiFetch(`submissions.php?student_id=${currentUser.id}`);

    const assignmentCards = assignments.map(a => {
        const sub = submissions.find(s => parseInt(s.assignment_id) === parseInt(a.id));
        const isLate = new Date() > new Date(a.deadline);

        let status = 'Pending';
        let statusClass = 'pending';

        if (sub) {
            status = sub.grade ? 'Graded' : 'Submitted';
            statusClass = sub.grade ? 'graded' : 'submitted';
        } else if (isLate) {
            status = 'Overdue';
            statusClass = 'late';
        }

        const questionFile = a.question_file || 'Assignment Questions.pdf';

        return `
            <div class="card">
                <div style="font-size:0.75rem; color:var(--primary); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.5rem">
                    ${a.department || 'General Department'}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom: 1rem">
                    <h3 style="font-size: 1.25rem">${a.title}</h3>
                    <span class="badge ${statusClass}">${status}</span>
                </div>
                
                <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; display:flex; align-items:center; gap:0.75rem">
                    <i data-lucide="file-text" style="color:var(--primary)"></i>
                    <div style="flex:1; overflow:hidden">
                        <p class="text-sm" style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${questionFile}</p>
                        <div style="display:flex; gap:1rem; margin-top:0.25rem">
                            <button class="btn-link text-sm" onclick="viewDocument('${questionFile}')" style="color:var(--primary); text-decoration:none; background:none; border:none; padding:0; cursor:pointer; display:flex; align-items:center; gap:0.25rem">
                                <i data-lucide="eye" style="width:14px"></i> View
                            </button>
                            <a href="uploads/${questionFile}" download class="btn-link text-sm" style="color:var(--primary); text-decoration:none; display:flex; align-items:center; gap:0.25rem">
                                <i data-lucide="download" style="width:14px"></i> Download
                            </a>
                        </div>
                    </div>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border)">
                    <div class="text-sm" style="color: var(--primary)">
                        <i data-lucide="calendar" style="width:14px; display:inline"></i> Due: ${new Date(a.deadline).toLocaleDateString()}
                    </div>
                    <div class="text-sm">
                        Format: <span style="font-family:monospace; background:rgba(255,255,255,0.1); padding:0.2rem 0.4rem; border-radius:4px">PDF</span>
                    </div>
                </div>
                
                ${sub ? `
                    <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px;">
                        <p class="text-sm"><strong>Submitted File:</strong></p>
                        <div style="display:flex; gap:0.5rem; align-items:center; margin:0.5rem 0">
                            <i data-lucide="file" style="width:14px"></i> ${sub.file_name}
                        </div>
                        ${sub.grade ? `
                            <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--glass-border)">
                                <div style="display:flex; justify-content:space-between; align-items:center">
                                    <span style="color: var(--success); font-weight: bold; font-size: 1.1rem">${sub.grade}</span>
                                    <span class="text-sm">Feedback Available</span>
                                </div>
                                <p class="text-sm" style="margin-top:0.5rem; font-style:italic">"${sub.feedback}"</p>
                            </div>
                        ` : '<p class="text-sm" style="margin-top:0.5rem; color:var(--warning)">Awaiting Grade</p>'}
                    </div>
                ` : `
                    <button class="btn btn-primary" style="width:100%" onclick="openSubmission('${a.id}')" ${isLate ? 'disabled title="Submission deadline passed"' : ''}>
                        ${isLate ? 'Deadline Passed' : 'Submit Assignment'}
                    </button>
                    ${isLate ? '<p class="text-sm" style="color:var(--danger); text-align:center; margin-top:0.5rem">Submissions are closed.</p>' : ''}
                `}
            </div>
        `;
    }).join('');

    app.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h2>My Dashboard</h2>
                <p class="text-sm">Welcome back, ${currentUser.name}</p>
            </div>
        </div>
        <div class="grid">
            ${assignments.length === 0 ? '<p style="color:var(--gray-text)">No assignments found for your department.</p>' : assignmentCards}
        </div>
        <div id="modal-container"></div>
    `;
}

async function renderFacultyDashboard() {
    const app = getApp();
    if (!app) return;
    const assignments = await apiFetch(`assignments.php?faculty_id=${currentUser.id}`);

    const assignmentList = assignments.map(a => `
        <div class="card" onclick="viewSubmissions('${a.id}')" style="cursor: pointer">
             <div style="font-size:0.75rem; color:var(--primary); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.5rem">
                ${a.department || 'General Department'}
             </div>
             <div style="display:flex; justify-content:space-between; align-items:start">
                <h3>${a.title}</h3>
                <i data-lucide="chevron-right" style="color:var(--gray-text)"></i>
             </div>
             
             <div style="margin: 0.5rem 0 1.5rem 0; display:flex; align-items:center; gap:0.5rem; font-size:0.875rem; color:var(--gray-text)">
                <i data-lucide="file-text" style="width:14px"></i> 
                <span>${a.question_file || 'No Question File'}</span>
             </div>
             <div style="display:flex; gap:1rem; font-size:0.875rem; color:var(--gray-text)">
                 <span><i data-lucide="calendar" style="width:14px"></i> ${a.deadline}</span>
                  <span><i data-lucide="file" style="width:14px"></i> PDF</span>
             </div>
        </div>
    `).join('');

    app.innerHTML = `
        <div class="dashboard-header">
            <div>
                <h2>Faculty Overview</h2>
                <p class="text-sm">Welcome back, ${currentUser.name}</p>
            </div>
            <button class="btn btn-primary" onclick="openCreateAssignment()">
                <i data-lucide="plus"></i> Create Assignment
            </button>
        </div>
        
        <h3 style="margin-bottom:1.5rem">My Active Courses</h3>
        <div class="grid">
            ${assignments.length === 0 ? '<p style="color:var(--gray-text)">You haven\'t created any assignments yet.</p>' : assignmentList}
        </div>
        <div id="dynamic-view" style="margin-top: 3rem"></div>
        <div id="modal-container"></div>
    `;
}

// --- Interactions ---

window.selectRole = (role) => {
    window.selectedRole = role;
    document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`role-${role.toLowerCase()}`).classList.add('active');
};

window.handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const data = await apiFetch('auth.php?action=login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showNotification('Login successful!');
        setView('dashboard');
    } catch (err) {
        // Error already shown by apiFetch notification
    }
};

window.handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: window.selectedRole,
        department: formData.get('department')
    };

    try {
        const data = await apiFetch('auth.php?action=register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showNotification('Registration successful! Welcome.');
        setView('dashboard');
    } catch (err) {
        // Error already shown
    }
};

window.logout = () => {
    localStorage.removeItem('currentUser');
    currentUser = null;
    setView('landing');
};

// --- Faculty Features ---

window.openCreateAssignment = () => {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:200">
            <div class="card" style="width: 500px; max-width:90%; position:relative">
                <h3 style="margin-bottom:1.5rem">Create New Assignment</h3>
                <form onsubmit="handleCreateAssignment(event)">
                    <div style="margin-bottom:1rem">
                        <label class="text-sm">Assignment Title</label>
                        <input name="title" placeholder="e.g. Midterm Project" required>
                    </div>
                    <div style="margin-bottom:1rem">
                        <label class="text-sm">Department</label>
                        <input type="text" value="${currentUser.department}" readonly style="opacity:0.7; cursor:not-allowed">
                        <input type="hidden" name="department" value="${currentUser.department}">
                    </div>
                    <div style="margin-bottom:1rem">
                        <label class="text-sm">Question Paper (PDF/DOCX)</label>
                        <div style="border: 2px dashed var(--glass-border); padding: 1.5rem; border-radius: 8px; text-align:center; cursor:pointer" onclick="document.getElementById('q-file').click()">
                            <i data-lucide="upload" style="margin-bottom:0.5rem"></i>
                            <p id="q-file-name" class="text-sm" style="color:var(--gray-text)">Click to upload question file</p>
                        </div>
                        <input type="file" id="q-file" name="question_file" accept=".pdf,.doc,.docx" required style="display:none" onchange="document.getElementById('q-file-name').innerText = this.files[0]?.name || 'Click to upload question file'">
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1.5rem">
                        <div>
                             <label class="text-sm">Due Date</label>
                             <input name="deadline" type="date" required>
                        </div>
                        <div>
                             <label class="text-sm" style="display:block; margin-bottom:0.5rem">Accepted Formats</label>
                             <div style="background:rgba(255,255,255,0.05); padding:0.75rem; border-radius:8px; border:1px solid var(--glass-border)">
                                <span style="font-size:0.9rem; color:var(--gray-text)">Only <strong>PDF</strong> files are allowed.</span>
                                <input type="hidden" name="format" value="pdf">
                             </div>
                        </div>
                    </div>
                    <div class="flex-end" style="gap: 1rem">
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create Assignment</button>
                    </div>
                </form>
            </div>
        </div>
    `;
};

window.handleCreateAssignment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.append('faculty_id', currentUser.id);

    try {
        const response = await fetch(`${API_BASE}/assignments.php`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        showNotification(data.message);
        closeModal();
        render();
    } catch (err) {
        showNotification(err.message, 'danger');
    }
};

window.viewSubmissions = async (assignmentId) => {
    const relevantSubmissions = await apiFetch(`submissions.php?assignment_id=${assignmentId}`);

    // Scroll to view
    const view = document.getElementById('dynamic-view');
    view.scrollIntoView({ behavior: 'smooth' });

    const submissionList = relevantSubmissions.map((s, idx) => `
        <tr style="border-bottom: 1px solid var(--glass-border)">
            <td style="padding:1rem">${s.student_name || 'Student'}</td>
            <td style="color:var(--primary)">
                <div style="display:flex; align-items:center; gap:0.75rem">
                    <div style="display:flex; align-items:center; gap:0.4rem; cursor:pointer" onclick="viewDocument('${s.file_path}')">
                        <i data-lucide="eye" style="width:14px"></i>
                        <span style="text-decoration:underline">${s.file_name}</span>
                    </div>
                    <a href="uploads/${s.file_path}" download title="Download">
                         <i data-lucide="download" style="width:14px; color:var(--primary)"></i>
                    </a>
                </div>
            </td>
            <td>${new Date(s.submitted_at).toLocaleDateString()}</td>
            <td>${s.grade ? `<span style="color:var(--success); font-weight:bold">${s.grade}</span>` : '<span style="color:var(--warning)">Pending</span>'}</td>
            <td style="text-align:right">
                <button class="btn btn-outline" style="padding:0.4rem 0.8rem; font-size:0.8rem" onclick="evaluateSubmission('${s.id}')">
                    ${s.grade ? 'Update Grade' : 'Evaluate'}
                </button>
            </td>
        </tr>
    `).join('');

    view.innerHTML = `
        <div class="card" style="border: 1px solid var(--primary)">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--glass-border)">
                <div>
                     <h3>Submissions Review</h3>
                </div>
                <button class="btn btn-outline" onclick="document.getElementById('dynamic-view').innerHTML=''">Close View</button>
            </div>
            
            ${relevantSubmissions.length === 0 ? '<p style="text-align:center; padding:2rem; color:var(--gray-text)">No submissions received yet.</p>' : `
                <table style="width:100%; text-align:left; border-collapse: collapse;">
                    <thead style="border-bottom: 1px solid var(--glass-border); color:var(--gray-text); font-size:0.875rem">
                        <tr>
                            <th style="padding:0.5rem">Student</th>
                            <th>File</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th style="text-align:right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${submissionList}
                    </tbody>
                </table>
            `}
        </div>
    `;
    lucide.createIcons();
};

window.evaluateSubmission = async (submissionId) => {
    const modal = document.getElementById('modal-container');

    modal.innerHTML = `
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:200">
            <div class="card" style="width: 400px; max-width:90%">
                <h3 style="margin-bottom:1rem">Evaluate Submission</h3>
                <form onsubmit="handleEvaluation(event, '${submissionId}')">
                    <div style="margin-bottom:1rem">
                        <label class="text-sm">Grade</label>
                        <input name="grade" placeholder="e.g. A, 95/100" required>
                    </div>
                    <div style="margin-bottom:1.5rem">
                        <label class="text-sm">Feedback</label>
                        <textarea name="feedback" placeholder="Provide constructive feedback..." rows="3" required></textarea>
                    </div>
                    
                    <div class="flex-end" style="gap: 1rem">
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Submit Evaluation</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.handleEvaluation = async (e, submissionId) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
        id: submissionId,
        grade: formData.get('grade'),
        feedback: formData.get('feedback')
    };

    try {
        const data = await apiFetch('submissions.php?action=grade', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showNotification(data.message);
        closeModal();
        render();
    } catch (err) { }
};

// --- Student Features ---

window.openSubmission = async (assignmentId) => {
    // Fetch assignment details since we don't have them in global state
    const assignments = await apiFetch(`assignments.php?id=${assignmentId}`);
    const assignment = Array.isArray(assignments) ? assignments.find(a => parseInt(a.id) === parseInt(assignmentId)) : assignments;

    if (!assignment) {
        showNotification("Assignment not found", "danger");
        return;
    }

    // Validate Deadline again (Server-side simulation)
    if (new Date() > new Date(assignment.deadline)) {
        alert("Submission deadline has passed.");
        return;
    }

    const formats = ['pdf']; // Force PDF only
    const acceptString = '.pdf';

    // ... modal HTML ...
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:200">
            <div class="card" style="width: 450px; max-width:90%">
                <h3 style="margin-bottom:0.5rem">Submit Assignment</h3>
                <p class="text-sm" style="margin-bottom:1.5rem">Upload your work for: <strong>${assignment.title}</strong></p>
                
                <div class="upload-zone" id="drop-zone">
                    <i data-lucide="upload-cloud" style="width: 48px; height: 48px; color: var(--primary); margin-bottom:1rem"></i>
                    <p style="font-weight:600">Click to upload files</p>
                    <p class="text-sm">Supported: ${formats.join(', ').toUpperCase()}</p>
                    <input type="file" id="file-input" style="display:none" multiple onchange="handleFileSelect(event, '${assignmentId}')" accept="${acceptString}">
                </div>
                
                <div class="flex-end" style="margin-top: 1.5rem">
                    <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        const zone = document.getElementById('drop-zone');
        const input = document.getElementById('file-input');
        zone.addEventListener('click', () => input.click());
        lucide.createIcons();
    }, 0);
};

window.handleFileSelect = async (e, assignmentId) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files[0].type !== 'application/pdf' && !files[0].name.toLowerCase().endsWith('.pdf')) {
        showNotification("Only PDF files are allowed.", 'danger');
        return;
    }

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('assignment_id', assignmentId);
    formData.append('student_id', currentUser.id);

    const btn = document.querySelector('#drop-zone');
    btn.innerHTML = `<p>Uploading...</p>`;

    try {
        const response = await fetch(`${API_BASE}/submissions.php?action=submit`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        showNotification(data.message);
        closeModal();
        render();
    } catch (err) {
        showNotification(err.message, 'danger');
        btn.innerHTML = `<p>Error. Try again.</p>`;
    }
};

window.closeModal = () => {
    document.getElementById('modal-container').innerHTML = '';
};

window.viewDocument = (filename) => {
    const modal = document.getElementById('modal-container');
    const fileUrl = `uploads/${filename}`;

    modal.innerHTML = `
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:200">
            <div class="card" style="width: 800px; max-width:95%; height:80vh; display:flex; flex-direction:column; animation: fadeIn 0.3s ease">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--glass-border); padding-bottom:1rem">
                    <h3 style="margin:0; font-size:1.25rem"><i data-lucide="file-text" style="width:20px; display:inline; margin-right:0.5rem"></i> ${filename}</h3>
                    <div style="display:flex; gap:1rem">
                        <a href="${fileUrl}" download class="btn btn-primary" style="padding:0.5rem 1rem; font-size:0.875rem; text-decoration:none">
                             <i data-lucide="download" style="width:14px"></i> Download
                        </a>
                        <button class="btn btn-outline" onclick="closeModal()" style="padding:0.5rem 1rem; font-size:0.875rem">Close</button>
                    </div>
                </div>
                <div style="flex:1; background: #fff; color: #333; overflow:hidden; border-radius:4px;">
                    <iframe src="${fileUrl}" style="width:100%; height:100%; border:none"></iframe>
                </div>
            </div>
        </div>
    `;
    if (window.lucide) lucide.createIcons();
};

window.downloadFile = (filename) => {
    const a = document.createElement('a');
    a.href = `uploads/${filename}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// Start App
render();
