// Game state
let gameState = {
    targetWord: '',
    currentRow: 0,
    currentTile: 0,
    gameOver: false,
    guesses: [],
    darkMode: localStorage.getItem('darkMode') === 'true',
    wordLength: parseInt(localStorage.getItem('wordLength')) || 5,
    difficulty: localStorage.getItem('difficulty') || 'medium'
};

// Statistics state - now organized by word length
let statistics = {
    // Global stats
    currentStreak: 0,
    maxStreak: 0,
    // Stats per word length
    byLength: {
        3: {
            gamesPlayed: 0,
            gamesWon: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        },
        4: {
            gamesPlayed: 0,
            gamesWon: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        },
        5: {
            gamesPlayed: 0,
            gamesWon: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        },
        6: {
            gamesPlayed: 0,
            gamesWon: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        }
    }
};

// Sound mute state
let soundMuted = localStorage.getItem('soundMuted') === 'true';

// Flag to track if sounds are loaded
let soundsLoaded = false;

// DOM elements
const gameBoard = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const messageElement = document.getElementById('message');
const modal = document.getElementById('modal');
const statsModal = document.getElementById('stats-modal');
const shareGameModal = document.getElementById('share-game-modal');
const shareModal = document.getElementById('share-modal');
const howToPlayButton = document.getElementById('how-to-play');
const showStatsButton = document.getElementById('show-stats');
const shareGameButton = document.getElementById('share-game');
const toggleThemeButton = document.getElementById('toggle-theme');
const soundToggleButton = document.getElementById('sound-toggle');
const resetGameButton = document.getElementById('reset-game');
const shareContainer = document.getElementById('share-container');
const shareButton = document.getElementById('share-button');
const shareText = document.getElementById('share-text');
const toastContainer = document.getElementById('toast-container');

// Constants
const MAX_ATTEMPTS = 6;

// Sound effects system - using reliable CDN sources
const sounds = {
    type: new Audio('https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3'),
    delete: new Audio('https://cdn.freesound.org/previews/243/243020_4284968-lq.mp3'),
    error: new Audio('https://cdn.freesound.org/previews/220/220165_4100832-lq.mp3'),
    evaluate: new Audio('https://cdn.freesound.org/previews/171/171671_2437358-lq.mp3'),
    correct: new Audio('https://cdn.freesound.org/previews/339/339912_5121236-lq.mp3'),
    present: new Audio('https://cdn.freesound.org/previews/242/242501_4284968-lq.mp3'),
    absent: new Audio('https://cdn.freesound.org/previews/362/362204_6629938-lq.mp3'),
    win: new Audio('https://cdn.freesound.org/previews/456/456966_5121236-lq.mp3'),
    theme: new Audio('https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3'),
    copy: new Audio('https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3')
};

// Preload sounds with error handling
function preloadSounds() {
    let loadedCount = 0;
    const totalSounds = Object.values(sounds).length;
    
    Object.values(sounds).forEach(sound => {
        // Set up event listeners for loading
        sound.addEventListener('canplaythrough', () => {
            loadedCount++;
            if (loadedCount === totalSounds) {
                soundsLoaded = true;
                console.log('All sounds loaded successfully');
            }
        }, { once: true });
        
        // Set up error handling
        sound.addEventListener('error', (e) => {
            console.warn('Error loading sound:', e);
        });
        
        // Set volume and load
        sound.volume = 0.5;
        sound.load();
    });
    
    // Set a timeout to consider sounds loaded even if events don't fire
    setTimeout(() => {
        if (!soundsLoaded) {
            soundsLoaded = true;
            console.log('Sound loading timed out, continuing anyway');
        }
    }, 3000);
}

// Play sound function
function playSound(soundName) {
    if (!soundMuted && sounds[soundName] && soundsLoaded) {
        try {
            // Create a clone to allow overlapping sounds
            const soundClone = sounds[soundName].cloneNode();
            soundClone.volume = 0.5;
            
            // Add a small timeout to ensure audio context is ready
            setTimeout(() => {
                const playPromise = soundClone.play();
                
                // Handle play promise
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn(`Sound play error (${soundName}):`, error.message);
                    });
                }
            }, 10);
        } catch (error) {
            console.warn(`Error playing sound (${soundName}):`, error.message);
        }
    }
}

// Animate key press function
function animateKeyPress(keyElement) {
    if (!keyElement) return;
    
    // Add pressed class for animation
    keyElement.classList.add('pressed');
    
    // Remove the class after animation completes
    setTimeout(() => {
        keyElement.classList.remove('pressed');
    }, 150);
}

// Bootstrap modal instances
let modalInstance, statsModalInstance, shareModalInstance, shareGameModalInstance, featuresModalInstance;

// Initialize Bootstrap modals after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Other Features modal
    featuresModalInstance = new bootstrap.Modal(document.getElementById('features-modal'));
    
    // Add event listener for the Other Features link
    const otherFeaturesLink = document.getElementById('other-features-link');
    if (otherFeaturesLink) {
        otherFeaturesLink.addEventListener('click', function(e) {
            e.preventDefault();
            featuresModalInstance.show();
        });
    }
    
    modalInstance = new bootstrap.Modal(document.getElementById('modal'));
    statsModalInstance = new bootstrap.Modal(document.getElementById('stats-modal'));
    shareModalInstance = new bootstrap.Modal(document.getElementById('share-modal'));
    shareGameModalInstance = new bootstrap.Modal(document.getElementById('share-game-modal'));
    settingsModalInstance = new bootstrap.Modal(document.getElementById('settings-modal'));
    
    // Preload sounds before initializing the game
    preloadSounds();
    
    // Initialize the game (only called once)
    initializeGame();
    
    // Update sound button icon based on mute state
    if (soundToggleButton) {
        soundToggleButton.innerHTML = soundMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    }
    
    // Update active word length button
    updateActiveWordLengthButton();
});

// Initialize the game
function initializeGame() {
    // Load statistics from local storage
    loadStatistics();
    
    // Create the game board
    createGameBoard();
    
    // Set up event listeners
    setupEventListeners();
    
    // Select a random target word
    selectRandomWord();
    
    // Apply dark mode if enabled
    if (gameState.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleThemeButton.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Apply sound mute state if set
    if (soundMuted) {
        soundToggleButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
    
    // Welcome toast
    setTimeout(() => {
        showToast('Welcome to WORDVERSE Puzzle!', 'success', 3000);
    }, 1000);
}

// Update settings UI based on game state
function updateSettingsUI() {
    // Update word length buttons
    const wordLength = gameState.wordLength;
    document.querySelectorAll('.word-length-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.length) === wordLength) {
            btn.classList.add('active');
        }
    });
    
    // Update difficulty radio buttons
    const difficulty = gameState.difficulty;
    const difficultyRadio = document.getElementById(`difficulty-${difficulty}`);
    if (difficultyRadio) {
        difficultyRadio.checked = true;
    }
}

// Apply sound mute state if set
function applyMuteState() {
    if (soundMuted) {
        sounds.type.volume = 0;
        sounds.delete.volume = 0;
        sounds.error.volume = 0;
        sounds.flip.volume = 0;
        sounds.win.volume = 0;
        sounds.theme.volume = 0;
        sounds.copy.volume = 0;
    }
}

// Create the game board
function createGameBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        row.dataset.row = i; // Add data-row attribute to the row element
        
        for (let j = 0; j < gameState.wordLength; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.dataset.row = i;
            tile.dataset.col = j;
            row.appendChild(tile);
        }
        
        gameBoard.appendChild(row);
    }
}

// Set up event listeners
function setupEventListeners() {
    // Keyboard clicks
    keyboard.addEventListener('click', (e) => {
        if (e.target.classList.contains('key')) {
            const key = e.target.dataset.key;
            animateKeyPress(e.target);
            handleKeyPress(key);
        }
    });
    
    // Physical keyboard
    document.addEventListener('keydown', (e) => {
        if (gameState.gameOver) return;
        
        const key = e.key.toLowerCase();
        
        if (key === 'enter') {
            e.preventDefault(); // Prevent default Enter key behavior
            const enterKey = document.querySelector('.key[data-key="enter"]');
            animateKeyPress(enterKey);
            handleKeyPress('enter');
        } else if (key === 'backspace' || key === 'delete') {
            e.preventDefault(); // Prevent default Backspace key behavior
            const backspaceKey = document.querySelector('.key[data-key="backspace"]');
            animateKeyPress(backspaceKey);
            handleKeyPress('backspace');
        } else if (/^[a-z]$/.test(key)) {
            const keyElement = document.querySelector(`.key[data-key="${key}"]`);
            if (keyElement) animateKeyPress(keyElement);
            handleKeyPress(key);
        }
    });
    
    // How to play button
    howToPlayButton.addEventListener('click', () => {
        modalInstance.show();
    });
    
    // Show stats button
    showStatsButton.addEventListener('click', () => {
        updateStatsDisplay();
        statsModalInstance.show();
    });
    
    // Share game button
    shareGameButton.addEventListener('click', () => {
        // Set the current URL in the game link input
        document.getElementById('game-link').value = window.location.href;
        shareGameModalInstance.show();
    });
    
    // Settings button
    document.getElementById('settings-button').addEventListener('click', () => {
        settingsModalInstance.show();
    });
    
    // Word length buttons
    document.querySelectorAll('.word-length-btn').forEach(button => {
        button.addEventListener('click', () => {
            const length = parseInt(button.dataset.length);
            // Update active button
            document.querySelectorAll('.word-length-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });
    
    // Initialize settings based on game state
    updateSettingsUI();
    
    // Save settings button
    document.getElementById('save-settings').addEventListener('click', () => {
        const activeButton = document.querySelector('.word-length-btn.active');
        const newWordLength = parseInt(activeButton.dataset.length);
        const newDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
        
        // Only restart if word length changed
        const wordLengthChanged = newWordLength !== gameState.wordLength;
        
        // Save settings
        gameState.wordLength = newWordLength;
        gameState.difficulty = newDifficulty;
        
        // Save to localStorage
        localStorage.setItem('wordLength', newWordLength);
        localStorage.setItem('difficulty', newDifficulty);
        
        // Close modal
        settingsModalInstance.hide();
        
        // Restart game if word length changed
        if (wordLengthChanged) {
            showToast(`Word length changed to ${newWordLength}. Starting new game...`, 'info');
            setTimeout(() => {
                resetGame();
            }, 1000);
        } else {
            showToast('Settings saved!', 'success');
        }
    });
    
    // Toggle theme button
    toggleThemeButton.addEventListener('click', toggleTheme);
    
    // Sound toggle button
    soundToggleButton.addEventListener('click', toggleSound);
    
    // Reset game button
    resetGameButton.addEventListener('click', resetGame);
    
    // Close modal buttons
    document.querySelectorAll('.close, .start-playing-btn').forEach(button => {
        button.addEventListener('click', () => {
            modalInstance.hide();
        });
    });
    
    document.querySelector('.stats-close').addEventListener('click', () => {
        statsModalInstance.hide();
    });
    
    // Share button
    shareButton.addEventListener('click', () => {
        const shareTextContent = createShareText();
        prepareShareModal(shareTextContent);
        shareModalInstance.show();
    });
    
    // Copy results button
    document.getElementById('copy-results').addEventListener('click', () => {
        const shareTextContent = createShareText();
        const copyBtn = document.getElementById('copy-results');
        const originalHTML = copyBtn.innerHTML;
        
        // Copy the text using our improved function
        copyToClipboard(shareTextContent)
            .then(() => {
                // Change button text temporarily
                copyBtn.innerHTML = '<i class="fas fa-check me-2"></i><span>Copied!</span>';
                
                // Play sound effect
                playSound('copy');
                
                // Reset button after delay
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                }, 2000);
            })
            .catch(() => {
                // Show error toast if copy failed
                showToast('Failed to copy results. Please try again.', 'danger');
            });
    });
    
    // Social share buttons
    document.getElementById('share-twitter').addEventListener('click', () => {
        const text = encodeURIComponent(`WORDVERSE Puzzle ${new Date().toLocaleDateString()}\n${createShareText()}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    });
    
    document.getElementById('share-facebook').addEventListener('click', () => {
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank');
    });
    
    document.getElementById('share-whatsapp').addEventListener('click', () => {
        const text = encodeURIComponent(`WORDVERSE Puzzle ${new Date().toLocaleDateString()}\n${createShareText()}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    });
    
    // Game share buttons
    document.getElementById('share-game-twitter').addEventListener('click', () => {
        const gameUrl = document.getElementById('game-link').value || window.location.href;
        const text = encodeURIComponent('Challenge yourself with WORDVERSE Puzzle! A daily word guessing game.');
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(gameUrl)}`, '_blank');
    });
    
    document.getElementById('share-game-facebook').addEventListener('click', () => {
        const gameUrl = document.getElementById('game-link').value || window.location.href;
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(gameUrl), '_blank');
    });
    
    document.getElementById('share-game-whatsapp').addEventListener('click', () => {
        const gameUrl = document.getElementById('game-link').value || window.location.href;
        const text = encodeURIComponent('Challenge yourself with WORDVERSE Puzzle! A daily word guessing game. ' + gameUrl);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    });
    
    document.getElementById('share-game-email').addEventListener('click', () => {
        const gameUrl = document.getElementById('game-link').value || window.location.href;
        const subject = encodeURIComponent('Try WORDVERSE Puzzle!');
        const body = encodeURIComponent('Challenge yourself with WORDVERSE Puzzle! A daily word guessing game. ' + gameUrl);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    });
    
    // Copy game link button
    document.getElementById('copy-game-link').addEventListener('click', () => {
        const gameLinkInput = document.getElementById('game-link');
        const copySuccessMessage = document.getElementById('copy-success-message');
        
        // Copy the text using our improved function
        copyToClipboard(gameLinkInput.value)
            .then(() => {
                // Show success message in the modal
                copySuccessMessage.classList.remove('d-none');
                
                // Change button text temporarily
                const copyBtn = document.getElementById('copy-game-link');
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> <span class="copy-text">Copied!</span>';
                
                // Play sound effect
                playSound('copy');
                
                // Reset button after delay
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    // Hide success message after a delay
                    setTimeout(() => {
                        copySuccessMessage.classList.add('d-none');
                    }, 1000);
                }, 2000);
            })
            .catch(() => {
                // Show error toast if copy failed
                showToast('Failed to copy link. Please try again.', 'danger');
            });
    });
}

// Select a random target word
function selectRandomWord() {
    // Get the word list for the current word length
    const words = VALID_WORDS[gameState.wordLength];
    
    if (!words || words.length === 0) {
        console.error(`No words available for length ${gameState.wordLength}`);
        return;
    }
    
    // Select a random word
    gameState.targetWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
    console.log('Target word:', gameState.targetWord); // For debugging
}

function handleKeyPress(key) {
    if (gameState.gameOver) return;
    
    if (key === 'enter') {
        if (gameState.currentTile === gameState.wordLength) {
            submitGuess();
        } else {
            showMessage('Not enough letters!', 'warning');
            playSound('error');
            
            // Shake the current row
            const currentRow = document.querySelector(`.row[data-row='${gameState.currentRow}']`);
            currentRow.classList.add('shake');
            setTimeout(() => {
                currentRow.classList.remove('shake');
            }, 500);
        }
    } else if (key === 'backspace') {
        if (gameState.currentTile > 0) {
            gameState.currentTile--;
            const tile = document.querySelector(`.tile[data-row='${gameState.currentRow}'][data-col='${gameState.currentTile}']`);
            tile.textContent = '';
            tile.classList.remove('filled');
            playSound('delete');
        }
    } else if (/^[a-z]$/.test(key)) {
        if (gameState.currentTile < gameState.wordLength) {
            const tile = document.querySelector(`.tile[data-row='${gameState.currentRow}'][data-col='${gameState.currentTile}']`);
            tile.textContent = key.toUpperCase();
            tile.classList.add('filled');
            gameState.currentTile++;
            playSound('type');
        }
    }
}

// Check if a guess is valid (in the word list for current word length)
function isValidGuess(guess) {
    // Convert to lowercase for comparison with word lists
    const lowerGuess = guess.toLowerCase();
    
    // Check if the guess is in the valid words or valid guesses list for the current word length
    return VALID_WORDS[gameState.wordLength].includes(lowerGuess) || 
           VALID_GUESSES[gameState.wordLength].includes(lowerGuess);
}

// Submit the current guess
function submitGuess() {
    if (gameState.currentTile < gameState.wordLength) {
        showMessage('Not enough letters!', 'warning');
        playSound('error');
        return;
    }
    let guess = '';
    for (let i = 0; i < gameState.wordLength; i++) {
        const tile = document.querySelector(`.tile[data-row='${gameState.currentRow}'][data-col='${i}']`);
        guess += tile.textContent;
    }
    if (gameState.guesses.includes(guess)) {
        const currentRow = document.querySelector(`.row[data-row='${gameState.currentRow}']`);
        currentRow.classList.add('shake');
        setTimeout(() => {
            currentRow.classList.remove('shake');
        }, 500);
        showMessage('You already tried this word!', 'warning');
        playSound('error');
        return;
    }
    
    // Check if the guess is a valid word
    if (!isValidGuess(guess)) {
        const currentRow = document.querySelector(`.row[data-row='${gameState.currentRow}']`);
        currentRow.classList.add('shake');
        setTimeout(() => {
            currentRow.classList.remove('shake');
        }, 500);
        showMessage('Not in word list!', 'warning');
        playSound('error');
        return;
    }
    
    gameState.guesses.push(guess);
    evaluateGuess(guess);
}

// Evaluate the current guess
function evaluateGuess(guess) {
    const targetWord = gameState.targetWord;
    const evaluation = Array(gameState.wordLength).fill('absent');
    const letterCounts = {};
    
    // Count letters in target word
    for (let i = 0; i < gameState.wordLength; i++) {
        const letter = targetWord[i];
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }
    
    // First pass: mark correct letters
    for (let i = 0; i < gameState.wordLength; i++) {
        const guessLetter = guess[i];
        const targetLetter = targetWord[i];
        
        if (guessLetter === targetLetter) {
            evaluation[i] = 'correct';
            letterCounts[guessLetter]--;
        }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < gameState.wordLength; i++) {
        const guessLetter = guess[i];
        
        if (evaluation[i] !== 'correct' && letterCounts[guessLetter] > 0) {
            evaluation[i] = 'present';
            letterCounts[guessLetter]--;
        }
    }
    
    // Animate tiles
    animateTiles(evaluation);
}

// Animate tiles
function animateTiles(evaluation) {
    // Play evaluation sound
    playSound('evaluate');
    
    for (let i = 0; i < gameState.wordLength; i++) {
        const tile = document.querySelector(`.tile[data-row='${gameState.currentRow}'][data-col='${i}']`);
        const delay = i * 300; // Stagger animation
        
        setTimeout(() => {
            // Add flip animation
            tile.classList.add('flip');
            
            // After half of the flip animation, apply the evaluation class
            setTimeout(() => {
                tile.classList.add(evaluation[i]);
                
                // Play sound based on evaluation
                if (evaluation[i] === 'correct') {
                    playSound('correct');
                } else if (evaluation[i] === 'present') {
                    playSound('present');
                } else {
                    playSound('absent');
                }
                
                // Update keyboard
                updateKeyboard(tile.textContent, evaluation[i]);
            }, 150);
            
            // Remove flip animation after it completes
            setTimeout(() => {
                tile.classList.remove('flip');
            }, 300);
        }, delay);
    }
    
    // After all tiles are animated, check if game is won or lost
    setTimeout(() => {
        checkGameState();
    }, gameState.wordLength * 300 + 300);
}

// Check the game state after a guess
function checkGameState() {
    const currentGuess = gameState.guesses[gameState.currentRow];
    
    if (currentGuess === gameState.targetWord) {
        // Game won
        gameState.gameOver = true;
        showMessage(`Congratulations! You guessed the word in ${gameState.currentRow + 1} ${gameState.currentRow === 0 ? 'try' : 'tries'}!`, 'success');
        playSound('win');
        updateStatistics(true);
        showShareButton();
        createConfetti();
    } else if (gameState.currentRow === MAX_ATTEMPTS - 1) {
        // Game lost (all attempts used)
        gameState.gameOver = true;
        showMessage(`Game over! The word was ${gameState.targetWord}.`, 'danger');
        updateStatistics(false);
        showShareButton();
    } else {
        // Game continues
        gameState.currentRow++;
        gameState.currentTile = 0;
    }
}

// Show a message to the user
function showMessage(text, type = 'info') {
    showToast(text, type);
}

// Show a toast notification with modern design
function showToast(message, type = 'info', duration = 2000) {
    // Get appropriate icon based on toast type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'danger':
            icon = '<i class="fas fa-times-circle"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    const toast = document.createElement('div');
    toast.classList.add('modern-toast', 'show', `toast-${type}`);
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="modern-toast-content">
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
            <button type="button" class="toast-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="toast-progress">
            <div class="toast-progress-bar toast-progress-${type}"></div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Set up progress bar animation
    const progressBar = toast.querySelector('.toast-progress-bar');
    progressBar.style.animationDuration = `${duration}ms`;
    
    // Add click event to close button
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        toast.classList.remove('show');
        toast.classList.add('hiding');
        setTimeout(() => {
            toast.remove();
        }, 300); // Match the CSS transition time
    });
    
    // Auto-remove toast after duration
    setTimeout(() => {
        if (toast.parentNode) { // Check if toast is still in the DOM
            toast.classList.remove('show');
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentNode) { // Double-check before removing
                    toast.remove();
                }
            }, 300); // Match the CSS transition time
        }
    }, duration);
    
    // Add entrance animation class
    setTimeout(() => {
        toast.classList.add('animate-in');
    }, 10);
}

// Toggle dark/light theme
function toggleTheme() {
    gameState.darkMode = !gameState.darkMode;
    document.documentElement.setAttribute('data-theme', gameState.darkMode ? 'dark' : 'light');
    toggleThemeButton.innerHTML = gameState.darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', gameState.darkMode);
    playSound('theme');
}

// Toggle sound on/off
function toggleSound() {
    soundMuted = !soundMuted;
    soundToggleButton.innerHTML = soundMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    localStorage.setItem('soundMuted', soundMuted);
    
    // Play a sound if unmuting
    if (!soundMuted && soundsLoaded) {
        // Small delay to ensure the browser allows sound playback
        setTimeout(() => {
            playSound('theme');
        }, 50);
    }
}

// Reset the game
function resetGame() {
    // Reset game state
    gameState.currentRow = 0;
    gameState.currentTile = 0;
    gameState.gameOver = false;
    gameState.guesses = [];
    
    // Recreate the game board for the current word length
    createGameBoard();
    
    // Select a new random word
    selectRandomWord();
    
    // Reset the keyboard
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.className = 'key';
    });
    
    // Hide share container
    shareContainer.classList.add('d-none');
    
    // Show a message
    showMessage(`New ${gameState.wordLength}-letter word game started!`, 'success');
    playSound('type');
}

// Load statistics from local storage with migration support
function loadStatistics() {
    const savedStats = localStorage.getItem('wordleStats');
    if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        
        // Check if we need to migrate from old format to new format
        if (parsedStats.hasOwnProperty('gamesPlayed') && !parsedStats.hasOwnProperty('byLength')) {
            // This is the old format, migrate to new format
            const oldStats = parsedStats;
            
            // Create new statistics structure
            const newStats = {
                currentStreak: oldStats.currentStreak || 0,
                maxStreak: oldStats.maxStreak || 0,
                byLength: {
                    3: {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        guessDistribution: [0, 0, 0, 0, 0, 0]
                    },
                    4: {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        guessDistribution: [0, 0, 0, 0, 0, 0]
                    },
                    5: {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        guessDistribution: [0, 0, 0, 0, 0, 0]
                    },
                    6: {
                        gamesPlayed: 0,
                        gamesWon: 0,
                        guessDistribution: [0, 0, 0, 0, 0, 0]
                    }
                }
            };
            
            // Move old stats to the default word length (5)
            newStats.byLength[5].gamesPlayed = oldStats.gamesPlayed || 0;
            newStats.byLength[5].gamesWon = oldStats.gamesWon || 0;
            newStats.byLength[5].guessDistribution = oldStats.guessDistribution || [0, 0, 0, 0, 0, 0];
            
            // Update statistics with migrated data
            statistics = newStats;
            
            // Save the new format
            saveStatistics();
            console.log('Statistics migrated to new format');
        } else {
            // Already in new format
            statistics = parsedStats;
        }
    }
}

// Save statistics to local storage
function saveStatistics() {
    localStorage.setItem('wordleStats', JSON.stringify(statistics));
}

// Update statistics after a game
function updateStatistics(won) {
    // Get the current word length
    const wordLength = gameState.wordLength;
    
    // Update word-length specific stats
    statistics.byLength[wordLength].gamesPlayed++;
    
    if (won) {
        statistics.byLength[wordLength].gamesWon++;
        statistics.currentStreak++;
        statistics.byLength[wordLength].guessDistribution[gameState.currentRow]++;
        
        if (statistics.currentStreak > statistics.maxStreak) {
            statistics.maxStreak = statistics.currentStreak;
        }
    } else {
        statistics.currentStreak = 0;
    }
    
    saveStatistics();
}

// Update the statistics display
function updateStatsDisplay() {
    // Get the current word length
    const wordLength = gameState.wordLength;
    const lengthStats = statistics.byLength[wordLength];
    
    // Add word length to the stats title
    const statsTitle = document.querySelector('#stats-modal .modal-title');
    if (statsTitle) {
        statsTitle.textContent = `Statistics (${wordLength}-letter mode)`;
    }
    
    // Calculate total games played and won across all word lengths
    let totalGamesPlayed = 0;
    let totalGamesWon = 0;
    
    Object.values(statistics.byLength).forEach(lengthStat => {
        totalGamesPlayed += lengthStat.gamesPlayed;
        totalGamesWon += lengthStat.gamesWon;
    });
    
    // Update statistics numbers
    document.getElementById('games-played').textContent = lengthStats.gamesPlayed;
    document.getElementById('win-percentage').textContent = lengthStats.gamesPlayed > 0 
        ? Math.round((lengthStats.gamesWon / lengthStats.gamesPlayed) * 100) + '%' 
        : '0%';
    document.getElementById('current-streak').textContent = statistics.currentStreak;
    document.getElementById('max-streak').textContent = statistics.maxStreak;
    
    // Update guess distribution
    const distributionContainer = document.getElementById('guess-distribution');
    distributionContainer.innerHTML = '';
    
    const maxGuesses = Math.max(...lengthStats.guessDistribution);
    
    for (let i = 0; i < lengthStats.guessDistribution.length; i++) {
        const count = lengthStats.guessDistribution[i];
        const percentage = maxGuesses > 0 ? (count / maxGuesses) * 100 : 0;
        
        const row = document.createElement('div');
        row.classList.add('distribution-row');
        
        row.innerHTML = `
            <div class="guess-number">${i + 1}</div>
            <div class="guess-bar-container">
                <div class="guess-bar" style="width: ${percentage}%">${count}</div>
            </div>
        `;
        
        distributionContainer.appendChild(row);
    }
    
    // Add a section showing overall stats across all word lengths
    const overallStatsContainer = document.getElementById('overall-stats');
    if (!overallStatsContainer) {
        const statsContainer = document.querySelector('.stats-container');
        if (statsContainer) {
            const overallSection = document.createElement('div');
            overallSection.id = 'overall-stats';
            overallSection.classList.add('mt-4');
            overallSection.innerHTML = `
                <h5>Overall Statistics</h5>
                <div class="d-flex justify-content-between mb-3">
                    <div class="text-center">
                        <div class="stat-number">${totalGamesPlayed}</div>
                        <div class="stat-label">Total Games</div>
                    </div>
                    <div class="text-center">
                        <div class="stat-number">${totalGamesPlayed > 0 ? Math.round((totalGamesWon / totalGamesPlayed) * 100) + '%' : '0%'}</div>
                        <div class="stat-label">Overall Win %</div>
                    </div>
                </div>
            `;
            statsContainer.appendChild(overallSection);
        }
    } else {
        // Update existing overall stats
        const totalGamesEl = overallStatsContainer.querySelector('.stat-number:first-child');
        const winPercentEl = overallStatsContainer.querySelector('.stat-number:last-child');
        if (totalGamesEl) totalGamesEl.textContent = totalGamesPlayed;
        if (winPercentEl) winPercentEl.textContent = totalGamesPlayed > 0 ? Math.round((totalGamesWon / totalGamesPlayed) * 100) + '%' : '0%';
    }
}

// Create share text
function createShareText() {
    let shareText = `WORDVERSE Puzzle ${new Date().toLocaleDateString()}\n`;
    shareText += `${gameState.wordLength}-letter mode\n`;
    shareText += `${gameState.currentRow + 1}/${MAX_ATTEMPTS}\n\n`;
    
    for (let i = 0; i < gameState.guesses.length; i++) {
        const guess = gameState.guesses[i];
        let rowEmojis = '';
        
        for (let j = 0; j < guess.length; j++) {
            const tile = document.querySelector(`.tile[data-row='${i}'][data-col='${j}']`);
            
            if (tile.classList.contains('correct')) {
                rowEmojis += '🟩';
            } else if (tile.classList.contains('present')) {
                rowEmojis += '🟨';
            } else {
                rowEmojis += '⬛';
            }
        }
        
        shareText += rowEmojis + '\n';
    }
    
    return shareText;
}

// Prepare the share modal
function prepareShareModal(shareText) {
    shareContainer.innerHTML = '';
    
    // Create pre-formatted text
    const pre = document.createElement('pre');
    pre.textContent = shareText;
    shareContainer.appendChild(pre);
    
    // Set the text for copying
    shareText.value = shareText;
}

// Copy text to clipboard
function copyToClipboard(text) {
    return new Promise((resolve, reject) => {
        // Use modern clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    resolve(true);
                })
                .catch(err => {
                    console.warn('Clipboard API failed:', err);
                    fallbackCopyToClipboard(text) ? resolve(true) : reject(false);
                });
        } else {
            // Fallback for older browsers
            fallbackCopyToClipboard(text) ? resolve(true) : reject(false);
        }
    });
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text) {
    try {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        // Select and copy the text
        textarea.select();
        const success = document.execCommand('copy');
        
        // Remove the temporary textarea
        document.body.removeChild(textarea);
        return success;
    } catch (err) {
        console.error('Fallback clipboard copy failed:', err);
        return false;
    }
}
