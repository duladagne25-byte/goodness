// ========== GLOBAL VARIABLES ==========
let currentUser = null;
let editStudentId = null;
const ADMIN_EMAIL = "duladagn25@gmail.com";

// ========== PAGE NAVIGATION ==========
function showPage(pageName) {
    // Hide all pages
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('aboutPage').style.display = 'none';
    document.getElementById('contactPage').style.display = 'none';
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboardPage').style.display = 'none';
    
    // Show selected page
    document.getElementById(`${pageName}Page`).style.display = 'block';
}

// ========== SHOW DASHBOARD TAB ==========
function showDashboardTab(tabName) {
    document.getElementById('studentsTab').style.display = 'none';
    document.getElementById('materialsTab').style.display = 'none';
    document.getElementById('paymentTab').style.display = 'none';
    
    document.getElementById(`${tabName}Tab`).style.display = 'block';
    
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

// ========== HELPER FUNCTIONS ==========
function showAlert(message, type = 'success') {
    const alertDiv = document.getElementById('alert');
    alertDiv.className = `alert alert-${type} show`;
    alertDiv.innerHTML = message;
    setTimeout(() => {
        alertDiv.classList.remove('show');
    }, 3000);
}

// ========== CREATE DEFAULT ADMIN ==========
async function createDefaultAdmin() {
    try {
        const usersRef = collection(window.db, 'users');
        const q = query(usersRef, where('email', '==', ADMIN_EMAIL));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            const userCred = await createUserWithEmailAndPassword(window.auth, ADMIN_EMAIL, 'Admin@123456');
            
            await addDoc(collection(window.db, 'users'), {
                uid: userCred.user.uid,
                name: 'Duladagne (Administrator)',
                email: ADMIN_EMAIL,
                role: 'admin',
                paymentStatus: true,
                createdAt: new Date().toISOString()
            });
            
            console.log('Admin created for', ADMIN_EMAIL);
        }
    } catch (error) {
        console.log('Admin may already exist:', error.message);
    }
}

// ========== SEND CONTACT MESSAGE ==========
async function sendMessage() {
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    if (!name || !email || !message) {
        showAlert('Please fill all fields!', 'error');
        return;
    }
    
    try {
        await addDoc(collection(window.db, 'messages'), {
            name: name,
            email: email,
            message: message,
            date: new Date().toISOString()
        });
        
        showAlert('Message sent successfully! We will contact you soon.', 'success');
        
        document.getElementById('contactName').value = '';
        document.getElementById('contactEmail').value = '';
        document.getElementById('contactMessage').value = '';
    } catch (error) {
        showAlert('Error sending message. Please try again.', 'error');
    }
}

// ========== AUTHENTICATION ==========
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showAlert('Please enter email and password!', 'error');
        return;
    }
    
    try {
        const userCred = await signInWithEmailAndPassword(window.auth, email, password);
        const uid = userCred.user.uid;
        
        const usersRef = collection(window.db, 'users');
        const q = query(usersRef, where('uid', '==', uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            querySnapshot.forEach(doc => {
                currentUser = { id: doc.id, ...doc.data() };
            });
        }
        
        // Ensure admin role for your email
        if (currentUser.email === ADMIN_EMAIL && currentUser.role !== 'admin') {
            const userRef = doc(window.db, 'users', currentUser.id);
            await updateDoc(userRef, { role: 'admin' });
            currentUser.role = 'admin';
        }
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI
        const roleText = currentUser.role === 'admin' ? '👑 Admin' : '🎓 Student';
        document.getElementById('userInfo').innerHTML = `
            <span>👋 ${currentUser.name}</span>
            <span class="badge">${roleText}</span>
            <button onclick="logout()">Logout</button>
        `;
        
        // Show dashboard link for admin
        if (currentUser.role === 'admin' || currentUser.email === ADMIN_EMAIL) {
            document.getElementById('dashboardLink').style.display = 'inline-block';
        }
        
        showPage('dashboard');
        await loadDashboard();
        showAlert(`Welcome ${currentUser.name}!`, 'success');
        
    } catch (error) {
        document.getElementById('loginError').innerHTML = error.message;
        showAlert(error.message, 'error');
    }
}

async function register() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const region = document.getElementById('regRegion').value;
    const city = document.getElementById('regCity').value;
    const course = document.getElementById('regCourse').value;
    
    // Prevent registration with admin email
    if (email === ADMIN_EMAIL) {
        showAlert('This email is reserved for admin!', 'error');
        return;
    }
    
    if (!name || !email || !password || !region || !city || !course) {
        showAlert('Please fill all fields!', 'error');
        return;
    }
    
    try {
        const userCred = await createUserWithEmailAndPassword(window.auth, email, password);
        
        await addDoc(collection(window.db, 'users'), {
            uid: userCred.user.uid,
            name: name,
            email: email,
            role: 'student',
            region: region,
            city: city,
            course: course,
            paymentStatus: false,
            registeredAt: new Date().toISOString()
        });
        
        showAlert('Registration successful! Please login.', 'success');
        
        // Clear form
       
