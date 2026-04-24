# CodeAlpha Internship Tasks 🚀

# 🧮 Multi-Mode Calculator

A feature-rich, beautifully designed calculator with **16 different modes** — built entirely in **vanilla HTML, CSS & JavaScript**. No frameworks, no libraries, just clean web fundamentals.

🔗 **[Live Demo](https://saman767.github.io/codealpha_tasks/)**

---

## ✨ Features

### 🎨 Modern Glassmorphism UI
- Frosted glass effect with backdrop blur
- Deep purple cosmic background with floating neon blobs
- Magenta neon glow on the equals button
- Smooth animations and micro-interactions
- Fully responsive across mobile, tablet & desktop
- Optimized for iOS Safari (no auto-zoom, no rubber-band scroll)

### 🔢 16 Calculator Modes

#### Calculator Modes (4)
| Mode | Highlights |
|------|-----------|
| **Standard** | Basic arithmetic, percentage, square, square root, reciprocal |
| **Scientific** | Trigonometry (sin/cos/tan + inverse), logarithms, factorial, π, e, exp, power, modulo, DEG/RAD toggle |
| **Programmer** | Bitwise operations (AND, OR, XOR, NOT, NAND, shifts), 4-base live conversion (HEX ⇄ DEC ⇄ OCT ⇄ BIN), **BigInt** for overflow-free integers |
| **Date Calculator** | Difference between two dates with year/month/day breakdown |

#### Unit Converters (12)
Volume - Length - Weight & Mass - Temperature - Energy - Area - Speed - Time - Power - Data - Pressure - Angle

#### Currency Converter (1)
Static rates for USD, PKR, EUR, GBP, INR, AED, SAR & more

### 📜 History Panel
- Slides in from the right with frosted glass effect
- Auto-saves every calculation (`expression = result`)
- Click any entry to copy the result to clipboard
- Persists across page refreshes via **localStorage**
- Stores up to 50 most recent entries
- Clear-all option

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Markup | HTML5 |
| Styling | CSS3 (Grid, Flexbox, `backdrop-filter`, custom properties) |
| Logic | Vanilla JavaScript (ES6+, BigInt, localStorage) |
| Icons | [Remix Icon](https://remixicon.com/) |
| Fonts | Poppins, Inter |

**Zero dependencies. Zero frameworks. Zero build step.**

---



## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/Saman767/codealpha_tasks.git

# Navigate to this task
cd codealpha_tasks/task-1-calculator

# Open in browser (no build needed!)
open index.html       # macOS
start index.html      # Windows
xdg-open index.html   # Linux
