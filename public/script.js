// Daenyl.com Portfolio Website
// Dynamic color system and animations

class DaenylPortfolio {
    constructor() {
        this.init();
    }

    init() {
        this.setupDynamicColors();
        this.startAnimations();
        this.setupResponsive();
        
        // Initialize when DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onReady());
        } else {
            this.onReady();
        }
    }

    onReady() {
        console.log('Daenyl.com Portfolio Loaded');
        this.updateColors();
    }

    // Calculate colors based on current day of year
    setupDynamicColors() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        // Ensure we're within 1-365/366 range
        const currentDay = Math.max(1, Math.min(dayOfYear, this.isLeapYear(now.getFullYear()) ? 366 : 365));
        
        // Calculate hues
        const primaryHue = currentDay;
        const secondaryHue = (primaryHue - 50 + 360) % 360; // Ensure positive
        const thirdHue = (primaryHue + 50) % 360;
        
        // Store colors
        this.colors = {
            primary: primaryHue,
            secondary: secondaryHue,
            third: thirdHue
        };
        
        console.log(`Day ${currentDay}: Primary(${primaryHue}°), Secondary(${secondaryHue}°), Third(${thirdHue}°)`);
    }

    // Check if year is leap year
    isLeapYear(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }

    // Update CSS custom properties with dynamic colors
    updateColors() {
        const root = document.documentElement;
        
        root.style.setProperty('--primary-hue', this.colors.primary);
        root.style.setProperty('--secondary-hue', this.colors.secondary);
        root.style.setProperty('--third-hue', this.colors.third);
        
        // Update derived colors
        root.style.setProperty('--primary-color', `hsl(${this.colors.primary}, 70%, 50%)`);
        root.style.setProperty('--secondary-color', `hsl(${this.colors.secondary}, 70%, 40%)`);
        root.style.setProperty('--third-color', `hsl(${this.colors.third}, 70%, 60%)`);
    }

    // Start background animations
    startAnimations() {
        // Enhanced vignette movement with lerping
        this.vignetteAnimation();
        
        // Smooth color transitions
        this.colorTransitions();
    }

    // Advanced vignette animation with interpolation
    vignetteAnimation() {
        const vignetteLayer = document.querySelector('.vignette-layer');
        if (!vignetteLayer) return;

        let time = 0;
        const speed = 0.008; // Very slow pace
        
        const animate = () => {
            time += speed;
            
            // Interpolate positions around the frame
            const x = 50 + Math.sin(time) * 20;
            const y = 50 + Math.cos(time * 0.7) * 15;
            const size = 20 + Math.sin(time * 0.5) * 5;
            const intensity = 0.75 + Math.sin(time * 0.3) * 0.15;
            
            vignetteLayer.style.background = `radial-gradient(
                ellipse at ${x}% ${y}%,
                transparent ${size}%,
                rgba(0, 0, 0, ${intensity}) 85%
            )`;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // Smooth color transition effects
    colorTransitions() {
        let colorTime = 0;
        const colorSpeed = 0.002;
        
        const animate = () => {
            colorTime += colorSpeed;
            
            // Subtle color variations
            const primaryVariation = Math.sin(colorTime) * 3;
            const secondaryVariation = Math.cos(colorTime * 1.2) * 3;
            const thirdVariation = Math.sin(colorTime * 0.8) * 3;
            
            const root = document.documentElement;
            root.style.setProperty('--primary-color', 
                `hsl(${this.colors.primary + primaryVariation}, 70%, ${50 + Math.sin(colorTime * 2) * 5}%)`);
            root.style.setProperty('--secondary-color', 
                `hsl(${this.colors.secondary + secondaryVariation}, 70%, ${40 + Math.cos(colorTime * 1.5) * 5}%)`);
            root.style.setProperty('--third-color', 
                `hsl(${this.colors.third + thirdVariation}, 70%, ${60 + Math.sin(colorTime * 1.8) * 5}%)`);
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // Responsive handling
    setupResponsive() {
        const handleResize = () => {
            // Adjust animations based on screen size
            const isMobile = window.innerWidth <= 768;
            const root = document.documentElement;
            
            if (isMobile) {
                root.style.setProperty('--animation-scale', '0.8');
            } else {
                root.style.setProperty('--animation-scale', '1');
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call
    }
}

// Codeblocks functionality for future JS showcase
class CodeblockManager {
    constructor() {
        this.codeblocks = [];
        this.container = document.querySelector('.codeblocks-container');
    }

    // Add a new codeblock
    addCodeblock(code, title = 'Code Example') {
        const codeblock = {
            id: Date.now(),
            code: code,
            title: title
        };
        
        this.codeblocks.push(codeblock);
        this.renderCodeblock(codeblock);
    }

    // Render codeblock to DOM
    renderCodeblock(codeblock) {
        if (!this.container) return;
        
        const frame = document.createElement('div');
        frame.className = 'codeblock-frame';
        frame.innerHTML = `
            <div class="codeblock-header">
                <span class="codeblock-title">${codeblock.title}</span>
                <button class="codeblock-close" data-id="${codeblock.id}">×</button>
            </div>
            <div class="codeblock-content">${this.syntaxHighlight(codeblock.code)}</div>
        `;
        
        this.container.appendChild(frame);
        this.container.style.display = 'block';
        
        // Add close functionality
        frame.querySelector('.codeblock-close').addEventListener('click', () => {
            this.removeCodeblock(codeblock.id);
        });
    }

    // Basic syntax highlighting
    syntaxHighlight(code) {
        return code
            .replace(/\b(function|const|let|var|if|else|for|while|return|class)\b/g, '<span class="keyword">$1</span>')
            .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
            .replace(/"[^"]*"/g, '<span class="string">$&</span>')
            .replace(/\b\d+\b/g, '<span class="number">$&</span>');
    }

    // Remove codeblock
    removeCodeblock(id) {
        this.codeblocks = this.codeblocks.filter(cb => cb.id !== id);
        const frame = document.querySelector(`[data-id="${id}"]`).closest('.codeblock-frame');
        if (frame) {
            frame.remove();
        }
        
        if (this.codeblocks.length === 0) {
            this.container.style.display = 'none';
        }
    }
}

// Initialize the portfolio
const portfolio = new DaenylPortfolio();
const codeblockManager = new CodeblockManager();

// Expose to global scope for future extensions
window.DaenylPortfolio = {
    portfolio,
    codeblockManager,
    
    // API for adding codeblocks
    showCode: (code, title) => codeblockManager.addCodeblock(code, title),
    
    // API for color information
    getColors: () => portfolio.colors,
    
    // API for manual color updates (for future features)
    updateColors: (primary, secondary, third) => {
        if (primary !== undefined) portfolio.colors.primary = primary;
        if (secondary !== undefined) portfolio.colors.secondary = secondary;
        if (third !== undefined) portfolio.colors.third = third;
        portfolio.updateColors();
    }
};

// Performance monitoring
if (window.performance && window.performance.mark) {
    window.performance.mark('daenyl-portfolio-loaded');
}
