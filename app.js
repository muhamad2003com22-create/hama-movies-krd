// =====================================================
// Firebase Configuration
// =====================================================
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, query } from 'https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBTSV-hl_jio9wsOFZLF4EKfczGhK67GGA",
  authDomain: "project-12f69ffd-7054-4686-937.firebaseapp.com",
  projectId: "project-12f69ffd-7054-4686-937",
  storageBucket: "project-12f69ffd-7054-4686-937.firebasestorage.app",
  messagingSenderId: "2690478778",
  appId: "1:2690478778:web:9e4f40749beeefef2dc883",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =====================================================
// Auth — Simple password stored in sessionStorage
// =====================================================
const PASSWORD = 'Hama11211';
const AUTH_KEY = 'movies_auth';

function isLoggedIn() {
  return sessionStorage.getItem(AUTH_KEY) === 'yes';
}

function login() {
  sessionStorage.setItem(AUTH_KEY, 'yes');
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  window.location.href = 'login.html';
}

// =====================================================
// Page Detection
// =====================================================
const path = window.location.pathname;
const page = path.split('/').pop() || 'index.html';

if (page === 'login.html') {
  initLoginPage();
} else if (page === 'add.html') {
  guardPage();
  initAddPage();
} else {
  // index.html or root
  guardPage();
  initDashboard();
}

// =====================================================
// Guard — redirect to login if not authenticated
// =====================================================
function guardPage() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

// =====================================================
// LOGIN PAGE
// =====================================================
function initLoginPage() {
  // If already logged in, go to dashboard
  if (isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;

    if (password === PASSWORD) {
      login();
      window.location.href = 'index.html';
    } else {
      errorEl.textContent = 'پاسۆردەکە هەڵەیە! (Invalid Password)';
      errorEl.style.display = 'block';
      btn.disabled = false;
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
    }
  });
}

// =====================================================
// DASHBOARD PAGE
// =====================================================
function initDashboard() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  loadMovies();
  setupDeleteModal();
}

async function loadMovies() {
  const grid = document.getElementById('movies-grid');
  const filterSection = document.getElementById('filter-section');

  try {
    const moviesRef = collection(db, 'movies');
    const snapshot = await getDocs(query(moviesRef));

    const movies = [];
    snapshot.forEach((d) => {
      movies.push({ id: d.id, ...d.data() });
    });

    // Sort newest first
    movies.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

    renderMovies(movies, grid, filterSection);
  } catch (err) {
    console.error('Error loading movies:', err);
    grid.innerHTML = `<div class="empty-state animate-fade-in">
      <h3>کێشەیەک ڕوویدا</h3>
      <p>نەتوانرا فیلمەکان بار بکرێن. تکایە دووبارە هەوڵ بدە.</p>
    </div>`;
  }
}

let activeGenre = 'All';
let allMovies = [];

function renderMovies(movies, grid, filterSection) {
  allMovies = movies;

  // Render filter buttons
  const genres = Array.from(new Set(movies.map((m) => m.genre)));

  if (movies.length > 0) {
    filterSection.style.display = 'flex';
    renderFilters(genres, filterSection);
  } else {
    filterSection.style.display = 'none';
  }

  renderGrid(movies, grid);
}

function renderFilters(genres, container) {
  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = `filter-btn ${activeGenre === 'All' ? 'active' : ''}`;
  allBtn.id = 'filter-all';
  allBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> هەمووی`;
  allBtn.addEventListener('click', () => {
    activeGenre = 'All';
    renderFilters(genres, container);
    renderGrid(allMovies, document.getElementById('movies-grid'));
  });
  container.appendChild(allBtn);

  genres.forEach((genre) => {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${activeGenre === genre ? 'active' : ''}`;
    btn.id = `filter-${genre.toLowerCase().replace(/\s/g, '-')}`;
    btn.textContent = genre;
    btn.addEventListener('click', () => {
      activeGenre = genre;
      renderFilters(genres, container);
      renderGrid(allMovies, document.getElementById('movies-grid'));
    });
    container.appendChild(btn);
  });
}

function renderGrid(movies, grid) {
  const filtered = activeGenre === 'All' ? movies : movies.filter((m) => m.genre === activeGenre);

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state animate-fade-in">
      <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16l2 2 4-4M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 .27"></path></svg>
      <h3>هیچ فیلمێک نییە</h3>
      <p>سەرەتا فیلمێک زیاد بکە بۆ ئەوەی لێرە دەربکەوێت.</p>
      <a href="add.html" class="btn-primary">زیادکردنی فیلمی یەکەم</a>
    </div>`;
    return;
  }

  grid.innerHTML = '';
  filtered.forEach((movie, index) => {
    const card = document.createElement('div');
    card.className = 'glass-panel movie-card animate-fade-in';
    card.style.animationDelay = `${index * 0.07}s`;
    card.dataset.id = movie.id;
    card.innerHTML = `
      <div class="movie-image-container">
        <img src="${escapeHtml(movie.imageUrl)}" alt="${escapeHtml(movie.title)}" class="movie-image" loading="lazy" />
      </div>
      <button class="delete-btn" data-id="${escapeHtml(movie.id)}" title="سڕینەوە">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
      </button>
      <div class="movie-info">
        <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
        <span class="movie-genre">${escapeHtml(movie.genre)}</span>
      </div>
    `;
    grid.appendChild(card);
  });

  // Attach delete listeners
  grid.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

// =====================================================
// DELETE MODAL
// =====================================================
let pendingDeleteId = null;

function setupDeleteModal() {
  const cancelBtn = document.getElementById('cancel-delete');
  const confirmBtn = document.getElementById('confirm-delete');

  if (cancelBtn) cancelBtn.addEventListener('click', closeDeleteModal);
  if (confirmBtn) confirmBtn.addEventListener('click', confirmDelete);
}

function openDeleteModal(id) {
  pendingDeleteId = id;
  document.getElementById('delete-modal').style.display = 'flex';
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('delete-modal').style.display = 'none';
}

async function confirmDelete() {
  if (!pendingDeleteId) return;

  const confirmBtn = document.getElementById('confirm-delete');
  confirmBtn.disabled = true;
  confirmBtn.textContent = 'خەریکی سڕینەوەیە...';

  try {
    await deleteDoc(doc(db, 'movies', pendingDeleteId));
    closeDeleteModal();
    allMovies = allMovies.filter((m) => m.id !== pendingDeleteId);
    const genres = Array.from(new Set(allMovies.map((m) => m.genre)));
    renderFilters(genres, document.getElementById('filter-section'));
    renderGrid(allMovies, document.getElementById('movies-grid'));
    if (allMovies.length === 0) {
      document.getElementById('filter-section').style.display = 'none';
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('کێشەیەک ڕوویدا لە سڕینەوەدا. دووبارە هەوڵ بدە.');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'سڕینەوە';
  }
}

// =====================================================
// ADD MOVIE PAGE
// =====================================================
function initAddPage() {
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('image');
  const preview = document.getElementById('image-preview');
  const placeholder = document.getElementById('upload-placeholder');
  const form = document.getElementById('add-form');
  const submitBtn = document.getElementById('submit-btn');

  if (!form) return;

  // Click on upload area → open file picker
  uploadArea.addEventListener('click', () => fileInput.click());

  // Preview image on select
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      preview.src = url;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
    }
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--accent-color)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      // Assign to file input via DataTransfer
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      const url = URL.createObjectURL(file);
      preview.src = url;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
    }
  });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const genre = document.getElementById('genre').value;
    const image = fileInput.files[0];
    const errorEl = document.getElementById('add-error');
    const successEl = document.getElementById('add-success');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    if (!title || !genre || !image) {
      errorEl.textContent = 'تکایە هەموو خانەکان پڕ بکەرەوە!';
      errorEl.style.display = 'block';
      return;
    }

    // Check image size (max 700KB to stay within Firestore 1MB limit)
    if (image.size > 700 * 1024) {
      errorEl.textContent = 'وێنەکە زۆر گەورەیە! تکایە وێنەیەک کەمتر لە 700KB هەڵبژێرە.';
      errorEl.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> خەریکی پاشەکەوتکردن...`;

    try {
      // Convert image to base64
      const imageUrl = await toBase64(image);

      // Save to Firestore (base64 image stored directly)
      const id = crypto.randomUUID();
      await setDoc(doc(db, 'movies', id), {
        title,
        genre,
        imageUrl,
        addedAt: new Date().toISOString(),
      });

      // Success
      successEl.style.display = 'block';
      form.reset();
      preview.style.display = 'none';
      placeholder.style.display = 'flex';
      preview.src = '';

      // Redirect after 1.5s
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      errorEl.textContent = 'کێشەیەک ڕوویدا. دووبارە هەوڵ بدە: ' + err.message;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> پاشەکەوتکردن`;
    }
  });
}

// =====================================================
// Utility
// =====================================================

// Convert image file to base64 string
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('نەتوانرا وێنەکە بخوێندرێتەوە'));
    reader.readAsDataURL(file);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
