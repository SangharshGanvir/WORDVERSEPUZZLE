// Game state
let gameState = {
    targetWord: '',
    currentRow: 0,
    currentTile: 0,
    gameOver: false,
    guesses: [],
    darkMode: localStorage.getItem('darkMode') === 'true'
};

// Statistics state
let statistics = {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0]
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
const WORD_LENGTH = 5;
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
let modalInstance, statsModalInstance, shareModalInstance, shareGameModalInstance;

// Initialize Bootstrap modals after DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    modalInstance = new bootstrap.Modal(document.getElementById('modal'));
    statsModalInstance = new bootstrap.Modal(document.getElementById('stats-modal'));
    shareModalInstance = new bootstrap.Modal(document.getElementById('share-modal'));
    shareGameModalInstance = new bootstrap.Modal(document.getElementById('share-game-modal'));
    
    // Preload sounds before initializing the game
    preloadSounds();
    
    // Initialize the game
    initializeGame();
    
    // Update sound button icon based on mute state
    if (soundToggleButton) {
        soundToggleButton.innerHTML = soundMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    }
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

// Create the game board
function createGameBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        row.dataset.row = i; // Add data-row attribute to the row element
        
        for (let j = 0; j < WORD_LENGTH; j++) {
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
        shareGameModalInstance.show();
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
        copyToClipboard(shareTextContent);
        showToast('Results copied to clipboard!', 'success');
        playSound('copy');
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
        const text = encodeURIComponent('Challenge yourself with WORDVERSE Puzzle! A daily word guessing game.');
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, '_blank');
    });
    
    document.getElementById('share-game-facebook').addEventListener('click', () => {
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(window.location.href), '_blank');
    });
    
    document.getElementById('share-game-whatsapp').addEventListener('click', () => {
        const text = encodeURIComponent('Challenge yourself with WORDVERSE Puzzle! A daily word guessing game. ' + window.location.href);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    });
    
    document.getElementById('share-game-email').addEventListener('click', () => {
        const subject = encodeURIComponent('Try WORDVERSE Puzzle!');
        const body = encodeURIComponent('Challenge yourself with WORDVERSE Puzzle! A daily word guessing game. ' + window.location.href);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    });
    
    // Copy game link button
    document.getElementById('copy-game-link').addEventListener('click', () => {
        copyToClipboard(document.getElementById('game-link').value);
        showToast('Game link copied to clipboard!', 'success');
        playSound('copy');
    });
}

// Select a random target word
function selectRandomWord() {
    // List of 5-letter words
    const words = [
        'APPLE', 'BRAVE', 'CHILL', 'DANCE', 'EAGER', 'FOCUS', 'GLORY', 'HAPPY',
        'IDEAL', 'JOLLY', 'KNACK', 'LEMON', 'MAGIC', 'NOBLE', 'OCEAN', 'PIANO',
        'QUICK', 'ROYAL', 'SMILE', 'TRUST', 'UNITY', 'VIVID', 'WORLD', 'YOUTH',
        'ZESTY', 'ABOUT', 'BLEND', 'CRAFT', 'DREAM', 'EARTH', 'FRESH', 'GRACE',
        'HEART', 'IMAGE', 'JUDGE', 'KNOWN', 'LIGHT', 'MUSIC', 'NIGHT', 'POWER',
        'QUEST', 'RIVER', 'SPACE', 'TRAIN', 'URBAN', 'VALUE', 'WATER', 'XEROX'
    ];
    
    // Select a random word
    gameState.targetWord = words[Math.floor(Math.random() * words.length)];
    console.log('Target word:', gameState.targetWord); // For debugging
}

// Handle key press
function handleKeyPress(key) {
    if (gameState.gameOver) return;
    
    if (key === 'enter') {
        submitGuess();
    } else if (key === 'backspace') {
        deleteLetter();
    } else if (/^[a-z]$/.test(key) && gameState.currentTile < WORD_LENGTH) {
        addLetter(key.toUpperCase());
    }
}

// Add letter to the current tile
function addLetter(letter) {
    if (gameState.currentTile < WORD_LENGTH) {
        const tile = document.querySelector(`.tile[data-row='${gameState.currentRow}'][data-col='${gameState.currentTile}']`);
        tile.textContent = letter;
        tile.classList.add('filled');
        gameState.currentTile++;
        playSound('type');
    }
}

// Delete letter from the current tile
function deleteLetter() {
    if (gameState.currentTile > 0) {
        gameState.currentTile--;
        const tile = document.querySelector(`.tile[data-row='${gameState.currentRow}'][data-col='${gameState.currentTile}']`);
        tile.textContent = '';
        tile.classList.remove('filled');
        playSound('delete');
    }
}

// Submit the current guess
function submitGuess() {
    if (gameState.currentTile < WORD_LENGTH) {
        showMessage('Not enough letters!', 'warning');
        playSound('error');
        return;
    }
    
    // Get the current guess
    let guess = '';
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = document.querySelector(`.tile[data-row='${gameState.currentRow}'][data-col='${i}']`);
        guess += tile.textContent;
    }
    
    // Check if this word has already been guessed
    if (gameState.guesses.includes(guess)) {
        // Shake the current row to indicate duplicate word
        const currentRow = document.querySelector(`.row[data-row='${gameState.currentRow}']`);
        currentRow.classList.add('shake');
        
        // Remove the shake class after animation completes
        setTimeout(() => {
            currentRow.classList.remove('shake');
        }, 500);
        
        showMessage('You already tried this word!', 'warning');
        playSound('error');
        return;
    }
    
    // Check if the guess is a valid word in our dictionary
    if (!VALID_GUESSES.includes(guess.toLowerCase()) && !VALID_WORDS.includes(guess.toLowerCase())) {
        // Shake the current row to indicate invalid word
        const currentRow = document.querySelector(`.row[data-row='${gameState.currentRow}']`);
        currentRow.classList.add('shake');
        
        // Remove the shake class after animation completes
        setTimeout(() => {
            currentRow.classList.remove('shake');
        }, 500);
        
        showMessage('Not in word list!', 'warning');
        playSound('error');
        return;
    }
    
    // Store the guess
    gameState.guesses.push(guess);
    
    // Evaluate the guess
    evaluateGuess(guess);
}

// Evaluate the current guess
function evaluateGuess(guess) {
    const targetWord = gameState.targetWord;
    const result = [];
    const letterCounts = {};
    
    // Count the occurrences of each letter in the target word
    for (let i = 0; i < targetWord.length; i++) {
        const letter = targetWord[i];
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }
    
    // First pass: mark correct letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        const guessLetter = guess[i];
        const targetLetter = targetWord[i];
        
        if (guessLetter === targetLetter) {
            result[i] = 'correct';
            letterCounts[guessLetter]--;
        } else {
            result[i] = null;
        }
    }
    
    // Second pass: mark present and absent letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (result[i] === null) {
            const guessLetter = guess[i];
            
            if (letterCounts[guessLetter] && letterCounts[guessLetter] > 0) {
                result[i] = 'present';
                letterCounts[guessLetter]--;
            } else {
                result[i] = 'absent';
            }
        }
    }
    
    // Animate the evaluation
    animateEvaluation(result, guess);
    
    return result;
}

// Animate the evaluation of the guess
function animateEvaluation(result, guess) {
    playSound('evaluate');
    
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = document.querySelector(`.tile[data-row='${gameState.currentRow}'][data-col='${i}']`);
        
        // Add a delay to create a sequential animation
        setTimeout(() => {
            // Add flip animation
            tile.classList.add('flip');
            
            // Add the evaluation class after half the flip animation
            setTimeout(() => {
                // Add the evaluation class
                tile.classList.add(result[i]);
                
                // Play the appropriate sound
                playSound(result[i]);
                
                // If this is the last tile, update keyboard and check game state
                if (i === WORD_LENGTH - 1) {
                    setTimeout(() => {
                        // Update keyboard with staggered animation
                        updateKeyboard(guess, result);
                        
                        // Check game state after all animations
                        setTimeout(() => {
                            checkGameState();
                        }, 500);
                    }, 300);
                }
            }, 150); // Half of the flip animation duration
        }, i * 300); // 300ms delay between each tile
    }
}

// Update keyboard with staggered animation
function updateKeyboard(guess, result) {
    // Store keys to update for staggered animation
    const keysToUpdate = [];
    
    // Collect keyboard keys to update
    for (let i = 0; i < WORD_LENGTH; i++) {
        const letter = guess[i].toLowerCase();
        const key = document.querySelector(`.key[data-key="${letter}"]`);
        
        if (key) {
            keysToUpdate.push({
                key: key,
                result: result[i],
                letter: letter
            });
        }
    }
    
    // Update keyboard keys with staggered animation
    keysToUpdate.forEach((item, index) => {
        setTimeout(() => {
            // Only update if the current state is better than the previous state
            if (item.result === 'correct') {
                item.key.classList.remove('present', 'absent');
                item.key.classList.add('correct');
            } else if (item.result === 'present' && !item.key.classList.contains('correct')) {
                item.key.classList.remove('absent');
                item.key.classList.add('present');
            } else if (item.result === 'absent' && !item.key.classList.contains('correct') && !item.key.classList.contains('present')) {
                item.key.classList.add('absent');
            }
        }, index * 100); // Staggered delay for keyboard animation
    });
}

// Check the game state after a guess
function checkGameState() {
    const currentGuess = gameState.guesses[gameState.currentRow];
    
    if (currentGuess === gameState.targetWord) {
        // Win condition
        gameState.gameOver = true;
        showMessage('Congratulations!', 'success');
        playSound('win');
        updateStatistics(true);
        setTimeout(() => {
            updateStatsDisplay();
            statsModalInstance.show();
        }, 1500);
    } else if (gameState.currentRow === MAX_ATTEMPTS - 1) {
        // Lose condition
        gameState.gameOver = true;
        showMessage(`Game over! The word was ${gameState.targetWord}`, 'danger');
        updateStatistics(false);
        setTimeout(() => {
            updateStatsDisplay();
            statsModalInstance.show();
        }, 1500);
    } else {
        // Move to the next row
        gameState.currentRow++;
        gameState.currentTile = 0;
    }
}

// Show a message to the user
function showMessage(text, type = 'info') {
    showToast(text, type);
}

// Show a toast notification
function showToast(message, type = 'info', duration = 2000) {
    const toast = document.createElement('div');
    toast.classList.add('toast', 'show', `bg-${type}`, 'text-white');
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="toast-header bg-${type} text-white">
            <strong class="me-auto">WORDVERSE Puzzle</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Initialize Bootstrap toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: duration
    });
    
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
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
    
    // Select a new random word
    selectRandomWord();
    
    // Clear the game board
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.textContent = '';
        tile.className = 'tile';
    });
    
    // Reset the keyboard
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.className = 'key';
    });
    
    // Show a message
    showMessage('New game started!', 'success');
    playSound('type');
}

// Load statistics from local storage
function loadStatistics() {
    const savedStats = localStorage.getItem('wordleStats');
    if (savedStats) {
        statistics = JSON.parse(savedStats);
    }
}

// Save statistics to local storage
function saveStatistics() {
    localStorage.setItem('wordleStats', JSON.stringify(statistics));
}

// Update statistics after a game
function updateStatistics(won) {
    statistics.gamesPlayed++;
    
    if (won) {
        statistics.gamesWon++;
        statistics.currentStreak++;
        statistics.guessDistribution[gameState.currentRow]++;
        
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
    // Update statistics numbers
    document.getElementById('games-played').textContent = statistics.gamesPlayed;
    document.getElementById('win-percentage').textContent = statistics.gamesPlayed > 0 
        ? Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100) + '%' 
        : '0%';
    document.getElementById('current-streak').textContent = statistics.currentStreak;
    document.getElementById('max-streak').textContent = statistics.maxStreak;
    
    // Update guess distribution
    const distributionContainer = document.getElementById('guess-distribution');
    distributionContainer.innerHTML = '';
    
    const maxGuesses = Math.max(...statistics.guessDistribution);
    
    for (let i = 0; i < statistics.guessDistribution.length; i++) {
        const count = statistics.guessDistribution[i];
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
}

// Create share text
function createShareText() {
    let shareText = `WORDVERSE Puzzle ${new Date().toLocaleDateString()}\n`;
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
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    
    // Select and copy the text
    textarea.select();
    document.execCommand('copy');
    
    // Remove the temporary textarea
    document.body.removeChild(textarea);
}
