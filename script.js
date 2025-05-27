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

// DOM elements
const gameBoard = document.getElementById('game-board');
const keyboard = document.getElementById('keyboard');
const messageElement = document.getElementById('message');
const modal = document.getElementById('modal');
const statsModal = document.getElementById('stats-modal');
const shareGameModal = document.getElementById('share-game-modal');
const howToPlayButton = document.getElementById('how-to-play');
const showStatsButton = document.getElementById('show-stats');
const shareGameButton = document.getElementById('share-game');
const toggleThemeButton = document.getElementById('toggle-theme');
const soundToggleButton = document.getElementById('sound-toggle');
const resetGameButton = document.getElementById('reset-game');
const closeModalButton = document.querySelector('.close');
const closeStatsButton = document.querySelector('.stats-close');
const shareContainer = document.getElementById('share-container');
const shareButton = document.getElementById('share-button');
const shareText = document.getElementById('share-text');
const toastContainer = document.getElementById('toast-container');

// Constants
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

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
            handleKeyPress(key);
        }
    });
    
    // Physical keyboard
    document.addEventListener('keydown', (e) => {
        if (gameState.gameOver) return;
        
        const key = e.key.toLowerCase();
        
        if (key === 'enter') {
            e.preventDefault(); // Prevent default Enter key behavior
            handleKeyPress('enter');
        } else if (key === 'backspace' || key === 'delete') {
            e.preventDefault(); // Prevent default Backspace key behavior
            handleKeyPress('backspace');
        } else if (/^[a-z]$/.test(key)) {
            handleKeyPress(key);
        }
    });
    
    // How to play button
    howToPlayButton.addEventListener('click', () => {
        modal.classList.remove('hidden');
    });
    
    // Show stats button
    showStatsButton.addEventListener('click', () => {
        // Update basic stats
        document.getElementById('games-played').textContent = statistics.gamesPlayed;
        document.getElementById('win-percentage').textContent = statistics.gamesPlayed > 0 
            ? Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100) 
            : 0;
        document.getElementById('current-streak').textContent = statistics.currentStreak;
        document.getElementById('max-streak').textContent = statistics.maxStreak;
        
        // Update distribution display
        updateDistributionDisplay();
        
        // Show the modal
        statsModal.classList.remove('hidden');
        playSound('click');
    });
    
    // Toggle theme button
    toggleThemeButton.addEventListener('click', toggleTheme);
    
    // Toggle sound button
    soundToggleButton.addEventListener('click', toggleSound);
    
    // Reset game button
    resetGameButton.addEventListener('click', resetGame);
    
    // Close modals
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => {
            modal.classList.add('hidden');
            playSound('click');
        });
    } else {
        // Fallback in case the close button wasn't found
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                // Find the closest modal parent
                const modalElement = e.target.closest('.modern-modal');
                if (modalElement) {
                    modalElement.classList.add('hidden');
                    playSound('click');
                }
            });
        });
    }
    
    // Start playing button in help modal
    const startPlayingBtn = document.querySelector('.start-playing-btn');
    if (startPlayingBtn) {
        startPlayingBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            playSound('click');
        });
    }
    
    closeStatsButton.addEventListener('click', () => {
        statsModal.classList.add('hidden');
    });
    
    // Click outside modals to close
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
        if (e.target === statsModal) {
            statsModal.classList.add('hidden');
        }
    });
    
    // Share button
    shareButton.addEventListener('click', () => {
        const shareResult = createShareText();
    });
    
    // Share modal close button
    const shareModalCloseBtn = document.querySelector('.share-modal-close');
    if (shareModalCloseBtn) {
        shareModalCloseBtn.addEventListener('click', () => {
            document.getElementById('share-modal').classList.add('hidden');
            playSound('click');
        });
    }
    
    // Click outside share modal to close
    window.addEventListener('click', (e) => {
        const shareModal = document.getElementById('share-modal');
        if (e.target === shareModal) {
            shareModal.classList.add('hidden');
        }
    });
    
    // Copy results button in share modal
    const copyResultsBtn = document.getElementById('copy-results');
    if (copyResultsBtn) {
        copyResultsBtn.addEventListener('click', () => {
            copyToClipboard(shareText.textContent);
            playSound('click');
        });
    }
    
    // Twitter share button
    const twitterShareBtn = document.getElementById('share-twitter');
    if (twitterShareBtn) {
        twitterShareBtn.addEventListener('click', () => {
            const twitterText = encodeURIComponent(shareText.textContent);
            window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, '_blank');
            playSound('click');
        });
    }
    
    // Facebook share button
    const facebookShareBtn = document.getElementById('share-facebook');
    if (facebookShareBtn) {
        facebookShareBtn.addEventListener('click', () => {
            const url = encodeURIComponent('https://wordverse-puzzle.com');
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
            playSound('click');
        });
    }
    
    // WhatsApp share button
    const whatsappShareBtn = document.getElementById('share-whatsapp');
    if (whatsappShareBtn) {
        whatsappShareBtn.addEventListener('click', () => {
            const whatsappText = encodeURIComponent(shareText.textContent);
            window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
            playSound('click');
        });
    }
    
    // Share Game button in header
    if (shareGameButton) {
        shareGameButton.addEventListener('click', () => {
            shareGameModal.classList.remove('hidden');
            playSound('click');
        });
    }
    
    // Share Game modal close button
    const shareGameModalCloseBtn = document.querySelector('.share-game-modal-close');
    if (shareGameModalCloseBtn) {
        shareGameModalCloseBtn.addEventListener('click', () => {
            shareGameModal.classList.add('hidden');
            playSound('click');
        });
    }
    
    // Click outside share game modal to close
    window.addEventListener('click', (e) => {
        if (e.target === shareGameModal) {
            shareGameModal.classList.add('hidden');
        }
    });
    
    // Copy game link button
    const copyGameLinkBtn = document.getElementById('copy-game-link');
    if (copyGameLinkBtn) {
        copyGameLinkBtn.addEventListener('click', () => {
            const gameLink = document.getElementById('game-link').value;
            copyToClipboard(gameLink);
            playSound('click');
            showToast('Game link copied to clipboard!', 'success');
        });
    }
    
    // Share Game social media buttons
    const shareGameTwitterBtn = document.getElementById('share-game-twitter');
    if (shareGameTwitterBtn) {
        shareGameTwitterBtn.addEventListener('click', () => {
            const tweetText = encodeURIComponent('Check out WORDVERSE Puzzle - a daily word game that challenges your vocabulary! Play at: https://wordverse-puzzle.com');
            window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
            playSound('click');
        });
    }
    
    const shareGameFacebookBtn = document.getElementById('share-game-facebook');
    if (shareGameFacebookBtn) {
        shareGameFacebookBtn.addEventListener('click', () => {
            const url = encodeURIComponent('https://wordverse-puzzle.com');
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
            playSound('click');
        });
    }
    
    const shareGameWhatsAppBtn = document.getElementById('share-game-whatsapp');
    if (shareGameWhatsAppBtn) {
        shareGameWhatsAppBtn.addEventListener('click', () => {
            const whatsappText = encodeURIComponent('Check out WORDVERSE Puzzle - a daily word game that challenges your vocabulary! Play at: https://wordverse-puzzle.com');
            window.open(`https://wa.me/?text=${whatsappText}`, '_blank');
            playSound('click');
        });
    }
    
    const shareGameEmailBtn = document.getElementById('share-game-email');
    if (shareGameEmailBtn) {
        shareGameEmailBtn.addEventListener('click', () => {
            const subject = encodeURIComponent('Check out WORDVERSE Puzzle!');
            const body = encodeURIComponent('I found this awesome word game called WORDVERSE Puzzle. It challenges your vocabulary with a new puzzle every day!\n\nPlay at: https://wordverse-puzzle.com');
            window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
            playSound('click');
        });
    }
}

// Select a random target word
function selectRandomWord() {
    const randomIndex = Math.floor(Math.random() * VALID_WORDS.length);
    gameState.targetWord = VALID_WORDS[randomIndex].toLowerCase();
    // console.log('Target word:', gameState.targetWord); // For debugging
}

// Handle key press
function handleKeyPress(key) {
    if (gameState.gameOver) return;
    
    if (key === 'enter') {
        submitGuess();
    } else if (key === 'backspace') {
        deleteLetter();
    } else if (/^[a-z]$/.test(key) && gameState.currentTile < WORD_LENGTH) {
        addLetter(key);
    }
}

// Add a letter to the current tile
function addLetter(letter) {
    if (gameState.currentTile < WORD_LENGTH) {
        const tile = document.querySelector(`.tile[data-row="${gameState.currentRow}"][data-col="${gameState.currentTile}"]`);
        tile.textContent = letter.toUpperCase();
        tile.classList.add('filled');
        
        // Add key press animation to the keyboard
        const key = document.querySelector(`.key[data-key="${letter}"]`);
        key.classList.add('pressed');
        setTimeout(() => {
            key.classList.remove('pressed');
        }, 150);
        
        // Play sound
        playSound('type');
        
        gameState.currentTile++;
    }
}

// Delete the last letter
function deleteLetter() {
    if (gameState.currentTile > 0) {
        gameState.currentTile--;
        const tile = document.querySelector(`.tile[data-row="${gameState.currentRow}"][data-col="${gameState.currentTile}"]`);
        tile.textContent = '';
        tile.classList.remove('filled');
        
        // Add key press animation to the backspace key
        const key = document.querySelector(`.key[data-key="backspace"]`);
        key.classList.add('pressed');
        setTimeout(() => {
            key.classList.remove('pressed');
        }, 150);
        
        // Play sound
        playSound('delete');
    }
}

// Submit the current guess
function submitGuess() {
    if (gameState.currentTile !== WORD_LENGTH) {
        showMessage("Not enough letters");
        shakeRow(gameState.currentRow);
        return;
    }
    
    // Get the current guess
    let guess = '';
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = document.querySelector(`.tile[data-row="${gameState.currentRow}"][data-col="${i}"]`);
        guess += tile.textContent.toLowerCase();
    }
    
    // Check if the guess is a valid word
    if (!VALID_WORDS.includes(guess) && !VALID_GUESSES.includes(guess)) {
        showMessage("Not in word list");
        shakeRow(gameState.currentRow);
        return;
    }
    
    // Add the guess to the guesses array
    gameState.guesses.push(guess);
    
    // Check the guess
    checkGuess(guess);
    
    // Move to the next row
    gameState.currentRow++;
    gameState.currentTile = 0;
    
    // Check if the game is over
    if (guess === gameState.targetWord) {
        gameState.gameOver = true;
        setTimeout(() => {
            showMessage(getWinMessage());
            // Update statistics for win
            updateStatisticsForWin();
            // Show share container
            createShareText();
            shareContainer.classList.remove('hidden');
            // Show statistics
            setTimeout(() => {
                updateStatsDisplay();
                statsModal.classList.remove('hidden');
            }, 1500);
        }, WORD_LENGTH * 100 + 500);
        return;
    }
    
    if (gameState.currentRow >= MAX_ATTEMPTS) {
        gameState.gameOver = true;
        setTimeout(() => {
            showMessage(`Game over! The word was ${gameState.targetWord.toUpperCase()}`);
            // Update statistics for loss
            updateStatisticsForLoss();
        }, WORD_LENGTH * 100 + 500);
    }
}

// Check the guess against the target word
function checkGuess(guess) {
    // Ensure the target word is properly set
    if (!gameState.targetWord || gameState.targetWord.length !== WORD_LENGTH) {
        console.error('Target word is not properly set:', gameState.targetWord);
        selectRandomWord(); // Try to select a new word if there's an issue
    }
    
    const targetLetters = gameState.targetWord.split('');
    const guessLetters = guess.split('');
    
    // First pass: Mark correct letters
    const correctPositions = new Set();
    const letterCounts = {};
    
    // Count occurrences of each letter in the target word
    for (const letter of targetLetters) {
        letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }
    
    // Add a slight delay before starting animations
    playSound('evaluate');
    
    // First pass: Mark correct letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = document.querySelector(`.tile[data-row="${gameState.currentRow}"][data-col="${i}"]`);
        const letter = guessLetters[i];
        
        if (letter === targetLetters[i]) {
            // Correct position
            setTimeout(() => {
                // Set reveal background color
                document.documentElement.style.setProperty('--reveal-bg', 'var(--correct-color)');
                
                // Add reveal animation
                tile.classList.add('reveal');
                
                setTimeout(() => {
                    tile.classList.add('correct');
                    playSound('correct');
                }, 250);
            }, i * 150);
            
            correctPositions.add(i);
            letterCounts[letter]--;
            
            // Update keyboard
            const key = document.querySelector(`.key[data-key="${letter}"]`);
            setTimeout(() => {
                key.classList.remove('present');
                key.classList.add('correct');
            }, (WORD_LENGTH + 1) * 100);
        }
    }
    
    // Second pass: Mark present and absent letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (correctPositions.has(i)) continue;
        
        const tile = document.querySelector(`.tile[data-row="${gameState.currentRow}"][data-col="${i}"]`);
        const letter = guessLetters[i];
        const key = document.querySelector(`.key[data-key="${letter}"]`);
        
        setTimeout(() => {
            // Set the appropriate reveal background color
            if (letterCounts[letter] > 0) {
                document.documentElement.style.setProperty('--reveal-bg', 'var(--present-color)');
            } else {
                document.documentElement.style.setProperty('--reveal-bg', 'var(--absent-color)');
            }
            
            // Add reveal animation
            tile.classList.add('reveal');
            
            setTimeout(() => {
                if (letterCounts[letter] > 0) {
                    // Letter is in the word but in the wrong position
                    tile.classList.add('present');
                    letterCounts[letter]--;
                    playSound('present');
                    
                    // Update keyboard if not already marked as correct
                    if (!key.classList.contains('correct')) {
                        key.classList.add('present');
                    }
                } else {
                    // Letter is not in the word
                    tile.classList.add('absent');
                    playSound('absent');
                    
                    // Update keyboard if not already marked
                    if (!key.classList.contains('correct') && !key.classList.contains('present')) {
                        key.classList.add('absent');
                    }
                }
            }, 250);
        }, i * 150);
    }
}

// Show a message to the user
function showMessage(message) {
    messageElement.textContent = message;
    messageElement.classList.remove('hidden');
    
    // Add fade-in animation
    messageElement.classList.add('fade-in-down');
    
    setTimeout(() => {
        messageElement.classList.remove('fade-in-down');
        messageElement.classList.add('hidden');
    }, 2000);
}

// Show a toast notification
function showToast(message, type = 'info', duration = 3000) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Create toast content - optimized icon selection
    const icons = {
        'success': '<i class="fas fa-check-circle"></i>',
        'error': '<i class="fas fa-exclamation-circle"></i>',
        'warning': '<i class="fas fa-exclamation-triangle"></i>',
        'info': '<i class="fas fa-info-circle"></i>'
    };
    const icon = icons[type] || icons['info'];
    
    // Set toast content
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Add close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Show the toast (delayed to allow animation)
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
    
    // Play appropriate sound
    if (type === 'success') playSound('correct');
    else if (type === 'error') playSound('error');
    else if (type === 'warning') playSound('present');
    else playSound('type');
}

// Shake a row to indicate an error
function shakeRow(row) {
    const rowElement = document.querySelector(`.row:nth-child(${row + 1})`);
    rowElement.classList.add('shake');
    
    // Play error sound
    playSound('error');
    
    setTimeout(() => {
        rowElement.classList.remove('shake');
    }, 500);
}

// Get a random win message
function getWinMessage() {
    const messages = [
        "Genius!",
        "Magnificent!",
        "Impressive!",
        "Splendid!",
        "Great!",
        "Phew!"
    ];
    
    return messages[Math.min(gameState.currentRow, messages.length - 1)];
}

// Reset the game
function resetGame() {
    gameState = {
        targetWord: '',
        currentRow: 0,
        currentTile: 0,
        gameOver: false,
        guesses: [],
        darkMode: gameState.darkMode
    };
    
    // Reset the keyboard
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
    
    // Create a new game board
    createGameBoard();
    
    // Select a new target word
    selectRandomWord();
    
    // Hide share container
    shareContainer.classList.add('hidden');
}

// Toggle dark/light theme
function toggleTheme() {
    // Add transition class to body
    document.body.classList.add('theme-transition');
    
    // Toggle dark mode
    gameState.darkMode = !gameState.darkMode;
    document.documentElement.setAttribute('data-theme', gameState.darkMode ? 'dark' : 'light');
    toggleThemeButton.innerHTML = gameState.darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    localStorage.setItem('darkMode', gameState.darkMode);
    
    // Play sound
    playSound('theme');
    
    // Show toast
    showToast(
        gameState.darkMode ? 'Dark mode activated' : 'Light mode activated',
        'info'
    );
    
    // Remove transition class
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
}

// Toggle sound on/off
function toggleSound() {
    soundMuted = !soundMuted;
    localStorage.setItem('soundMuted', soundMuted);
    
    // Update icon
    soundToggleButton.innerHTML = soundMuted ? 
        '<i class="fas fa-volume-mute"></i>' : 
        '<i class="fas fa-volume-up"></i>';
    
    // Play sound if unmuting
    if (!soundMuted) {
        playSound('theme');
    }
    
    // Show toast
    showToast(
        soundMuted ? 'Sound muted' : 'Sound enabled',
        soundMuted ? 'warning' : 'success'
    );
}

// Load statistics from local storage
function loadStatistics() {
    const savedStats = localStorage.getItem('statistics');
    if (savedStats) {
        try {
            const parsedStats = JSON.parse(savedStats);
            statistics = {
                gamesPlayed: parsedStats.gamesPlayed || 0,
                gamesWon: parsedStats.gamesWon || 0,
                currentStreak: parsedStats.currentStreak || 0,
                maxStreak: parsedStats.maxStreak || 0,
                guessDistribution: parsedStats.guessDistribution || [0, 0, 0, 0, 0, 0]
            };
        } catch (e) {
            console.error('Error parsing statistics:', e);
            // Reset to defaults if there's an error
            statistics = {
                gamesPlayed: 0,
                gamesWon: 0,
                currentStreak: 0,
                maxStreak: 0,
                guessDistribution: [0, 0, 0, 0, 0, 0]
            };
        }
    }
}

// Save statistics to local storage
function saveStatistics() {
    localStorage.setItem('statistics', JSON.stringify(statistics));
}

// Update statistics display in the modal
function updateStatsDisplay() {
    // Update basic stats
    document.getElementById('games-played').textContent = statistics.gamesPlayed;
    document.getElementById('win-percentage').textContent = statistics.gamesPlayed > 0 
        ? Math.round((statistics.gamesWon / statistics.gamesPlayed) * 100) 
        : 0;
    document.getElementById('current-streak').textContent = statistics.currentStreak;
    document.getElementById('max-streak').textContent = statistics.maxStreak;
    
    // Update guess distribution
    const distributionContainer = document.getElementById('guess-distribution');
    distributionContainer.innerHTML = '';
    
    // Find the max value for scaling
    const maxValue = Math.max(...statistics.guessDistribution, 1);
    
    // Create bars for each guess number
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'distribution-row';
        
        const label = document.createElement('div');
        label.className = 'distribution-label';
        label.textContent = (i + 1).toString();
        
        const bar = document.createElement('div');
        bar.className = 'distribution-bar';
        
        const barValue = document.createElement('div');
        barValue.className = 'distribution-bar-value';
        const percentage = (statistics.guessDistribution[i] / maxValue) * 100;
        barValue.style.width = `${Math.max(percentage, 5)}%`;
        
        // Highlight the current game's guess row
        if (gameState.gameOver && gameState.currentRow === i + 1) {
            barValue.classList.add('current-guess');
        }
        
        const count = document.createElement('div');
        count.className = 'distribution-count';
        count.textContent = statistics.guessDistribution[i].toString();
        
        barValue.appendChild(count);
        bar.appendChild(barValue);
        row.appendChild(label);
        row.appendChild(bar);
        distributionContainer.appendChild(row);
    }
}

// Update statistics for a win
function updateStatisticsForWin() {
    statistics.gamesPlayed++;
    statistics.gamesWon++;
    statistics.currentStreak++;
    statistics.maxStreak = Math.max(statistics.maxStreak, statistics.currentStreak);
    statistics.guessDistribution[gameState.currentRow - 1]++;
    saveStatistics();
    
    // Play win sound
    playSound('win');
    
    // Create confetti effect
    createConfetti();
    
    // Show win toast
    const attempts = gameState.currentRow;
    let message = '';
    
    if (attempts === 1) {
        message = 'Genius! Got it in 1 attempt!';
    } else if (attempts === 2) {
        message = 'Magnificent! Solved in 2 attempts!';
    } else if (attempts === 3) {
        message = 'Impressive! Solved in 3 attempts!';
    } else if (attempts === 4) {
        message = 'Splendid! Solved in 4 attempts!';
    } else if (attempts === 5) {
        message = 'Great! Solved in 5 attempts!';
    } else {
        message = 'Phew! Solved in 6 attempts!';
    }
    
    setTimeout(() => {
        showToast(message, 'success', 5000);
    }, 1500);
}

// Update statistics for a loss
function updateStatisticsForLoss() {
    statistics.gamesPlayed++;
    statistics.currentStreak = 0;
    saveStatistics();
    
    // Show loss toast
    setTimeout(() => {
        showToast(`Better luck next time! The word was ${gameState.targetWord.toUpperCase()}`, 'error', 5000);
    }, 1500);
}

// Additional function for updating distribution display
function updateDistributionDisplay() {
    const distributionContainer = document.getElementById('guess-distribution');
    distributionContainer.innerHTML = '';
    
    const maxCount = Math.max(...statistics.guessDistribution, 1);
    
    for (let i = 0; i < statistics.guessDistribution.length; i++) {
        const count = statistics.guessDistribution[i];
        const percentage = Math.max(Math.round((count / maxCount) * 100), 4);
        
        const row = document.createElement('div');
        row.classList.add('guess-row');
        
        const label = document.createElement('div');
        label.classList.add('guess-label');
        label.textContent = i + 1;
        
        const bar = document.createElement('div');
        bar.classList.add('guess-bar');
        if (gameState.gameOver && gameState.guesses.includes(gameState.targetWord) && gameState.currentRow - 1 === i) {
            bar.classList.add('current');
        }
        bar.style.width = `${percentage}%`;
        bar.textContent = count;
        
        row.appendChild(label);
        row.appendChild(bar);
        distributionContainer.appendChild(row);
    }
}

// Create share text
function createShareText() {
    let result = `WORDVERSE Puzzle ${gameState.currentRow}/${MAX_ATTEMPTS}\n\n`;
    
    for (let i = 0; i < gameState.guesses.length; i++) {
        const guess = gameState.guesses[i];
        let rowResult = '';
        
        for (let j = 0; j < guess.length; j++) {
            const letter = guess[j];
            if (letter === gameState.targetWord[j]) {
                rowResult += '🟩'; // Correct
            } else if (gameState.targetWord.includes(letter)) {
                rowResult += '🟨'; // Present
            } else {
                rowResult += '⬛'; // Absent
            }
        }
        
        result += rowResult + '\n';
    }
    
    // Add URL to the game
    result += '\nPlay at: https://wordverse-puzzle.com';
    
    // Update share text element
    shareText.textContent = result;
    shareText.classList.remove('hidden');
    
    // Prepare and show share modal
    prepareShareModal(result);
    
    return result;
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            // Play sound
            playSound('copy');
            // Pulse the share button
            const shareBtn = document.getElementById('share-button');
            shareBtn.classList.add('pulse');
            setTimeout(() => {
                shareBtn.classList.remove('pulse');
            }, 1500);
            
            showToast('Results copied to clipboard!', 'success');
        })
        .catch(err => {
            console.error('Could not copy text: ', err);
            showToast('Failed to copy to clipboard', 'error');
        });
}

// Prepare share modal with game results
function prepareShareModal(shareText) {
    const shareModal = document.getElementById('share-modal');
    const shareGrid = document.getElementById('share-grid');
    const shareAttempts = document.getElementById('share-attempts');
    
    // Clear previous content
    shareGrid.innerHTML = '';
    
    // Set attempts
    shareAttempts.textContent = `${gameState.currentRow}/${MAX_ATTEMPTS}`;
    
    // Set time (placeholder - could be implemented with actual game time tracking)
    document.getElementById('share-time').textContent = getCurrentTime();
    
    // Create visual grid representation
    for (let i = 0; i < gameState.guesses.length; i++) {
        const guess = gameState.guesses[i];
        const row = document.createElement('div');
        row.className = 'share-grid-row';
        
        for (let j = 0; j < guess.length; j++) {
            const letter = guess[j];
            const cell = document.createElement('div');
            cell.className = 'share-grid-cell';
            
            if (letter === gameState.targetWord[j]) {
                cell.classList.add('correct');
            } else if (gameState.targetWord.includes(letter)) {
                cell.classList.add('present');
            } else {
                cell.classList.add('absent');
            }
            
            row.appendChild(cell);
        }
        
        shareGrid.appendChild(row);
    }
    
    // Show the modal
    shareModal.classList.remove('hidden');
}

// Get current time formatted as HH:MM
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Show the instructions modal on first visit
if (!localStorage.getItem('wordleInstructionsShown')) {
    modal.classList.remove('hidden');
    localStorage.setItem('wordleInstructionsShown', 'true');
}

// Create confetti effect for win celebration
function createConfetti() {
    const confettiContainer = document.getElementById('confetti-container');
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    // Clear any existing confetti
    confettiContainer.innerHTML = '';
    
    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        // Random position, color, and size
        const left = Math.random() * 100;
        const width = Math.random() * 10 + 5;
        const height = Math.random() * 10 + 5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const delay = Math.random() * 3;
        const duration = Math.random() * 2 + 3;
        
        // Apply styles
        confetti.style.left = `${left}%`;
        confetti.style.width = `${width}px`;
        confetti.style.height = `${height}px`;
        confetti.style.backgroundColor = color;
        confetti.style.animation = `confetti-fall ${duration}s linear ${delay}s forwards`;
        
        confettiContainer.appendChild(confetti);
    }
    
    // Remove confetti after animation completes
    setTimeout(() => {
        confettiContainer.innerHTML = '';
    }, 6000);
}

// Sound effects system
const sounds = {
    type: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-keyboard-tap-1109.mp3'),
    delete: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-plastic-bubble-click-1343.mp3'),
    error: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3'),
    evaluate: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3'),
    correct: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3'),
    present: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3'),
    absent: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-negative-tone-interface-tap-2301.mp3'),
    win: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'),
    theme: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-cool-interface-click-tone-2568.mp3'),
    copy: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3')
};

// Preload sounds
Object.values(sounds).forEach(sound => {
    sound.load();
    sound.volume = 0.5; // Set volume to 50%
});

// Sound mute state
let soundMuted = localStorage.getItem('soundMuted') === 'true';

// Play sound function
function playSound(soundName) {
    if (!soundMuted && sounds[soundName]) {
        // Create a clone to allow overlapping sounds
        const soundClone = sounds[soundName].cloneNode();
        soundClone.volume = 0.5;
        soundClone.play().catch(e => { /* console.log('Sound play error:', e) */ });
    }
}

// Initialize the game
window.addEventListener('DOMContentLoaded', initializeGame);
