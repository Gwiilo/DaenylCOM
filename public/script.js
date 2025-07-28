// Dynamic color system based on current day of year
class DynamicColorSystem {
    constructor() {
        this.init();
        this.updateColors();
        // Update colors every minute to catch day changes
        setInterval(() => this.updateColors(), 60000);
    }

    init() {
        // Initialize any additional setup
        this.setupAnimationEnhancements();
    }

    // Calculate current day of year
    getDayOfYear() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    // Update CSS custom properties with dynamic colors
    updateColors() {
        const dayOfYear = this.getDayOfYear();
        
        // Primary color: HSL hue = current day of year number
        const primaryHue = dayOfYear % 360;
        
        // Secondary color: Primary hue - 50
        const secondaryHue = (primaryHue - 50 + 360) % 360;
        
        // Third color: Primary hue + 50
        const thirdHue = (primaryHue + 50) % 360;

        // Set CSS custom properties
        document.documentElement.style.setProperty('--primary-color', `hsl(${primaryHue}, 70%, 50%)`);
        document.documentElement.style.setProperty('--secondary-color', `hsl(${secondaryHue}, 70%, 50%)`);
        document.documentElement.style.setProperty('--third-color', `hsl(${thirdHue}, 70%, 50%)`);

        // Log for debugging
        console.log(`Day of year: ${dayOfYear}, Primary hue: ${primaryHue}°`);
        console.log(`Colors - Primary: ${primaryHue}°, Secondary: ${secondaryHue}°, Third: ${thirdHue}°`);
    }

    // Setup additional animation enhancements
    setupAnimationEnhancements() {
        // Add mouse movement effects
        this.setupMouseEffects();
        
        // Add performance optimizations
        this.optimizeAnimations();
    }

    // Mouse movement effects for interactive background
    setupMouseEffects() {
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth) * 100;
            mouseY = (e.clientY / window.innerHeight) * 100;
            
            // Update background gradient based on mouse position
            const background = document.querySelector('.animated-background');
            if (background) {
                background.style.background = `radial-gradient(circle at ${mouseX}% ${mouseY}%, var(--secondary-color) 0%, var(--third-color) 100%)`;
            }
        });
    }

    // Optimize animations for better performance
    optimizeAnimations() {
        // Check if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--animation-duration', '0s');
            return;
        }

        // Reduce animation complexity for virtual environments
        const isVirtualEnvironment = navigator.userAgent.includes('HeadlessChrome') || 
                                    navigator.webdriver || 
                                    window.outerHeight === 0;
        
        if (isVirtualEnvironment) {
            // Simplify animations for headless browsers
            document.documentElement.style.setProperty('--animation-complexity', 'reduced');
            this.optimizeForHeadless();
            return;
        }

        // Use requestAnimationFrame for smooth animations
        this.setupRAFAnimations();
    }

    // Optimize specifically for headless/virtual environments
    optimizeForHeadless() {
        // Reduce number of animation points
        const points = document.querySelectorAll('.animation-point');
        points.forEach((point, index) => {
            if (index > 1) {
                point.style.display = 'none';
            } else {
                point.style.animationDuration = '60s'; // Slower animations
            }
        });

        // Disable performance monitoring in headless
        return;
    }

    // Setup requestAnimationFrame-based animations for smoother performance
    setupRAFAnimations() {
        let startTime = null;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            // Update text glow intensity based on time
            const glowIntensity = Math.sin(elapsed * 0.001) * 0.5 + 0.5;
            const textElement = document.querySelector('.pixelated-text');
            
            if (textElement) {
                const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
                const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
                
                textElement.style.filter = `drop-shadow(0 0 ${10 + glowIntensity * 20}px ${primaryColor}) drop-shadow(0 0 ${30 + glowIntensity * 20}px ${secondaryColor})`;
            }

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }
}

// Animation point controller for smoother lerping
class AnimationPointController {
    constructor() {
        this.points = document.querySelectorAll('.animation-point');
        this.setupSmoothLerping();
    }

    setupSmoothLerping() {
        this.points.forEach((point, index) => {
            // Add random offset to make animations more organic
            const randomOffset = Math.random() * 5;
            const duration = 30 + randomOffset;
            
            point.style.animationDuration = `${duration}s`;
            point.style.animationDelay = `${-index * 7.5 + randomOffset}s`;
        });
    }

    // Add dynamic scaling based on viewport size
    updatePointsForViewport() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const scale = Math.min(vw, vh) / 1000;

        this.points.forEach(point => {
            const baseSize = 200;
            const newSize = Math.max(100, baseSize * scale);
            point.style.width = `${newSize}px`;
            point.style.height = `${newSize}px`;
        });
    }
}

// Text effect enhancements
class TextEffectController {
    constructor() {
        this.textElement = document.querySelector('.pixelated-text');
        this.setupPixelatedEffect();
        this.setupResponsiveText();
    }

    setupPixelatedEffect() {
        if (!this.textElement) return;

        // Ensure sharp, pixelated rendering
        this.textElement.style.imageRendering = 'pixelated';
        this.textElement.style.imageRendering = '-moz-crisp-edges';
        this.textElement.style.imageRendering = 'crisp-edges';
        
        // Add text stroke for better definition
        this.addTextStroke();
    }

    addTextStroke() {
        // Create subtle text stroke for better visibility
        const strokeStyle = `
            -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
            text-stroke: 1px rgba(255, 255, 255, 0.1);
        `;
        
        this.textElement.style.cssText += strokeStyle;
    }

    setupResponsiveText() {
        const updateTextSize = () => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const minDimension = Math.min(vw, vh);
            
            // Calculate responsive font size
            const fontSize = Math.max(60, minDimension * 0.15);
            this.textElement.style.fontSize = `${fontSize}px`;
        };

        updateTextSize();
        window.addEventListener('resize', updateTextSize);
    }
}

// Performance monitor
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 0;
        
        this.monitorFPS();
    }

    monitorFPS() {
        const measureFPS = () => {
            this.frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - this.lastTime >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastTime = currentTime;
                
                // Log FPS for debugging (can be removed in production)
                console.log(`FPS: ${this.fps}`);
                
                // Adjust animation quality based on performance
                this.adjustAnimationQuality();
            }
            
            requestAnimationFrame(measureFPS);
        };
        
        requestAnimationFrame(measureFPS);
    }

    adjustAnimationQuality() {
        // Reduce animation complexity if FPS is too low
        if (this.fps < 30) {
            document.documentElement.style.setProperty('--animation-complexity', 'reduced');
            console.log('Reducing animation complexity for better performance');
        } else if (this.fps > 50) {
            document.documentElement.style.setProperty('--animation-complexity', 'full');
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Daenyl.com portfolio...');
    
    // Initialize all systems
    const colorSystem = new DynamicColorSystem();
    const pointController = new AnimationPointController();
    const textController = new TextEffectController();
    
    // Only initialize performance monitor in real browsers
    const isHeadless = navigator.userAgent.includes('HeadlessChrome') || 
                      navigator.webdriver || 
                      window.outerHeight === 0;
    
    if (!isHeadless) {
        const performanceMonitor = new PerformanceMonitor();
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        pointController.updatePointsForViewport();
    });
    
    // Initial viewport update
    pointController.updatePointsForViewport();
    
    console.log('Portfolio initialization complete!');
});

// Export for potential future use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DynamicColorSystem,
        AnimationPointController,
        TextEffectController,
        PerformanceMonitor
    };
}