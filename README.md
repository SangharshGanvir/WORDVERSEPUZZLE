# WORDVERSE Puzzle

A modern, feature-rich word guessing game inspired by Wordle, built with HTML, CSS, and JavaScript.

![WORDVERSE Puzzle](https://i.imgur.com/placeholder.png)

## 🎮 Play Now

Visit [WORDVERSE Puzzle](https://wordverse-puzzle.com) to play the game online, or clone this repository to run it locally.

## ✨ Features

- **Core Gameplay**: Guess a 5-letter word in six attempts
- **Visual Feedback**: Color-coded tiles show correct letters and positions
- **Modern UI**: Featuring glassmorphism, neumorphism, and gradient designs
- **Responsive Design**: Play on any device with a fully responsive layout
- **Dark Mode**: Toggle between light and dark themes
- **Statistics Tracking**: Track your win rate and guess distribution
- **Share Results**: Share your game results on social media
- **Sound Effects**: Immersive audio feedback for game actions
- **Animations**: Engaging animations for tile reveals and wins
- **Confetti Celebration**: Visual celebration for successful guesses

## 🚀 Technologies Used

- **HTML5**: Semantic markup for structure
- **CSS3**: Modern styling with custom properties and animations
- **JavaScript**: Core game logic and interactivity
- **Font Awesome**: Icons for enhanced UI
- **Google Fonts**: Typography with Roboto font family
- **LocalStorage API**: Save game state and user preferences
- **Clipboard API**: Copy results to clipboard for sharing

## 🛠️ Installation & Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/wordverse-puzzle.git
   ```

2. Navigate to the project directory:
   ```
   cd wordverse-puzzle
   ```

3. Open `index.html` in your browser or use a local server:
   ```
   python -m http.server
   ```

4. Visit `http://localhost:8000` in your browser

## 🎯 How to Play

1. Type a 5-letter word and press ENTER to submit
2. After each guess, the tiles will change color:
   - **Green**: Letter is correct and in the right position
   - **Yellow**: Letter is in the word but in the wrong position
   - **Gray**: Letter is not in the word
3. Try to guess the word in six attempts or fewer

## 🎨 Customization

The game uses CSS custom properties for easy customization:

```css
:root {
  --correct-color: #6aaa64;
  --present-color: #c9b458;
  --absent-color: #787c7e;
  /* More variables available in the CSS files */
}
```

## 📱 Mobile Support

WORDVERSE Puzzle is fully responsive and works on all devices:
- **Desktop**: Full keyboard support with physical keyboard
- **Mobile**: On-screen keyboard for touch input
- **Tablet**: Optimized layout for medium-sized screens

## 🔄 Future Enhancements

- Daily challenges with unique words
- Custom word length options
- Multiplayer mode
- Difficulty levels
- Word definitions after completion
- Achievement system

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Created By

Designed & Developed by Joker Designs

---

Enjoy playing WORDVERSE Puzzle! Feel free to contribute or provide feedback.
