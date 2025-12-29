// Fireminder - Main App
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  connectFirestoreEmulator 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { 
  getAuth, 
  signInWithPopup, 
  signInAnonymously,
  signOut as firebaseSignOut,
  GoogleAuthProvider, 
  onAuthStateChanged,
  connectAuthEmulator 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// --- Environment detection ---
const USE_EMULATOR = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// --- Firebase config ---
const firebaseConfig = USE_EMULATOR 
  ? {
      // Demo project for local emulator
      apiKey: "demo-key",
      authDomain: "demo-fireminder.firebaseapp.com",
      projectId: "demo-fireminder",
    }
  : {
      // Production Firebase project
      apiKey: "AIzaSyCX-vVV222auMSpocxd99IdAOYiVgvD2kY",
      authDomain: "fireminder-63450.firebaseapp.com",
      projectId: "fireminder-63450",
      storageBucket: "fireminder-63450.firebasestorage.app",
      messagingSenderId: "772977210766",
      appId: "1:772977210766:web:57d1a1a47aea47e878a0df",
      measurementId: "G-2SQFMP92BP"
    };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Connect to emulators in development
if (USE_EMULATOR) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  console.log('🔥 Connected to Firebase Emulators');
} else {
  console.log('🔥 Connected to Firebase Production');
}

// --- Fibonacci sequence helpers ---
const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];

function getFibIndex(value) {
  const idx = FIBONACCI.indexOf(value);
  return idx === -1 ? 1 : idx; // Default to index 1 (value 2)
}

function getFibValue(index) {
  if (index < 0) return FIBONACCI[0];
  if (index >= FIBONACCI.length) return FIBONACCI[FIBONACCI.length - 1];
  return FIBONACCI[index];
}

function getShorterInterval(current) {
  const idx = getFibIndex(current);
  return getFibValue(idx - 1);
}

function getLongerInterval(current) {
  const idx = getFibIndex(current);
  return getFibValue(idx + 1);
}

// --- Date helpers ---

// Note: simulatedDateRef is created inside setup() for reactivity

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2 - d1;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

// --- Vue App ---
const { createApp, ref, computed, watch, onMounted } = Vue;

// --- Theme management ---
const THEMES = ['light', 'dark', 'ocean', 'forest', 'rose', 'ember'];

function getStoredTheme() {
  return localStorage.getItem('fireminder-theme') || 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('fireminder-theme', theme);
}

// Apply saved theme immediately
applyTheme(getStoredTheme());

createApp({
  setup() {
    // --- State ---
    const user = ref(null);
    const decks = ref([]);
    const cards = ref([]);
    const currentDeckId = ref(null);
    const showSidebar = ref(false);
    const showAddCard = ref(false);
    const showNewDeck = ref(false);
    const showMenu = ref(false);
    const showThemePicker = ref(false);
    const showDatePicker = ref(false);
    
    // Time travel - simulated date for testing
    const storedSimDate = localStorage.getItem('fireminder-simulated-date') || '';
    const simulatedDateRef = ref(storedSimDate);
    if (storedSimDate) {
      console.log('🕐 Restored simulated date:', storedSimDate);
    }
    
    const isEditing = ref(false);
    const selectedInterval = ref('default'); // 'shorter', 'default', 'longer'
    const currentTheme = ref(getStoredTheme());
    
    // Form state
    const newCardContent = ref('');
    const newCardDeckId = ref(null);
    const newDeckName = ref('');
    const newDeckEmoji = ref('📚');
    const newDeckInterval = ref(2);
    const newDeckLimit = ref(null); // null = unlimited
    const reflectionText = ref('');
    const editedContent = ref('');

    // --- Computed ---
    const currentDeck = computed(() => {
      if (!currentDeckId.value) return null;
      return decks.value.find(d => d.id === currentDeckId.value);
    });

    const currentDeckCards = computed(() => {
      if (!currentDeckId.value) return [];
      return cards.value.filter(c => c.deckId === currentDeckId.value);
    });

    // Helper functions using reactive simulatedDateRef
    function getToday() {
      if (simulatedDateRef.value) {
        return new Date(simulatedDateRef.value);
      }
      return new Date();
    }
    
    function getTodayFormatted() {
      return formatDate(getToday());
    }
    
    const effectiveToday = computed(() => getTodayFormatted());
    const isTimeTraveling = computed(() => !!simulatedDateRef.value);

    const dueCards = computed(() => {
      const today = effectiveToday.value;
      const deckCards = currentDeckCards.value.filter(c => !c.retired && !c.deleted);
      
      // Split into reviewed and never-reviewed
      const reviewed = deckCards.filter(c => c.lastReviewDate);
      const neverReviewed = deckCards.filter(c => !c.lastReviewDate);
      
      // Filter reviewed cards that are due (nextDueDate <= today)
      const dueReviewed = reviewed.filter(c => c.nextDueDate <= today);
      
      // Filter never-reviewed cards that are due (nextDueDate <= today)
      const dueNeverReviewed = neverReviewed.filter(c => c.nextDueDate <= today);
      
      // Sort reviewed by overdue ratio (most overdue first)
      dueReviewed.sort((a, b) => {
        const aOverdue = daysBetween(a.nextDueDate, today);
        const bOverdue = daysBetween(b.nextDueDate, today);
        const aRatio = aOverdue / a.currentInterval;
        const bRatio = bOverdue / b.currentInterval;
        return bRatio - aRatio; // Descending
      });
      
      // Sort never-reviewed by creation date (oldest first / FIFO)
      dueNeverReviewed.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Combine: overdue first, then never-reviewed that are due
      let queue = [...dueReviewed, ...dueNeverReviewed];
      
      // Apply queue limit
      const limit = currentDeck.value?.queueLimit;
      if (limit && limit > 0) {
        queue = queue.slice(0, limit);
      }
      
      return queue;
    });

    const currentCard = computed(() => {
      return dueCards.value[0] || null;
    });

    const currentInterval = computed(() => {
      if (!currentCard.value) return 2;
      return currentCard.value.currentInterval || currentDeck.value?.startingInterval || 2;
    });

    const shorterInterval = computed(() => getShorterInterval(currentInterval.value));
    const longerInterval = computed(() => getLongerInterval(currentInterval.value));

    const nextInterval = computed(() => {
      if (selectedInterval.value === 'shorter') return shorterInterval.value;
      if (selectedInterval.value === 'longer') return longerInterval.value;
      return getLongerInterval(currentInterval.value); // Default advances
    });

    const deckStats = computed(() => {
      const deckCards = currentDeckCards.value;
      const active = deckCards.filter(c => !c.retired && !c.deleted).length;
      const retired = deckCards.filter(c => c.retired).length;
      
      // Find next due card
      const today = formatDate(new Date());
      const futureCards = deckCards
        .filter(c => !c.retired && !c.deleted && c.nextDueDate > today)
        .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
      
      let nextDueIn = null;
      if (futureCards.length > 0) {
        nextDueIn = daysBetween(today, futureCards[0].nextDueDate);
      }
      
      return { active, retired, nextDueIn };
    });

    // --- Auth ---
    async function signIn() {
      try {
        if (USE_EMULATOR) {
          // Use anonymous auth in emulator for real auth token
          await signInAnonymously(auth);
        } else {
          await signInWithPopup(auth, provider);
        }
      } catch (error) {
        console.error('Sign in error:', error);
      }
    }
    
    async function signOut() {
      try {
        await firebaseSignOut(auth);
        // Clear local state
        decks.value = [];
        cards.value = [];
        currentDeckId.value = null;
        showSidebar.value = false;
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }

    // --- Firestore operations ---
    async function loadDecks() {
      if (!user.value) return;
      try {
        const decksRef = collection(db, 'users', user.value.uid, 'decks');
        const snapshot = await getDocs(decksRef);
        decks.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Select first deck if none selected
        if (!currentDeckId.value && decks.value.length > 0) {
          currentDeckId.value = decks.value[0].id;
        }
      } catch (error) {
        console.error('Error loading decks:', error);
      }
    }

    async function loadCards() {
      if (!user.value || !currentDeckId.value) return;
      try {
        const cardsRef = collection(db, 'users', user.value.uid, 'cards');
        const q = query(cardsRef, where('deckId', '==', currentDeckId.value));
        const snapshot = await getDocs(q);
        cards.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.error('Error loading cards:', error);
      }
    }

    async function createDeck() {
      // Validate first
      if (!user.value) {
        console.error('Cannot create deck: no user');
        showNewDeck.value = false;
        return;
      }
      if (!newDeckName.value.trim()) {
        console.error('Cannot create deck: no name provided');
        // Don't close panel - let user fix the issue
        return;
      }
      
      const deckId = `deck_${Date.now()}`;
      const deck = {
        name: newDeckName.value.trim(),
        emoji: newDeckEmoji.value,
        startingInterval: newDeckInterval.value,
        queueLimit: newDeckLimit.value,
        createdAt: new Date().toISOString(),
      };
      
      // Close panel immediately for better UX
      const deckName = newDeckName.value;
      newDeckName.value = '';
      newDeckEmoji.value = '📚';
      newDeckInterval.value = 2;
      newDeckLimit.value = null;
      showNewDeck.value = false;
      
      try {
        await setDoc(doc(db, 'users', user.value.uid, 'decks', deckId), deck);
        decks.value.push({ id: deckId, ...deck });
        currentDeckId.value = deckId;
      } catch (error) {
        console.error('Error creating deck:', error);
      }
    }

    async function createCard() {
      // Validate first
      if (!user.value) {
        console.error('Cannot create card: no user');
        showAddCard.value = false;
        return;
      }
      if (!newCardContent.value.trim()) {
        console.error('Cannot create card: no content');
        // Don't close panel - let user fix the issue
        return;
      }
      
      const deckId = newCardDeckId.value || currentDeckId.value;
      const deck = decks.value.find(d => d.id === deckId);
      const cardId = `card_${Date.now()}`;
      
      const startingInterval = deck?.startingInterval || 2;
      const firstDueDate = addDays(getToday(), startingInterval);
      
      const card = {
        deckId: deckId,
        content: newCardContent.value.trim(),
        currentInterval: startingInterval,
        createdAt: new Date().toISOString(),
        lastReviewDate: null,
        nextDueDate: formatDate(firstDueDate), // First review after starting interval
        retired: false,
        deleted: false,
        history: [],
      };
      
      // Close panel immediately for better UX
      newCardContent.value = '';
      showAddCard.value = false;
      
      try {
        await setDoc(doc(db, 'users', user.value.uid, 'cards', cardId), card);
        cards.value.push({ id: cardId, ...card });
      } catch (error) {
        console.error('Error creating card:', error);
      }
    }

    async function reviewCard() {
      if (!currentCard.value || !user.value) return;
      
      const card = currentCard.value;
      const today = getTodayFormatted();
      const isFirstReview = !card.lastReviewDate;
      
      // Calculate overdue decay
      let newInterval = nextInterval.value;
      if (!isFirstReview && card.nextDueDate < today) {
        const overdueDays = daysBetween(card.nextDueDate, today);
        const intervalsOverdue = Math.floor(overdueDays / card.currentInterval);
        
        // Drop one Fibonacci step per interval overdue
        let idx = getFibIndex(newInterval);
        idx = Math.max(0, idx - intervalsOverdue);
        const minInterval = currentDeck.value?.startingInterval || 2;
        const minIdx = getFibIndex(minInterval);
        idx = Math.max(minIdx, idx);
        newInterval = getFibValue(idx);
      }
      
      const nextDue = addDays(getToday(), newInterval);
      
      // Build history entry
      const historyEntry = {
        date: today,
        interval: newInterval,
        reflection: reflectionText.value.trim() || null,
      };
      
      const updates = {
        currentInterval: newInterval,
        lastReviewDate: today,
        nextDueDate: formatDate(nextDue),
        history: [...(card.history || []), historyEntry],
      };
      
      // If content was edited
      if (isEditing.value && editedContent.value !== card.content) {
        updates.content = editedContent.value;
        historyEntry.previousContent = card.content;
      }
      
      try {
        const cardRef = doc(db, 'users', user.value.uid, 'cards', card.id);
        await setDoc(cardRef, updates, { merge: true });
        
        // Update local state
        const idx = cards.value.findIndex(c => c.id === card.id);
        if (idx !== -1) {
          cards.value[idx] = { ...cards.value[idx], ...updates };
        }
        
        // Reset state
        reflectionText.value = '';
        selectedInterval.value = 'default';
        isEditing.value = false;
        editedContent.value = '';
        showMenu.value = false;
      } catch (error) {
        console.error('Error reviewing card:', error);
      }
    }

    async function retireCard() {
      if (!currentCard.value || !user.value) return;
      
      try {
        const cardRef = doc(db, 'users', user.value.uid, 'cards', currentCard.value.id);
        await setDoc(cardRef, { retired: true }, { merge: true });
        
        const idx = cards.value.findIndex(c => c.id === currentCard.value.id);
        if (idx !== -1) {
          cards.value[idx].retired = true;
        }
        showMenu.value = false;
      } catch (error) {
        console.error('Error retiring card:', error);
      }
    }

    async function deleteCard() {
      if (!currentCard.value || !user.value) return;
      if (!confirm('Delete this card permanently?')) return;
      
      try {
        const cardRef = doc(db, 'users', user.value.uid, 'cards', currentCard.value.id);
        await deleteDoc(cardRef);
        
        cards.value = cards.value.filter(c => c.id !== currentCard.value.id);
        showMenu.value = false;
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }

    function startEditing() {
      if (!currentCard.value) return;
      editedContent.value = currentCard.value.content;
      isEditing.value = true;
      showMenu.value = false;
    }

    function cancelEditing() {
      isEditing.value = false;
      editedContent.value = '';
    }

    function selectDeck(deckId) {
      currentDeckId.value = deckId;
      showSidebar.value = false;
    }

    function openAddCard() {
      newCardDeckId.value = currentDeckId.value;
      showAddCard.value = true;
    }

    function applySimulatedDate(dateStr) {
      simulatedDateRef.value = dateStr || '';
      localStorage.setItem('fireminder-simulated-date', dateStr || '');
      console.log('🕐 Simulated date:', dateStr || 'REAL TIME');
      // Cards are automatically recalculated via reactivity
    }
    
    function clearSimulatedDate() {
      applySimulatedDate('');
    }

    function setTheme(theme) {
      currentTheme.value = theme;
      applyTheme(theme);
      showThemePicker.value = false;
    }

    // --- Lifecycle ---
    onMounted(() => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        user.value = firebaseUser;
        if (firebaseUser) {
          await loadDecks();
        }
      });
      
      // Auto-login for emulator demo using anonymous auth
      if (USE_EMULATOR) {
        setTimeout(async () => {
          if (!user.value) {
            try {
              await signInAnonymously(auth);
              console.log('🔥 Signed in anonymously for demo');
            } catch (error) {
              console.error('Auto-login failed:', error);
            }
          }
        }, 300);
      }
    });

    // Watch for deck changes
    watch(currentDeckId, () => {
      if (currentDeckId.value) {
        loadCards();
      }
    });

    return {
      // State
      user,
      decks,
      cards,
      currentDeckId,
      currentDeck,
      currentCard,
      dueCards,
      showSidebar,
      showAddCard,
      showNewDeck,
      showMenu,
      showThemePicker,
      showDatePicker,
      simulatedDateRef,
      effectiveToday,
      isTimeTraveling,
      isEditing,
      selectedInterval,
      reflectionText,
      editedContent,
      deckStats,
      currentTheme,
      
      // Constants
      THEMES,
      
      // Form state
      newCardContent,
      newCardDeckId,
      newDeckName,
      newDeckEmoji,
      newDeckInterval,
      newDeckLimit,
      
      // Computed
      currentInterval,
      shorterInterval,
      longerInterval,
      nextInterval,
      
      // Methods
      signIn,
      signOut,
      createDeck,
      createCard,
      reviewCard,
      retireCard,
      deleteCard,
      startEditing,
      cancelEditing,
      selectDeck,
      openAddCard,
      setTheme,
      applySimulatedDate,
      clearSimulatedDate,
    };
  },

  template: `
    <div id="app">
      <!-- Sidebar Overlay -->
      <div 
        class="sidebar-overlay" 
        :class="{ open: showSidebar }"
        @click="showSidebar = false"
      ></div>
      
      <!-- Sidebar -->
      <aside class="sidebar" :class="{ open: showSidebar }">
        <div class="sidebar-header">
          <span class="sidebar-title">Fireminder</span>
          <button class="icon-btn" @click="showSidebar = false">✕</button>
        </div>
        <div class="sidebar-content">
          <!-- Current Date Display -->
          <div class="sidebar-date">
            <div class="sidebar-date-label">Today</div>
            <div class="sidebar-date-value">{{ effectiveToday }}</div>
            <div v-if="isTimeTraveling" class="sidebar-date-simulated">
              🕐 Simulated
              <button class="btn-link" @click="clearSimulatedDate">Reset</button>
            </div>
          </div>
          
          <div class="sidebar-section-title">My Decks</div>
          <ul class="deck-list">
            <li 
              v-for="deck in decks" 
              :key="deck.id"
              class="deck-item"
              :class="{ active: deck.id === currentDeckId }"
              @click="selectDeck(deck.id)"
            >
              <span class="deck-name">{{ deck.emoji }} {{ deck.name }}</span>
              <span class="deck-count">{{ cards.filter(c => c.deckId === deck.id && !c.retired && !c.deleted).length }}</span>
            </li>
          </ul>
          <button class="new-deck-btn" @click="showNewDeck = true; showSidebar = false">
            + New Deck
          </button>
          
          <!-- Settings Section -->
          <div class="sidebar-section-title" style="margin-top: var(--space-lg);">Settings</div>
          
          <!-- Time Travel -->
          <div class="sidebar-setting">
            <div class="sidebar-setting-label">📅 Time Travel</div>
            <input 
              type="date" 
              class="date-input"
              :value="simulatedDateRef"
              @change="applySimulatedDate($event.target.value)"
            />
          </div>
          
          <!-- Theme Picker -->
          <div class="sidebar-setting">
            <div class="sidebar-setting-label">🎨 Theme</div>
            <div class="theme-picker-inline">
              <button 
                v-for="theme in THEMES" 
                :key="theme"
                class="theme-swatch"
                :class="{ active: currentTheme === theme }"
                :data-theme="theme"
                :title="theme"
                @click="setTheme(theme)"
              ></button>
            </div>
          </div>
          
          <!-- Sign Out -->
          <div class="sidebar-footer">
            <div class="sidebar-user" v-if="user">
              {{ user.displayName || user.email || 'Anonymous' }}
            </div>
            <button class="btn-signout" @click="signOut">Sign Out</button>
          </div>
        </div>
      </aside>

      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <button class="icon-btn" @click="showSidebar = true">≡</button>
          <span class="header-title" v-if="currentDeck">{{ currentDeck.emoji }} {{ currentDeck.name }}</span>
          <span class="header-title" v-else>Fireminder</span>
        </div>
        <div class="header-right">
          <button class="icon-btn" @click="openAddCard">+</button>
        </div>
      </header>

      <!-- Time Travel Banner -->
      <div v-if="isTimeTraveling" class="time-travel-banner">
        🕐 Simulating: {{ effectiveToday }}
        <button class="btn-reset" @click="clearSimulatedDate">← Back to today</button>
      </div>

      <!-- Main Content -->
      <main class="main" v-if="user">
        <!-- No decks state -->
        <div v-if="decks.length === 0" class="empty-state">
          <p style="margin-bottom: 1rem;">Welcome! Create your first deck to get started.</p>
          <button class="btn-primary" @click="showNewDeck = true">Create Deck</button>
        </div>

        <!-- Review Card -->
        <template v-else-if="currentCard">
          <div class="card">
            <div v-if="isEditing" class="card-editing">
              <div style="color: var(--accent); font-size: 0.85rem; margin-bottom: 0.5rem;">✎ EDITING</div>
              <textarea 
                class="reflection-input" 
                style="min-height: 150px; font-family: var(--font-display); font-size: 1.3rem;"
                v-model="editedContent"
              ></textarea>
            </div>
            <div v-else class="card-content">{{ currentCard.content }}</div>
          </div>

          <textarea 
            v-if="!isEditing"
            class="reflection-input" 
            placeholder="Add reflection..."
            v-model="reflectionText"
          ></textarea>

          <div class="interval-controls" v-if="!isEditing">
            <button 
              class="interval-btn" 
              :class="{ active: selectedInterval === 'shorter' }"
              @click="selectedInterval = selectedInterval === 'shorter' ? 'default' : 'shorter'"
            >
              [{{ shorterInterval }}] Shorter
            </button>
            <span class="interval-current">{{ nextInterval }} days</span>
            <button 
              class="interval-btn"
              :class="{ active: selectedInterval === 'longer' }"
              @click="selectedInterval = selectedInterval === 'longer' ? 'default' : 'longer'"
            >
              Longer [{{ longerInterval }}]
            </button>
          </div>

          <div class="action-row">
            <template v-if="isEditing">
              <button class="btn-secondary" @click="cancelEditing">Cancel</button>
              <button class="btn-primary" @click="reviewCard">Save Edit</button>
            </template>
            <template v-else>
              <button class="btn-primary" @click="reviewCard">✓ Review Done</button>
              <div class="dropdown">
                <button class="menu-btn" @click="showMenu = !showMenu">•••</button>
                <div class="dropdown-menu" v-if="showMenu">
                  <button class="dropdown-item" @click="startEditing">Rephrase card</button>
                  <button class="dropdown-item">View history</button>
                  <button class="dropdown-item">Skip (review later)</button>
                  <button class="dropdown-item">Move to deck...</button>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" @click="retireCard">Retire</button>
                  <button class="dropdown-item danger" @click="deleteCard">Delete...</button>
                </div>
              </div>
            </template>
          </div>

          <div class="queue-status" v-if="!isEditing">
            {{ dueCards.length - 1 }} more today
          </div>
        </template>

        <!-- Empty Deck State -->
        <div v-else class="empty-state">
          <div class="empty-status">Status: All caught up ✓</div>
          <div class="stats">
            <div class="stat-row">
              <span>Active cards</span>
              <span class="stat-value">{{ deckStats.active }}</span>
            </div>
            <div class="stat-row">
              <span>Retired</span>
              <span class="stat-value">{{ deckStats.retired }}</span>
            </div>
            <div class="stat-row">
              <span>Next due</span>
              <span class="stat-value">{{ deckStats.nextDueIn !== null ? 'in ' + deckStats.nextDueIn + ' days' : '—' }}</span>
            </div>
          </div>
          <button class="btn-secondary">Show all cards</button>
        </div>
      </main>

      <!-- Sign In -->
      <main class="main" v-else>
        <div class="empty-state">
          <h2 style="font-family: var(--font-display); margin-bottom: 1rem;">🔥 Fireminder</h2>
          <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">Spaced repetition with Fibonacci intervals</p>
          <button class="btn-primary" @click="signIn">Sign in with Google</button>
        </div>
      </main>

      <!-- Footer Tabs - hidden when panels are open -->
      <footer class="footer-tabs" v-if="user && decks.length > 0 && !showAddCard && !showNewDeck">
        <button 
          v-for="deck in decks.slice(0, 3)" 
          :key="deck.id"
          class="tab"
          :class="{ active: deck.id === currentDeckId }"
          @click="currentDeckId = deck.id"
        >
          {{ deck.emoji }} {{ deck.name }}
        </button>
        <button class="tab" v-if="decks.length > 3">🌍 All</button>
      </footer>

      <!-- Add Card Panel -->
      <div class="panel" v-if="showAddCard">
        <div class="panel-header">
          <button class="icon-btn" @click="showAddCard = false">✕</button>
          <span class="panel-title">Add Card</span>
          <button class="panel-action" @click="createCard">Save</button>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <textarea 
              class="reflection-input" 
              style="min-height: 200px;"
              placeholder="Enter card content..."
              v-model="newCardContent"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Deck</label>
            <select class="form-select" v-model="newCardDeckId">
              <option v-for="deck in decks" :key="deck.id" :value="deck.id">
                {{ deck.emoji }} {{ deck.name }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- New Deck Panel -->
      <div class="panel" v-if="showNewDeck">
        <div class="panel-header">
          <button class="icon-btn" @click="showNewDeck = false">✕</button>
          <span class="panel-title">New Deck</span>
          <button class="panel-action" @click="createDeck">Create</button>
        </div>
        <div class="panel-body">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input 
              type="text" 
              class="form-input" 
              placeholder="e.g. Stoic Quotes"
              v-model="newDeckName"
            >
          </div>
          <div class="form-group">
            <label class="form-label">Emoji</label>
            <input 
              type="text" 
              class="form-input" 
              style="width: 80px;"
              v-model="newDeckEmoji"
            >
          </div>
          <div class="form-group">
            <label class="form-label">Starting interval (days)</label>
            <input 
              type="number" 
              class="form-input" 
              style="width: 100px;"
              min="1"
              v-model.number="newDeckInterval"
            >
          </div>
          <div class="form-group">
            <label class="form-label">Queue limit</label>
            <select class="form-select" v-model="newDeckLimit">
              <option :value="null">Unlimited</option>
              <option :value="5">5 cards</option>
              <option :value="10">10 cards</option>
              <option :value="20">20 cards</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `
}).mount('#app');

