// Firebase Init
let db, auth;
const useFirebase = typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

if (useFirebase) {
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        console.log("Firebase Initialized");
    } catch (e) {
        console.error("Firebase Init Error:", e);
    }
} else {
    console.log("Running in Mock Mode (LocalStorage)");
}

// State
const state = {
    view: 'home',
    user: JSON.parse(localStorage.getItem('user')) || null,
    filters: {
        city: '',
        pincode: '',
        status: 'Buy',
        facing: '',
        priceRange: 1000
    },
    listings: []
};

// Load Data
async function loadListings() {
    if (useFirebase && db) {
        try {
            const snapshot = await db.collection('properties').get();
            const firebaseListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (firebaseListings.length > 0) {
                state.listings = firebaseListings;
            } else {
                state.listings = MOCK_LISTINGS;
            }
            // Refresh view if needed
            if (state.view === 'home') {
                renderHome();
            } else if (document.getElementById('allListings')) {
                applyFilters();
            }
        } catch (error) {
            console.error("Error loading listings from Firebase:", error);
            state.listings = MOCK_LISTINGS;
        }
    } else {
        const userListings = JSON.parse(localStorage.getItem('my_listings') || '[]');
        state.listings = [...userListings, ...MOCK_LISTINGS];
    }
}

// DOM Elements
const app = document.getElementById('app');
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const closeModal = document.querySelector('.close-modal');
const loginForm = document.getElementById('loginForm');
const navLinks = document.querySelectorAll('.nav-item');

// Router
function navigate(view) {
    state.view = view;

    // Update Nav
    navLinks.forEach(link => {
        if (link.dataset.page === view) link.classList.add('active');
        else link.classList.remove('active');
    });

    render();
    window.scrollTo(0, 0);
}

// Render Views
function render() {
    app.innerHTML = '';

    switch (state.view) {
        case 'home':
            renderHome();
            break;
        case 'buy':
            state.filters.status = 'Buy';
            renderListingsPage();
            break;
        case 'sell':
            renderSellPage();
            break;
        case 'plans':
            renderPlansPage();
            break;
        case 'services':
            renderServicesPage();
            break;
        default:
            renderHome();
    }
    updateAuthUI();
}

function renderHome() {
    const heroSection = document.createElement('section');
    heroSection.className = 'hero';
    heroSection.innerHTML = `
        <div class="hero-bg"></div>
        <div class="hero-overlay"></div>
        <div class="container hero-content">
            <h1>Find Your Dream Home</h1>
            <p>Search properties in Tamil Nadu & Bangalore</p>
            
            <div class="hero-search">
                <div class="search-select">
                    <select id="homeCityFilter" style="width:100%; height:100%; border:none; outline:none;">
                        <option value="">All Cities</option>
                        ${CITIES.map(city => `<option value="${city}">${city}</option>`).join('')}
                    </select>
                </div>
                <div class="search-input">
                    <input type="text" id="homePincodeFilter" placeholder="Enter Pincode (e.g. 600001)" style="width:100%;">
                </div>
                <button class="btn btn-primary" onclick="handleHomeSearch()">Search</button>
            </div>
        </div>
    `;

    const tickerSection = document.createElement('div');
    tickerSection.className = 'ticker-wrap';
    tickerSection.innerHTML = `
        <div class="ticker-heading">Trusted Channel Partners</div>
        <div class="ticker">
            <div class="ticker-item"><span class="material-icons-round">apartment</span> CASAGRAND</div>
            <div class="ticker-item"><span class="material-icons-round">domain</span> GODREJ PROPERTIES</div>
            <div class="ticker-item"><span class="material-icons-round">business</span> SOBHA</div>
            <div class="ticker-item"><span class="material-icons-round">foundation</span> PRESTIGE GROUP</div>
            <div class="ticker-item"><span class="material-icons-round">location_city</span> BRIGADE</div>
            <div class="ticker-item"><span class="material-icons-round">apartment</span> CASAGRAND</div> <!-- Repeat for infinite loop -->
            <div class="ticker-item"><span class="material-icons-round">domain</span> GODREJ PROPERTIES</div>
            <div class="ticker-item"><span class="material-icons-round">business</span> SOBHA</div>
        </div>
    `;

    const listingsSection = document.createElement('section');
    listingsSection.className = 'container';
    listingsSection.innerHTML = `
        <h2 class="section-title" style="margin: 40px 0 20px;">Featured Properties</h2>
        <div class="listings-grid" id="featuredListings"></div>
    `;

    app.appendChild(heroSection);
    app.appendChild(tickerSection);
    app.appendChild(listingsSection);

    renderCards(state.listings.slice(0, 8), document.getElementById('featuredListings'));
}

function renderListingsPage() {
    const layout = document.createElement('div');
    layout.className = 'container page-layout';

    // Sidebar
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
        <h3 style="margin-bottom: 20px;">Filters</h3>
        
        <div class="filter-group">
            <label>Location</label>
            <select class="form-control" id="sidebarCity" onchange="applyFilters()">
                <option value="">All Cities</option>
                ${CITIES.map(c => `<option value="${c}" ${state.filters.city === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
        </div>

        <div class="filter-group">
            <label>Facing</label>
            <select class="form-control" id="sidebarFacing" onchange="applyFilters()">
                <option value="">Any</option>
                <option value="North" ${state.filters.facing === 'North' ? 'selected' : ''}>North</option>
                <option value="South" ${state.filters.facing === 'South' ? 'selected' : ''}>South</option>
                <option value="East" ${state.filters.facing === 'East' ? 'selected' : ''}>East</option>
                <option value="West" ${state.filters.facing === 'West' ? 'selected' : ''}>West</option>
                <option value="North-East" ${state.filters.facing === 'North-East' ? 'selected' : ''}>North-East</option>
                <option value="North-West" ${state.filters.facing === 'North-West' ? 'selected' : ''}>North-West</option>
                <option value="South-East" ${state.filters.facing === 'South-East' ? 'selected' : ''}>South-East</option>
                <option value="South-West" ${state.filters.facing === 'South-West' ? 'selected' : ''}>South-West</option>
            </select>
        </div>

        <div class="filter-group">
            <label>Pincode</label>
            <input type="text" class="form-control" id="sidebarPincode" placeholder="Search Pincode" value="${state.filters.pincode}" oninput="applyFilters()">
        </div>

        <div class="filter-group">
            <label>Property Type</label>
            <div class="filter-option"><input type="checkbox" checked> Apartment</div>
            <div class="filter-option"><input type="checkbox" checked> Villa</div>
            <div class="filter-option"><input type="checkbox" checked> Plot</div>
        </div>

        <div class="filter-group">
            <label>Price Range</label>
            <input type="range" class="range-slider" min="0" max="1000" oninput="applyFilters()">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-light);">
                <span>0</span>
                <span>10 Cr+</span>
            </div>
        </div>
    `;

    // Main Content
    const main = document.createElement('main');
    main.className = 'main-content';
    main.innerHTML = `
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <h2>Properties for ${state.filters.status}</h2>
            <span style="color: var(--text-light);" id="resultCount">Showing all results</span>
        </div>
        <div class="listings-grid" id="allListings"></div>
    `;

    layout.appendChild(sidebar);
    layout.appendChild(main);
    app.appendChild(layout);

    applyFilters(); // Initial render of cards
}

function applyFilters() {
    // Get values from sidebar if it exists
    const cityEl = document.getElementById('sidebarCity');
    const pinEl = document.getElementById('sidebarPincode');
    const facingEl = document.getElementById('sidebarFacing');

    if (cityEl) state.filters.city = cityEl.value;
    if (pinEl) state.filters.pincode = pinEl.value;
    if (facingEl) state.filters.facing = facingEl.value;

    const filtered = state.listings.filter(item => {
        const matchStatus = item.status === state.filters.status;
        const matchCity = state.filters.city ? item.location === state.filters.city : true;
        const matchPincode = state.filters.pincode ? item.pincode.includes(state.filters.pincode) : true;
        const matchFacing = state.filters.facing ? item.facing === state.filters.facing : true;
        return matchStatus && matchCity && matchPincode && matchFacing;
    });

    const container = document.getElementById('allListings');
    const countLabel = document.getElementById('resultCount');

    if (container) {
        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <span class="material-icons-round" style="font-size: 48px; color: #ddd;">search_off</span>
                    <p>No properties found matching your criteria.</p>
                </div>`;
        } else {
            renderCards(filtered, container);
        }
    }
    if (countLabel) countLabel.textContent = `Showing ${filtered.length} results`;
}

function renderPlansPage() {
    const container = document.createElement('div');
    container.className = 'container';
    container.style.marginTop = '40px';

    container.innerHTML = `
        <div style="text-align: center; max-width: 700px; margin: 0 auto;">
            <h2 class="section-title">Choose Your Plan</h2>
            <p style="color: var(--text-light); font-size: 1.1rem;">Save brokerage and get premium services with our subscription plans.</p>
        </div>
        
        <div class="plans-grid">
            <div class="plan-card">
                <h3>Free</h3>
                <div class="plan-price">₹0</div>
                <ul class="plan-features">
                    <li><i class="material-icons-round">check_circle</i> Post 1 Property</li>
                    <li><i class="material-icons-round">check_circle</i> Basic Visibility</li>
                    <li><i class="material-icons-round">check_circle</i> 5 Contact Views</li>
                </ul>
                <button class="btn btn-outline btn-full">Current Plan</button>
            </div>
            
            <div class="plan-card featured">
                <div class="plan-badge">MOST POPULAR</div>
                <h3>Relax Plan</h3>
                <div class="plan-price">₹2,999</div>
                <ul class="plan-features">
                    <li><i class="material-icons-round">check_circle</i> Relationship Manager</li>
                    <li><i class="material-icons-round">check_circle</i> Property Promotion</li>
                    <li><i class="material-icons-round">check_circle</i> Rental Agreement</li>
                    <li><i class="material-icons-round">check_circle</i> Unlimited Contacts</li>
                </ul>
                <button class="btn btn-primary btn-full" onclick="alert('Payment Gateway Mock: Redirecting to Razorpay/Stripe...')">Subscribe Now</button>
            </div>
            
            <div class="plan-card">
                <h3>MoneyBack</h3>
                <div class="plan-price">₹5,999</div>
                <ul class="plan-features">
                    <li><i class="material-icons-round">check_circle</i> Guaranteed Tenant</li>
                    <li><i class="material-icons-round">check_circle</i> Field Assistant</li>
                    <li><i class="material-icons-round">check_circle</i> Photoshoot</li>
                    <li><i class="material-icons-round">check_circle</i> 100% Moneyback Guarantee</li>
                </ul>
                <button class="btn btn-outline btn-full" onclick="alert('Payment Gateway Mock: Redirecting to Razorpay/Stripe...')">Subscribe Now</button>
            </div>
        </div>
    `;

    app.appendChild(container);
}

function renderSellPage() {
    // Redirect to post property or show options
    const container = document.createElement('div');
    container.className = 'container';
    container.style.marginTop = '40px';
    container.style.textAlign = 'center';

    container.innerHTML = `
        <h2 class="section-title">Sell or Rent Your Property</h2>
        <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 40px;">
            <div class="listing-card" style="padding: 40px; width: 300px;" onclick="window.open('post.html', '_blank')">
                <span class="material-icons-round" style="font-size: 48px; color: var(--primary);">person</span>
                <h3>For Owners</h3>
                <p>Post your property for free and find tenants/buyers quickly.</p>
            </div>
            <div class="listing-card" style="padding: 40px; width: 300px;" onclick="window.open('post.html', '_blank')">
                <span class="material-icons-round" style="font-size: 48px; color: var(--secondary);">engineering</span>
                <h3>For Builders</h3>
                <p>List your projects and reach millions of buyers.</p>
            </div>
            <div class="listing-card" style="padding: 40px; width: 300px;" onclick="window.open('post.html', '_blank')">
                <span class="material-icons-round" style="font-size: 48px; color: var(--accent);">support_agent</span>
                <h3>For Agents</h3>
                <p>Manage your portfolio and get verified leads.</p>
            </div>
        </div>
    `;
    app.appendChild(container);
}

function renderServicesPage() {
    const container = document.createElement('div');
    container.className = 'container';
    container.style.marginTop = '40px';

    container.innerHTML = `
        <h2 class="section-title">Home Services</h2>
        <div class="listings-grid">
            <div class="listing-card" style="padding: 20px;">
                <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=400&q=80" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:15px;">
                <h3>Rental Agreement</h3>
                <p>Legal rental agreements delivered to your doorstep.</p>
            </div>
            <div class="listing-card" style="padding: 20px;">
                <img src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=400&q=80" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:15px;">
                <h3>Packers & Movers</h3>
                <p>Safe and secure shifting with best quotes.</p>
            </div>
            <div class="listing-card" style="padding: 20px;">
                <img src="https://images.unsplash.com/photo-1581578731117-104f2a41272c?auto=format&fit=crop&w=400&q=80" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:15px;">
                <h3>Painting & Cleaning</h3>
                <p>Professional home cleaning and painting services.</p>
            </div>
        </div>
    `;
    app.appendChild(container);
}

// Requirement Modal
const requirementModal = document.getElementById('requirementModal');
function openRequirementModal() {
    requirementModal.classList.add('active');
}
function closeRequirementModal() {
    requirementModal.classList.remove('active');
}

// Property Detail Modal
// Property Detail Modal
const propertyModal = document.getElementById('propertyModal');
let currentImageIndex = 0;
let currentListingImages = [];

function openPropertyModal(item) {
    // Handle Images
    currentListingImages = item.images && item.images.length > 0 ? item.images : [item.image];
    currentImageIndex = 0;
    updateModalImage();

    document.getElementById('modalTitle').textContent = item.title;
    document.getElementById('modalPrice').textContent = `₹ ${item.price}`;
    document.getElementById('modalLocation').textContent = item.location;
    document.getElementById('modalPincode').textContent = item.pincode || 'N/A';
    document.getElementById('modalBeds').textContent = item.beds;
    document.getElementById('modalBaths').textContent = item.baths;
    document.getElementById('modalSqft').textContent = item.sqft;
    document.getElementById('modalType').textContent = item.type;
    document.getElementById('modalFacing').textContent = item.facing || 'Not Specified';
    document.getElementById('modalDescription').textContent = item.description || 'No description available.';

    propertyModal.classList.add('active');
}

function updateModalImage() {
    const imgElement = document.getElementById('modalImage');
    const counterElement = document.getElementById('imageCounter');

    if (currentListingImages.length > 0) {
        imgElement.src = currentListingImages[currentImageIndex];
        counterElement.textContent = `${currentImageIndex + 1} / ${currentListingImages.length}`;
        counterElement.style.display = currentListingImages.length > 1 ? 'block' : 'none';
    }
}

function nextImage() {
    if (currentListingImages.length > 1) {
        currentImageIndex = (currentImageIndex + 1) % currentListingImages.length;
        updateModalImage();
    }
}

function prevImage() {
    if (currentListingImages.length > 1) {
        currentImageIndex = (currentImageIndex - 1 + currentListingImages.length) % currentListingImages.length;
        updateModalImage();
    }
}

function closePropertyModal() {
    propertyModal.classList.remove('active');
}

// Update renderCards to use openPropertyModal
function renderCards(items, container) {
    container.innerHTML = items.map(item => {
        // Store item data in a data attribute to retrieve later
        // But simpler to just pass the index or ID if we had a robust store.
        // For now, we'll inline the click handler with a lookup, or attach event listeners.
        // Let's use a global lookup for simplicity in this prototype.
        const itemId = item.id || Math.random().toString(36).substr(2, 9);
        item.id = itemId; // Ensure ID
        window[`item_${itemId}`] = item;

        return `
        <div class="listing-card" onclick="openPropertyModal(window['item_${itemId}'])">
            <div class="card-image">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <span class="card-badge">${item.status}</span>
                <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">
                    <span class="material-icons-round" style="font-size: 14px; vertical-align: middle;">photo_camera</span> 5
                </div>
            </div>
            <div class="card-content">
                <div class="card-price">₹ ${item.price}</div>
                <div class="card-title">${item.title}</div>
                <div class="card-location">
                    <span class="material-icons-round" style="font-size: 16px;">location_on</span>
                    ${item.location} ${item.pincode ? '- ' + item.pincode : ''}
                </div>
                <div class="card-features">
                    <div class="feature">
                        <span class="material-icons-round" style="font-size: 16px;">bed</span>
                        ${item.beds} Beds
                    </div>
                    <div class="feature">
                        <span class="material-icons-round" style="font-size: 16px;">bathtub</span>
                        ${item.baths} Baths
                    </div>
                    <div class="feature">
                        <span class="material-icons-round" style="font-size: 16px;">square_foot</span>
                        ${item.sqft} sqft
                    </div>
                </div>
            </div>
        </div>
    `}).join('');
}

// Actions
function handleHomeSearch() {
    const city = document.getElementById('homeCityFilter').value;
    const pincode = document.getElementById('homePincodeFilter').value;

    state.filters.city = city;
    state.filters.pincode = pincode;
    navigate('buy');
}

function openLogin() {
    if (loginModal) {
        loginModal.classList.add('active');
    }
}

function closeLogin() {
    loginModal.classList.remove('active');
}

function updateAuthUI() {
    if (state.user) {
        loginBtn.innerHTML = `
            <div class="user-dropdown">
                <button class="btn btn-primary" onclick="toggleUserMenu(event)">
                    <span class="material-icons-round">account_circle</span> ${state.user.phone} 
                    <span class="material-icons-round" style="font-size: 16px; margin-left: 5px;">expand_more</span>
                </button>
                <div class="dropdown-menu" id="userDropdownMenu">
                    <a href="#" onclick="showProfile()"><span class="material-icons-round">person</span> Profile</a>
                    <a href="#" onclick="navigate('plans')"><span class="material-icons-round">diamond</span> Current Plan</a>
                    <a href="#" onclick="window.scrollTo(0, document.body.scrollHeight)"><span class="material-icons-round">contact_support</span> Contact Us</a>
                    <a href="#" onclick="alert('Help Center coming soon!')"><span class="material-icons-round">help</span> Help</a>
                    <div class="divider"></div>
                    <a href="#" onclick="logout()" style="color: var(--primary);"><span class="material-icons-round">logout</span> Logout</a>
                </div>
            </div>
        `;
        // Remove default onclick
        loginBtn.onclick = null;
    } else {
        loginBtn.innerHTML = 'Login / Register';
        loginBtn.onclick = openLogin;
    }
}

function toggleUserMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('userDropdownMenu');
    menu.classList.toggle('active');
}

function logout() {
    // Removed confirm dialog to fix user reported issue
    state.user = null;
    localStorage.removeItem('user');
    updateAuthUI();
}

function showProfile() {
    alert(`User Profile:\nPhone: ${state.user.phone}\nMember since: ${new Date().toLocaleDateString()}`);
}

// Close dropdown when clicking outside
window.addEventListener('click', () => {
    const menu = document.getElementById('userDropdownMenu');
    if (menu) menu.classList.remove('active');
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadListings();
    navigate('home');
    updateAuthUI(); // Ensure UI matches auth state

    // Nav Links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.dataset.page;
            if (page) navigate(page);
        });
    });

    // Login Modal
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', openLogin);
    }
    // closeModal.addEventListener('click', closeLogin); // Removed to avoid conflict with multiple modals
    // Close Modals on Outside Click
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeLogin();
        if (e.target === requirementModal) closeRequirementModal();
    });

    if (registerForm) {
        let regConfirmationResult;

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const phoneInput = document.getElementById('regPhone');
            const otpInput = document.getElementById('regOtp');
            const submitBtn = document.getElementById('regSubmitBtn');
            const otpGroup = document.getElementById('regOtpGroup');
            const phoneGroup = document.getElementById('regPhoneGroup');
            const notify = document.getElementById('notifyMail').checked;

            if (otpGroup.style.display === 'none') {
                // Step 1: Send OTP
                const phoneNumber = "+91" + phoneInput.value;

                if (!useFirebase) {
                    alert("Phone Login requires Firebase. Please enable it.");
                    return;
                }

                if (window.location.protocol === 'file:') {
                    alert("Phone Authentication requires a server (http:// or https://). It will not work with file://. Please use a local server (like VS Code Live Server) or deploy the app.");
                    return;
                }

                // Setup Recaptcha
                if (!window.regRecaptchaVerifier) {
                    window.regRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('reg-recaptcha-container', {
                        'size': 'invisible'
                    });
                }

                try {
                    regConfirmationResult = await auth.signInWithPhoneNumber(phoneNumber, window.regRecaptchaVerifier);
                    otpGroup.style.display = 'block';
                    phoneGroup.style.display = 'none';
                    submitBtn.textContent = 'Verify & Sign Up';
                    alert("OTP Sent to " + phoneNumber);
                } catch (error) {
                    console.error("Error sending OTP:", error);
                    alert("Error sending OTP: " + error.message);
                    if (window.regRecaptchaVerifier) {
                        window.regRecaptchaVerifier.render().then(function (widgetId) {
                            grecaptcha.reset(widgetId);
                        });
                    }
                }

            } else {
                // Step 2: Verify OTP
                const code = otpInput.value;
                try {
                    const result = await regConfirmationResult.confirm(code);
                    const user = result.user;

                    // Save user profile
                    await db.collection('users').doc(user.uid).set({
                        uid: user.uid,
                        name: name,
                        phone: user.phoneNumber,
                        notify: notify,
                        createdAt: new Date().toISOString()
                    }, { merge: true });

                    state.user = {
                        uid: user.uid,
                        name: name,
                        phone: user.phoneNumber
                    };
                    localStorage.setItem('user', JSON.stringify(state.user));

                    alert('Registration Successful! Welcome ' + name);
                    closeLogin();
                    updateAuthUI();

                } catch (error) {
                    console.error("Error verifying OTP:", error);
                    alert("Invalid OTP. Please try again.");
                }
            }
        });
    }

    // Login Form Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        let loginConfirmationResult;

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const phoneInput = document.getElementById('loginPhone');
            const otpInput = document.getElementById('loginOtp');
            const submitBtn = document.getElementById('loginSubmitBtn');
            const otpGroup = document.getElementById('loginOtpGroup');
            const phoneGroup = document.getElementById('loginPhoneGroup');

            if (otpGroup.style.display === 'none') {
                // Step 1: Send OTP
                const phoneNumber = "+91" + phoneInput.value;

                if (!useFirebase) {
                    alert("Phone Login requires Firebase. Please enable it.");
                    return;
                }

                if (window.location.protocol === 'file:') {
                    alert("Phone Authentication requires a server (http:// or https://). It will not work with file://. Please use a local server (like VS Code Live Server) or deploy the app.");
                    return;
                }

                // Setup Recaptcha
                if (!window.loginRecaptchaVerifier) {
                    window.loginRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                        'size': 'invisible'
                    });
                }

                try {
                    loginConfirmationResult = await auth.signInWithPhoneNumber(phoneNumber, window.loginRecaptchaVerifier);
                    otpGroup.style.display = 'block';
                    phoneGroup.style.display = 'none';
                    submitBtn.textContent = 'Verify & Login';
                    alert("OTP Sent to " + phoneNumber);
                } catch (error) {
                    console.error("Error sending OTP:", error);
                    alert("Error sending OTP: " + error.message);
                    if (window.loginRecaptchaVerifier) {
                        window.loginRecaptchaVerifier.render().then(function (widgetId) {
                            grecaptcha.reset(widgetId);
                        });
                    }
                }
            } else {
                // Step 2: Verify OTP
                const code = otpInput.value;
                try {
                    const result = await loginConfirmationResult.confirm(code);
                    const user = result.user;

                    // Check if user exists in DB
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    let userName = "User";

                    if (userDoc.exists) {
                        userName = userDoc.data().name;
                    } else {
                        // Create basic profile if not exists
                        await db.collection('users').doc(user.uid).set({
                            uid: user.uid,
                            phone: user.phoneNumber,
                            createdAt: new Date().toISOString()
                        }, { merge: true });
                    }

                    state.user = {
                        uid: user.uid,
                        name: userName,
                        phone: user.phoneNumber
                    };
                    localStorage.setItem('user', JSON.stringify(state.user));

                    alert('Login Successful! Welcome back ' + userName);
                    closeLogin();
                    updateAuthUI();

                } catch (error) {
                    console.error("Error verifying OTP:", error);
                    alert("Invalid OTP. Please try again.");
                }
            }
        });
    }

    // Requirement Form
    const reqForm = document.getElementById('requirementForm');
    if (reqForm) {
        reqForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Requirement Submitted! We will contact you shortly.');
            closeRequirementModal();
        });
    }

    // Toggle Login/Register
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');

    if (showRegister) {
        showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        });
    }

    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
            const icon = mobileBtn.querySelector('span');
            if (navLinksContainer.classList.contains('active')) {
                icon.textContent = 'close';
            } else {
                icon.textContent = 'menu';
            }
        });
    }
});

// Seed Database Function
async function seedDatabase() {
    if (!useFirebase || !db) {
        alert("Firebase is not connected! Cannot seed database.");
        return;
    }

    if (!confirm("Are you sure you want to upload " + MOCK_LISTINGS.length + " sample listings to your live database?")) {
        return;
    }

    console.log("Starting Seed...");
    let count = 0;

    try {
        const batch = db.batch();

        // Firestore batches allow up to 500 operations. MOCK_LISTINGS is 50.
        MOCK_LISTINGS.forEach((listing) => {
            const docRef = db.collection('properties').doc(); // Auto-ID
            // Clean up data if needed (remove ID as Firestore generates one, or keep it as legacy_id)
            const { id, ...listingData } = listing;

            // Add timestamp
            listingData.createdAt = new Date().toISOString();
            // Ensure images array exists
            if (!listingData.images) {
                listingData.images = [listingData.image];
            }

            batch.set(docRef, listingData);
            count++;
        });

        await batch.commit();
        alert(`Successfully uploaded ${count} listings to Firebase! Refresh the page to see them.`);
        loadListings(); // Reload to show new data

    } catch (error) {
        console.error("Error seeding database:", error);
        alert("Error uploading data: " + error.message);
    }
}
