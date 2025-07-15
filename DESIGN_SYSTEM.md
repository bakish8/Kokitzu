# 🎨 Kokitzu Design System

A comprehensive design system for the Kokitzu cryptocurrency dashboard, built with modern CSS and React components.

## 🎯 Design Philosophy

Kokitzu embodies a **"Tesla meets crypto"** aesthetic with:

- **Minimalistic yet futuristic** design language
- **Dark mode default** with soft glowing elements
- **Glassmorphism cards** with backdrop blur effects
- **Neon cyan/purple accents** for a modern tech feel
- **Sleek typography** using Inter and Space Grotesk fonts

## 🎨 Color Palette

### Dark Theme (Default)

```css
--bg-primary: #0a0a0f          /* Deep navy background */
--bg-secondary: #1a1a2e        /* Secondary background */
--bg-tertiary: #16213e         /* Tertiary background */
--bg-card: rgba(26, 26, 46, 0.8) /* Glassmorphism card background */
--bg-card-hover: rgba(26, 26, 46, 0.95) /* Card hover state */

--text-primary: #ffffff         /* Primary text */
--text-secondary: #a0a0b8      /* Secondary text */
--text-tertiary: #6b6b8a       /* Tertiary text */

--accent-primary: #00d4ff      /* Neon cyan */
--accent-secondary: #7c3aed    /* Purple */
--accent-success: #10b981      /* Emerald green */
--accent-warning: #f59e0b      /* Amber */
--accent-error: #ef4444        /* Red */

--border-primary: rgba(255, 255, 255, 0.1) /* Subtle borders */
--border-secondary: rgba(0, 212, 255, 0.2) /* Accent borders */

--glow-primary: 0 0 20px rgba(0, 212, 255, 0.3) /* Cyan glow */
--glow-secondary: 0 0 40px rgba(124, 58, 237, 0.2) /* Purple glow */
```

### Light Theme

```css
--bg-primary: #ffffff          /* Pure white */
--bg-secondary: #f8fafc        /* Light gray */
--bg-tertiary: #f1f5f9         /* Lighter gray */
--bg-card: rgba(255, 255, 255, 0.9) /* Semi-transparent white */
--bg-card-hover: rgba(255, 255, 255, 0.95) /* Hover state */

--text-primary: #0f172a        /* Dark text */
--text-secondary: #475569      /* Medium gray text */
--text-tertiary: #64748b       /* Light gray text */

--border-primary: rgba(0, 0, 0, 0.1) /* Dark borders */
--border-secondary: rgba(0, 212, 255, 0.3) /* Accent borders */
```

## 📝 Typography

### Font Stack

```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-display: 'Space Grotesk', 'Inter', sans-serif
```

### Font Weights

- **300**: Light (for subtle text)
- **400**: Regular (body text)
- **500**: Medium (emphasis)
- **600**: Semi-bold (headings)
- **700**: Bold (display text)

### Font Sizes

```css
/* Display text */
.kokitzu-logo {
  font-size: 1.8rem;
}
.price-amount {
  font-size: 3rem;
}
.price-decimal {
  font-size: 1.5rem;
}

/* Headings */
.crypto-details h2 {
  font-size: 1.5rem;
}

/* Body text */
body {
  font-size: 1rem;
}
.brand-subtitle {
  font-size: 0.875rem;
}
.symbol {
  font-size: 0.875rem;
}

/* Small text */
.graphql-badge {
  font-size: 0.75rem;
}
```

## 📏 Spacing System

```css
--spacing-xs: 0.25rem   /* 4px */
--spacing-sm: 0.5rem    /* 8px */
--spacing-md: 1rem      /* 16px */
--spacing-lg: 1.5rem    /* 24px */
--spacing-xl: 2rem      /* 32px */
--spacing-2xl: 3rem     /* 48px */
```

## 🎭 Component Library

### Navigation

```css
.nav {
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-primary);
  padding: var(--spacing-lg) var(--spacing-xl);
}
```

### Cards

```css
.crypto-card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  transition: all var(--transition-normal);
}

.crypto-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-secondary);
  box-shadow: var(--glow-primary);
  transform: translateY(-4px);
}
```

### Buttons

```css
/* Primary Button */
.connect-button {
  background: linear-gradient(
    135deg,
    var(--accent-primary),
    var(--accent-secondary)
  );
  border-radius: 12px;
  padding: var(--spacing-sm) var(--spacing-lg);
  font-weight: 600;
}

/* Secondary Button */
.refresh-button,
.theme-toggle {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}
```

### Price Change Indicators

```css
.price-change.up {
  background: rgba(16, 185, 129, 0.1);
  color: var(--accent-success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.price-change.down {
  background: rgba(239, 68, 68, 0.1);
  color: var(--accent-error);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
```

## ⚡ Animations

### Transitions

```css
--transition-fast: 0.15s ease
--transition-normal: 0.3s ease
--transition-slow: 0.5s ease
```

### Keyframe Animations

```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 480px) {
  .kokitzu-logo {
    font-size: 1.5rem;
  }
  .price-amount {
    font-size: 2rem;
  }
}

/* Tablet */
@media (max-width: 768px) {
  .nav {
    flex-direction: column;
  }
  .crypto-grid {
    grid-template-columns: 1fr;
  }
  .price-amount {
    font-size: 2.5rem;
  }
}

/* Desktop */
@media (min-width: 769px) {
  .crypto-grid {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  }
}
```

## 🎨 Visual Effects

### Glassmorphism

```css
backdrop-filter: blur(20px);
background: rgba(26, 26, 46, 0.8);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### Glowing Elements

```css
box-shadow: var(--glow-primary);
text-shadow: var(--glow-primary);
filter: drop-shadow(0 0 4px var(--accent-primary));
```

### Gradient Text

```css
background: linear-gradient(
  135deg,
  var(--accent-primary),
  var(--accent-secondary)
);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

## 🔧 CSS Custom Properties Usage

### Theme Switching

```javascript
// Toggle between dark and light themes
const [isDarkMode, setIsDarkMode] = useState(true);

// Apply theme class
<div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
```

### Dynamic Styling

```css
/* Use CSS variables for dynamic theming */
.crypto-card {
  background: var(--bg-card);
  border-color: var(--border-primary);
  color: var(--text-primary);
}
```

## 🚀 Performance Optimizations

### Hardware Acceleration

```css
.crypto-card {
  transform: translateZ(0); /* Force hardware acceleration */
  will-change: transform; /* Optimize for animations */
}
```

### Efficient Animations

```css
/* Use transform instead of position changes */
.crypto-card:hover {
  transform: translateY(-4px); /* GPU accelerated */
}

/* Use opacity for fade effects */
.price-change {
  animation: fadeInUp 0.3s ease;
}
```

## 📋 Component Guidelines

### Accessibility

- Use semantic HTML elements
- Provide proper contrast ratios
- Include ARIA labels for interactive elements
- Support keyboard navigation

### Consistency

- Use design tokens for all values
- Maintain consistent spacing
- Follow the established color palette
- Use the defined typography scale

### Performance

- Minimize CSS bundle size
- Use CSS variables for theming
- Optimize animations for 60fps
- Implement lazy loading where appropriate

---

**This design system ensures consistency, maintainability, and scalability across the Kokitzu application.**
