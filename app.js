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
provider.setCustomParameters({
  prompt: 'select_account'
});

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
// IMPORTANT: All dates are LOCAL dates (user's timezone). No UTC conversion.
// We store dates as "YYYY-MM-DD" strings and compare them lexicographically.

/**
 * Parse a "YYYY-MM-DD" string as a LOCAL date (not UTC).
 * new Date("2025-12-30") parses as midnight UTC which causes off-by-one bugs.
 * This function creates midnight LOCAL time.
 */
function parseLocalDate(dateStr) {
  if (dateStr instanceof Date) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

function addDays(date, days) {
  const d = date instanceof Date ? date : parseLocalDate(date);
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(date1, date2) {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  const diffTime = d2 - d1;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format a date as "YYYY-MM-DD" using LOCAL time (not UTC).
 */
function formatDate(date) {
  const d = date instanceof Date ? date : parseLocalDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
    const showHistory = ref(false);
    const showAllCards = ref(false);
    const showCardDetail = ref(null); // card object or null
    const showSettings = ref(false);
    const settingsName = ref('');
    const settingsInterval = ref(2);
    const settingsLimit = ref('');
    const showMoveToDeck = ref(false);
    const moveToDeckTarget = ref(null);
    const showThemePicker = ref(false);
    const showDatePicker = ref(false);
    const showSkipToast = ref(false);
    const skippedCard = ref(null);
    let skipToastTimeout = null;
    const showAllReflections = ref(false);
    
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
        return parseLocalDate(simulatedDateRef.value);
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
      const deckCards = currentDeckCards.value.filter(c => !c.retired && !c.deleted && !c.skippedToday);
      
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

    // Default next interval advances one Fibonacci step
    const defaultNextInterval = computed(() => getLongerInterval(currentInterval.value));
    // Shorter = current interval (no advance)
    const shorterInterval = computed(() => currentInterval.value);
    // Longer = advance TWO steps (one beyond default)
    const longerInterval = computed(() => getLongerInterval(defaultNextInterval.value));

    const nextInterval = computed(() => {
      if (selectedInterval.value === 'shorter') return shorterInterval.value;
      if (selectedInterval.value === 'longer') return longerInterval.value;
      return defaultNextInterval.value;
    });
    
    // Get reflections from current card's history
    const cardReflections = computed(() => {
      if (!currentCard.value?.history) return [];
      return currentCard.value.history
        .filter(h => h.reflection)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // newest first
    });

    const deckStats = computed(() => {
      const deckCards = currentDeckCards.value;
      const active = deckCards.filter(c => !c.retired && !c.deleted).length;
      const retired = deckCards.filter(c => c.retired).length;
      
      // Find next due card
      const today = effectiveToday.value;
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
      // Sanitize queue limit: positive numbers only, otherwise null (unlimited)
      const queueLimit = (newDeckLimit.value && newDeckLimit.value > 0) ? newDeckLimit.value : null;
      const deck = {
        name: newDeckName.value.trim(),
        startingInterval: newDeckInterval.value,
        queueLimit: queueLimit,
        createdAt: formatDate(getToday()),
      };
      
      // Close panel immediately for better UX
      const deckName = newDeckName.value;
      newDeckName.value = '';
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
        createdAt: formatDate(getToday()),
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
        showAllReflections.value = false;
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
    
    async function saveEdit() {
      if (!currentCard.value || !user.value || !isEditing.value) return;
      if (editedContent.value === currentCard.value.content) {
        // No changes, just close
        cancelEditing();
        return;
      }
      
      try {
        const cardRef = doc(db, 'users', user.value.uid, 'cards', currentCard.value.id);
        await setDoc(cardRef, { content: editedContent.value }, { merge: true });
        
        // Update local state
        const idx = cards.value.findIndex(c => c.id === currentCard.value.id);
        if (idx !== -1) {
          cards.value[idx].content = editedContent.value;
        }
        
        isEditing.value = false;
        editedContent.value = '';
      } catch (error) {
        console.error('Error saving edit:', error);
      }
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

    // --- Helper functions for new panels ---
    function formatHistoryDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    function formatDueDate(dateStr) {
      if (!dateStr) return 'Not scheduled';
      const today = effectiveToday.value;
      if (dateStr === today) return 'Today';
      if (dateStr < today) return 'Overdue';
      
      const dueDate = new Date(dateStr);
      const todayDate = new Date(today);
      const diffDays = Math.ceil((dueDate - todayDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Tomorrow';
      return `in ${diffDays} days`;
    }
    
    function startEditingFromDetail() {
      if (!showCardDetail.value) return;
      // Set the current card to the detail card for editing
      editedContent.value = showCardDetail.value.content;
      isEditing.value = true;
      showCardDetail.value = null;
    }
    
    async function retireCardFromDetail() {
      if (!showCardDetail.value || !user.value) return;
      
      try {
        const cardRef = doc(db, 'users', user.value.uid, 'cards', showCardDetail.value.id);
        await setDoc(cardRef, { retired: true }, { merge: true });
        
        const idx = cards.value.findIndex(c => c.id === showCardDetail.value.id);
        if (idx !== -1) {
          cards.value[idx].retired = true;
        }
        showCardDetail.value = null;
      } catch (error) {
        console.error('Error retiring card:', error);
      }
    }
    
    async function deleteCardFromDetail() {
      if (!showCardDetail.value || !user.value) return;
      if (!confirm('Delete this card permanently?')) return;
      
      try {
        const cardRef = doc(db, 'users', user.value.uid, 'cards', showCardDetail.value.id);
        await deleteDoc(cardRef);
        
        cards.value = cards.value.filter(c => c.id !== showCardDetail.value.id);
        showCardDetail.value = null;
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
    
    function openAllCards() {
      showAllCards.value = true;
    }
    
    function openSettings() {
      if (!currentDeck.value) return;
      settingsName.value = currentDeck.value.name;
      settingsInterval.value = currentDeck.value.startingInterval || 2;
      settingsLimit.value = currentDeck.value.queueLimit || '';
      showSettings.value = true;
    }
    
    async function saveSettings() {
      if (!currentDeck.value || !user.value) return;
      if (!settingsName.value.trim()) return;
      
      try {
        const deckRef = doc(db, 'users', user.value.uid, 'decks', currentDeck.value.id);
        const updates = {
          name: settingsName.value.trim(),
          startingInterval: parseInt(settingsInterval.value) || 2,
          queueLimit: settingsLimit.value ? parseInt(settingsLimit.value) : null
        };
        await setDoc(deckRef, updates, { merge: true });
        
        // Update local state
        const idx = decks.value.findIndex(d => d.id === currentDeck.value.id);
        if (idx !== -1) {
          decks.value[idx] = { ...decks.value[idx], ...updates };
        }
        
        showSettings.value = false;
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
    
    async function deleteDeck() {
      if (!currentDeck.value || !user.value) return;
      
      const cardsInDeck = cards.value.filter(c => c.deckId === currentDeck.value.id);
      const confirmMsg = cardsInDeck.length > 0 
        ? `Delete "${currentDeck.value.name}" and its ${cardsInDeck.length} cards?`
        : `Delete "${currentDeck.value.name}"?`;
      
      if (!confirm(confirmMsg)) return;
      
      try {
        // Delete all cards in deck
        for (const card of cardsInDeck) {
          const cardRef = doc(db, 'users', user.value.uid, 'cards', card.id);
          await deleteDoc(cardRef);
        }
        
        // Delete deck
        const deckRef = doc(db, 'users', user.value.uid, 'decks', currentDeck.value.id);
        await deleteDoc(deckRef);
        
        // Update local state
        cards.value = cards.value.filter(c => c.deckId !== currentDeck.value.id);
        decks.value = decks.value.filter(d => d.id !== currentDeck.value.id);
        selectedDeckId.value = decks.value[0]?.id || null;
        
        showSettings.value = false;
      } catch (error) {
        console.error('Error deleting deck:', error);
      }
    }

    function openMoveToDeck() {
      moveToDeckTarget.value = null;
      showMoveToDeck.value = true;
    }
    
    function skipCard() {
      if (!currentCard.value) return;
      
      // Store the skipped card for undo
      skippedCard.value = { ...currentCard.value };
      
      // Move card to end of queue (by setting a temporary skip flag)
      const idx = cards.value.findIndex(c => c.id === currentCard.value.id);
      if (idx !== -1) {
        cards.value[idx].skippedToday = true;
      }
      
      showMenu.value = false;
      showSkipToast.value = true;
      
      // Clear any existing timeout
      if (skipToastTimeout) clearTimeout(skipToastTimeout);
      
      // Auto-dismiss after 3 seconds
      skipToastTimeout = setTimeout(() => {
        showSkipToast.value = false;
        skippedCard.value = null;
      }, 3000);
    }
    
    function undoSkip() {
      if (!skippedCard.value) return;
      
      // Clear the skip flag
      const idx = cards.value.findIndex(c => c.id === skippedCard.value.id);
      if (idx !== -1) {
        cards.value[idx].skippedToday = false;
      }
      
      // Clear timeout and toast
      if (skipToastTimeout) clearTimeout(skipToastTimeout);
      showSkipToast.value = false;
      skippedCard.value = null;
    }
    
    async function moveCard() {
      const card = showCardDetail.value || currentCard.value;
      if (!card || !user.value || !moveToDeckTarget.value) return;
      if (moveToDeckTarget.value === card.deckId) return; // Same deck
      
      try {
        const cardRef = doc(db, 'users', user.value.uid, 'cards', card.id);
        await setDoc(cardRef, { deckId: moveToDeckTarget.value }, { merge: true });
        
        // Update local state
        const idx = cards.value.findIndex(c => c.id === card.id);
        if (idx !== -1) {
          cards.value[idx].deckId = moveToDeckTarget.value;
        }
        
        showMoveToDeck.value = false;
        showCardDetail.value = null;
      } catch (error) {
        console.error('Error moving card:', error);
      }
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
      currentDeckCards,
      dueCards,
      showSidebar,
      showAddCard,
      showNewDeck,
      showMenu,
      showHistory,
      showAllCards,
      showCardDetail,
      showSettings,
      settingsName,
      settingsInterval,
      settingsLimit,
      openAllCards,
      openSettings,
      saveSettings,
      deleteDeck,
      showMoveToDeck,
      moveToDeckTarget,
      openMoveToDeck,
      moveCard,
      showThemePicker,
      showDatePicker,
      showSkipToast,
      skippedCard,
      skipCard,
      undoSkip,
      showAllReflections,
      cardReflections,
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
      saveEdit,
      startEditingFromDetail,
      retireCardFromDetail,
      deleteCardFromDetail,
      formatHistoryDate,
      formatDueDate,
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
              <span class="deck-name">{{ deck.name }}</span>
              <span class="deck-count">{{ cards.filter(c => c.deckId === deck.id && !c.retired && !c.deleted).length }}</span>
            </li>
          </ul>
          <button class="new-deck-btn" @click="showNewDeck = true; showSidebar = false">
            + New Deck
          </button>
          
          <!-- Developer Section -->
          <div class="sidebar-section-title" style="margin-top: var(--space-lg);">Developer</div>
          
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
          <span class="header-title" v-if="currentDeck">{{ currentDeck.name }}</span>
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
          
          <!-- Past Reflections (inline display) -->
          <div class="past-reflections" v-if="!isEditing && cardReflections.length > 0">
            <div class="reflection-latest">
              <div class="reflection-header">
                <span class="reflection-icon">💭</span>
                <span class="reflection-date">{{ formatHistoryDate(cardReflections[0].date) }}:</span>
              </div>
              <div class="reflection-text">"{{ cardReflections[0].reflection }}"</div>
            </div>
            <button 
              v-if="cardReflections.length > 1"
              class="reflections-toggle"
              @click="showAllReflections = !showAllReflections"
            >
              {{ showAllReflections ? '▴ Hide' : '▾ ' + (cardReflections.length - 1) + ' more reflection' + (cardReflections.length > 2 ? 's' : '') }}
            </button>
            <div class="reflections-expanded" v-if="showAllReflections">
              <div 
                v-for="(ref, idx) in cardReflections.slice(1)" 
                :key="idx"
                class="reflection-item"
              >
                <div class="reflection-header">
                  <span class="reflection-icon">💭</span>
                  <span class="reflection-date">{{ formatHistoryDate(ref.date) }}:</span>
                </div>
                <div class="reflection-text">"{{ ref.reflection }}"</div>
              </div>
            </div>
          </div>

          <textarea 
            v-if="!isEditing"
            class="reflection-input" 
            placeholder="Add reflection..."
            v-model="reflectionText"
          ></textarea>

          <div class="interval-controls" v-if="!isEditing">
            <button 
              class="interval-btn shorter" 
              :class="{ active: selectedInterval === 'shorter' }"
              @click="selectedInterval = selectedInterval === 'shorter' ? 'default' : 'shorter'"
            >
              [{{ shorterInterval }}] Shorter
            </button>
            <span class="interval-current">{{ nextInterval }} days</span>
            <button 
              class="interval-btn longer"
              :class="{ active: selectedInterval === 'longer' }"
              @click="selectedInterval = selectedInterval === 'longer' ? 'default' : 'longer'"
            >
              Longer [{{ longerInterval }}]
            </button>
          </div>

          <div class="action-row">
            <template v-if="isEditing">
              <button class="btn-secondary" @click="cancelEditing">Cancel</button>
              <button class="btn-primary" @click="saveEdit">Save Edit</button>
            </template>
            <template v-else>
              <button class="btn-primary" @click="reviewCard">✓ Review Done</button>
              <div class="dropdown">
                <button class="menu-btn" @click="showMenu = !showMenu">≡</button>
                <div class="dropdown-menu" v-if="showMenu">
                  <button class="dropdown-item" @click="startEditing">Rephrase card</button>
                  <button class="dropdown-item" @click="showHistory = true; showMenu = false">View history</button>
                  <button class="dropdown-item" @click="skipCard">Skip (review later)</button>
                  <button class="dropdown-item" @click="openMoveToDeck(); showMenu = false">Move to deck...</button>
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
          <div class="empty-deck-actions">
            <button class="btn-secondary" @click="openAllCards">Show all cards</button>
            <button class="btn-secondary" @click="openSettings">⚙ Settings</button>
          </div>
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
          {{ deck.name }}
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
                {{ deck.name }}
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
            <label class="form-label">Queue limit (blank = unlimited)</label>
            <input 
              type="number" 
              class="form-input" 
              placeholder="Unlimited"
              min="1"
              v-model.number="newDeckLimit"
            >
          </div>
        </div>
      </div>

      <!-- History Panel -->
      <div class="panel" v-if="showHistory && currentCard">
        <div class="panel-header">
          <button class="icon-btn" @click="showHistory = false">✕</button>
          <span class="panel-title">History</span>
        </div>
        <div class="panel-body">
          <!-- Current Version -->
          <div class="history-section">
            <div class="history-label">CURRENT</div>
            <div class="history-card-content">{{ currentCard.content }}</div>
          </div>
          
          <!-- History Entries -->
          <div 
            v-for="(entry, index) in (currentCard.history || []).slice().reverse()" 
            :key="index"
            class="history-section"
          >
            <div class="history-date">{{ formatHistoryDate(entry.date) }}</div>
            <div class="history-card-content" v-if="entry.previousContent">
              {{ entry.previousContent }}
            </div>
            <div class="history-reflection" v-if="entry.reflection">
              <span class="history-reflection-label">Reflection:</span>
              {{ entry.reflection }}
            </div>
            <div class="history-interval">
              Interval: {{ entry.interval }} days
            </div>
          </div>
          
          <!-- No history yet -->
          <div v-if="!currentCard.history || currentCard.history.length === 0" class="history-empty">
            No history yet. This card hasn't been reviewed.
          </div>
        </div>
      </div>

      <!-- All Cards Panel -->
      <div class="panel" v-if="showAllCards">
        <div class="panel-header">
          <button class="icon-btn" @click="showAllCards = false">✕</button>
          <span class="panel-title">All Cards ({{ currentDeck?.name }})</span>
        </div>
        <div class="panel-body">
          <!-- Active Cards -->
          <div class="cards-section">
            <div class="cards-section-title">ACTIVE ({{ deckStats.active }})</div>
            <div 
              v-for="card in currentDeckCards.filter(c => !c.retired && !c.deleted)"
              :key="card.id"
              class="card-list-item"
              @click="showCardDetail = card; showAllCards = false"
            >
              <div class="card-list-content">{{ card.content }}</div>
              <div class="card-list-due">Due: {{ formatDueDate(card.nextDueDate) }}</div>
            </div>
          </div>
          
          <!-- Retired Cards -->
          <div class="cards-section" v-if="currentDeckCards.filter(c => c.retired).length > 0">
            <div class="cards-section-title">RETIRED ({{ deckStats.retired }})</div>
            <div 
              v-for="card in currentDeckCards.filter(c => c.retired)"
              :key="card.id"
              class="card-list-item retired"
              @click="showCardDetail = card; showAllCards = false"
            >
              <div class="card-list-content">{{ card.content }}</div>
              <div class="card-list-due">Retired</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Card Detail Panel -->
      <div class="panel" v-if="showCardDetail">
        <div class="panel-header">
          <button class="icon-btn" @click="showCardDetail = null">✕</button>
          <span class="panel-title">Card Detail</span>
          <button class="panel-action" @click="startEditingFromDetail">Edit</button>
        </div>
        <div class="panel-body">
          <div class="detail-content">{{ showCardDetail.content }}</div>
          
          <div class="detail-meta">
            <div class="detail-row">
              <span class="detail-label">Deck:</span>
              <span>{{ currentDeck?.name }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span>{{ formatHistoryDate(showCardDetail.createdAt) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Last reviewed:</span>
              <span>{{ showCardDetail.lastReviewDate ? formatHistoryDate(showCardDetail.lastReviewDate) : 'Never' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Current interval:</span>
              <span>{{ showCardDetail.currentInterval }} days</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Next due:</span>
              <span>{{ formatDueDate(showCardDetail.nextDueDate) }}</span>
            </div>
          </div>
          
          <div class="detail-actions">
            <button class="btn-secondary" @click="showHistory = true; showCardDetail = null">View History</button>
            <button class="btn-secondary" @click="showMoveToDeck = true">Move to Deck</button>
          </div>
          
          <div class="detail-danger">
            <button class="btn-danger-outline" @click="retireCardFromDetail">Retire</button>
            <button class="btn-danger" @click="deleteCardFromDetail">Delete</button>
          </div>
        </div>
      </div>
      
      <!-- Settings Panel -->
      <div class="panel" v-if="showSettings && currentDeck">
        <div class="panel-header">
          <button class="icon-btn" @click="showSettings = false">✕</button>
          <span class="panel-title">Settings</span>
          <button class="panel-action" @click="saveSettings">Done</button>
        </div>
        <div class="panel-body">
          <div class="settings-deck-title">DECK: {{ currentDeck.name }}</div>
          
          <div class="form-group">
            <label class="form-label">Name:</label>
            <input 
              type="text" 
              class="form-input"
              v-model="settingsName"
              placeholder="Deck name"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Starting interval:</label>
            <div class="interval-input-row">
              <input 
                type="number" 
                class="form-input interval-number"
                v-model="settingsInterval"
                min="1"
              />
              <span class="interval-unit">days</span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Queue limit:</label>
            <input 
              type="number" 
              class="form-input"
              v-model="settingsLimit"
              placeholder="Unlimited"
              min="1"
            />
          </div>
          
          <div class="settings-danger">
            <button class="btn-danger" @click="deleteDeck">Delete Deck</button>
          </div>
        </div>
      </div>
      
      <!-- Move to Deck Modal -->
      <div class="modal-overlay" v-if="showMoveToDeck" @click.self="showMoveToDeck = false">
        <div class="modal">
          <div class="modal-header">Move Card</div>
          <div class="modal-body">
            <div class="modal-label">Move to:</div>
            <div class="deck-options">
              <label 
                v-for="deck in decks" 
                :key="deck.id"
                class="deck-option"
                :class="{ current: deck.id === (showCardDetail?.deckId || currentCard?.deckId) }"
              >
                <input 
                  type="radio" 
                  name="moveToDeck" 
                  :value="deck.id"
                  v-model="moveToDeckTarget"
                  :disabled="deck.id === (showCardDetail?.deckId || currentCard?.deckId)"
                />
                <span>{{ deck.name }}</span>
                <span class="current-badge" v-if="deck.id === (showCardDetail?.deckId || currentCard?.deckId)">(current)</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showMoveToDeck = false">Cancel</button>
            <button class="btn-primary" @click="moveCard" :disabled="!moveToDeckTarget">Move</button>
          </div>
        </div>
      </div>
      
      <!-- Skip Toast -->
      <div class="skip-toast" v-if="showSkipToast">
        <span>Skipped. Will show again later today.</span>
        <button class="toast-undo" @click="undoSkip">Undo</button>
      </div>
    </div>
  `
}).mount('#app');

