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
        this.setupSnazzyLogoEffects();
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
        
        // Calculate hues based on day of year
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
        root.style.setProperty('--accent-color', `hsl(${this.colors.third}, 70%, 60%)`);
    }

    // Start background animations
    startAnimations() {
        // Enhanced vignette movement with lerping
        this.vignetteAnimation();
        
        // Colors are now fixed - no more color transitions
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

    // Setup snazzy logo effects and interactions
    setupSnazzyLogoEffects() {
        const logoText = document.querySelector('.logo-text');
        if (!logoText) return;

        // Set data-text attribute for the white outline
        logoText.setAttribute('data-text', logoText.textContent);

        // Wrap each letter in a span for individual animation
        this.wrapLettersInSpans(logoText);

        // Add magnetic cursor effect with linear movement
        let isHovering = false;
        let mouseX = 0;
        let mouseY = 0;
        let logoRect = logoText.getBoundingClientRect();
        let currentX = 0;
        let currentY = 0;

        // Update logo rect on resize
        window.addEventListener('resize', () => {
            logoRect = logoText.getBoundingClientRect();
        });

        logoText.addEventListener('mouseenter', () => {
            isHovering = true;
        });

        logoText.addEventListener('mouseleave', () => {
            isHovering = false;
            // Smoothly return to original position
            this.animateToPosition(logoText, 0, 0, 300);
        });

        logoText.addEventListener('mousemove', (e) => {
            if (!isHovering) return;
            
            mouseX = e.clientX;
            mouseY = e.clientY;
            
            // Calculate magnetic effect
            const centerX = logoRect.left + logoRect.width / 2;
            const centerY = logoRect.top + logoRect.height / 2;
            
            const targetX = (mouseX - centerX) * 0.05;
            const targetY = (mouseY - centerY) * 0.05;
            
            // Linear movement to new position
            this.animateToPosition(logoText, targetX, targetY, 100);
        });

        // Add click ripple effect
        logoText.addEventListener('click', (e) => {
            this.createRippleEffect(e, logoText);
        });

        // Add periodic sparkle effect
        this.startSparkleEffect(logoText);
    }

    // Wrap each letter in spans for individual animation
    wrapLettersInSpans(element) {
        const text = element.textContent;
        element.innerHTML = '';
        
        for (let i = 0; i < text.length; i++) {
            const letter = text[i];
            const span = document.createElement('span');
            span.textContent = letter;
            span.className = 'letter';
            
            // Handle spaces
            if (letter === ' ') {
                span.style.width = '0.3em';
                span.innerHTML = '&nbsp;';
            }
            
            element.appendChild(span);
        }
    }

    // Smooth linear animation to position
    animateToPosition(element, targetX, targetY, duration) {
        const startX = parseFloat(element.style.transform?.match(/translateX\(([^)]+)\)/)?.[1] || 0);
        const startY = parseFloat(element.style.transform?.match(/translateY\(([^)]+)\)/)?.[1] || 0);
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Linear interpolation
            const currentX = startX + (targetX - startX) * progress;
            const currentY = startY + (targetY - startY) * progress;
            
            element.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.02)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    // Create ripple effect on click
    createRippleEffect(event, element) {
        const ripple = document.createElement('div');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, hsla(var(--primary-hue), 70%, 50%, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            animation: rippleExpand 0.6s ease-out forwards;
        `;

        element.style.position = 'relative';
        element.appendChild(ripple);

        // Add ripple animation keyframes if not exists
        if (!document.querySelector('#ripple-keyframes')) {
            const style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent = `
                @keyframes rippleExpand {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => ripple.remove(), 600);
    }

    // Start sparkle effect
    startSparkleEffect(element) {
        const createSparkle = () => {
            if (Math.random() > 0.3) return; // 30% chance of sparkle

            const sparkle = document.createElement('div');
            const rect = element.getBoundingClientRect();
            const x = Math.random() * rect.width;
            const y = Math.random() * rect.height;

            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                left: ${x}px;
                top: ${y}px;
                background: hsla(var(--third-hue), 100%, 80%, 1.0);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                animation: sparkleAnimation 1.5s ease-out forwards;
                box-shadow: 0 0 6px hsla(var(--third-hue), 100%, 80%, 0.8);
            `;

            element.appendChild(sparkle);

            // Add sparkle animation keyframes if not exists
            if (!document.querySelector('#sparkle-keyframes')) {
                const style = document.createElement('style');
                style.id = 'sparkle-keyframes';
                style.textContent = `
                    @keyframes sparkleAnimation {
                        0% {
                            transform: scale(0) rotate(0deg);
                            opacity: 0;
                        }
                        50% {
                            transform: scale(1) rotate(180deg);
                            opacity: 1;
                        }
                        100% {
                            transform: scale(0) rotate(360deg);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            setTimeout(() => sparkle.remove(), 1500);
        };

        // Create sparkles periodically
        setInterval(createSparkle, 2000);
    }

    // Colors are now fixed in CSS - no more dynamic color transitions

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

// Showcase manager for displaying codeblocks
class ShowcaseManager {
    constructor(portfolio) {
        this.portfolio = portfolio;
        this.codeblocks = [];
        this.currentIndex = 0;
        this.currentDemo = null; // Track the currently active demo
        this.loadCodeblocks();
    }
    
    // Navigate to the next codeblock
    nextCodeblock() {
        if (this.currentIndex < this.codeblocks.length - 1) {
            this.currentIndex++;
            this.renderCurrentCodeblock();
        }
    }
    
    // Navigate to the previous codeblock
    prevCodeblock() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderCurrentCodeblock();
        }
    }
    
    // Navigate to a specific codeblock by index
    goToCodeblock(index) {
        if (index >= 0 && index < this.codeblocks.length) {
            this.currentIndex = index;
            this.renderCurrentCodeblock();
        }
    }
    
    // Cleanup current demo and render the new one
    renderCurrentCodeblock() {
        // Cleanup any existing demo
        this.cleanupCurrentDemo();
        
        if (this.codeblocks.length === 0) return;
        
        const codeblock = this.codeblocks[this.currentIndex];
        this.renderCodeblock(codeblock);
        this.updateNavigation();
    }
    
    // Cleanup the currently active demo
    cleanupCurrentDemo() {
        if (this.currentDemo) {
            // Cancel any animation frames
            if (this.currentDemo.animationId) {
                cancelAnimationFrame(this.currentDemo.animationId);
            }
            
            // Call demo-specific cleanup if it exists
            if (this.currentDemo.name) {
                const cleanupFunctionName = `cleanup${this.capitalizeFirstLetter(this.currentDemo.name)}`;
                if (window[cleanupFunctionName] && typeof window[cleanupFunctionName] === 'function') {
                    try {
                        window[cleanupFunctionName]();
                    } catch (error) {
                        console.warn(`Error calling ${cleanupFunctionName}:`, error);
                    }
                }
            }
            
            // Cleanup Three.js resources
            if (this.currentDemo.renderer) {
                this.currentDemo.renderer.dispose();
            }
            if (this.currentDemo.scene) {
                this.currentDemo.scene.clear();
            }
            
            this.currentDemo = null;
        }
    }
    
    // Update navigation button states
    updateNavigation() {
        const prevBtn = document.querySelector('.slideshow-prev');
        const nextBtn = document.querySelector('.slideshow-next');
        const counter = document.querySelector('.slideshow-counter');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
            prevBtn.classList.toggle('disabled', this.currentIndex === 0);
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentIndex === this.codeblocks.length - 1;
            nextBtn.classList.toggle('disabled', this.currentIndex === this.codeblocks.length - 1);
        }
        
        if (counter) {
            counter.textContent = `${this.currentIndex + 1} / ${this.codeblocks.length}`;
        }
    }
    
    // Helper function to capitalize first letter for function names
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Toggle pause/resume for current demo
    toggleCurrentDemo() {
        if (!this.codeblocks[this.currentIndex]) return;
        
        const codeblock = this.codeblocks[this.currentIndex];
        const pauseBtn = document.querySelector('#pause-demo');
        
        if (this.currentDemo && this.currentDemo.isPaused) {
            // Resume demo
            this.resumeCurrentDemo();
            if (pauseBtn) pauseBtn.innerHTML = '⏸️ Pause';
        } else {
            // Pause demo
            this.pauseCurrentDemo();
            if (pauseBtn) pauseBtn.innerHTML = '▶️ Resume';
        }
    }
    
    // Open current demo in editor
    openCurrentInEditor() {
        if (!this.codeblocks[this.currentIndex]) return;
        
        const codeblock = this.codeblocks[this.currentIndex];
        this.openInEditor(codeblock);
    }

    async loadCodeblocks() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeShowcase());
            } else {
                this.initializeShowcase();
            }
        } catch (error) {
            console.error('Error loading codeblocks:', error);
        }
    }

    async initializeShowcase() {
        this.container = document.getElementById('codeblocks-grid');
        if (!this.container) {
            console.error('Codeblocks container not found');
            return;
        }

        // Replace the grid with a slideshow container
        this.container.innerHTML = `
            <div class="demo-controls">
                <button class="demo-control-btn pause-btn" id="pause-demo" title="Pause/Resume Demo">⏸️ Pause</button>
                <button class="demo-control-btn editor-btn" id="open-editor" title="Open in Editor">📝 Editor</button>
            </div>
            <div class="codeblock-slideshow">
                <div class="slideshow-navigation">
                    <button class="nav-btn slideshow-prev" title="Previous">‹</button>
                    <div class="nav-counter">
                        <span class="slideshow-counter">1 / 1</span>
                    </div>
                    <button class="nav-btn slideshow-next" title="Next">›</button>
                </div>
                <div class="slideshow-content" id="slideshow-content">
                    <div class="codeblock-loading">
                        <div class="loading-spinner"></div>
                        <div>🔍 Discovering demos...</div>
                    </div>
                </div>
            </div>
        `;
        
        // Keyboard hints removed as requested

        // Add event listeners for navigation
        const prevBtn = this.container.querySelector('.slideshow-prev');
        const nextBtn = this.container.querySelector('.slideshow-next');
        const pauseBtn = this.container.querySelector('#pause-demo');
        const editorBtn = this.container.querySelector('#open-editor');
        
        prevBtn.addEventListener('click', () => this.prevCodeblock());
        nextBtn.addEventListener('click', () => this.nextCodeblock());
        pauseBtn.addEventListener('click', () => this.toggleCurrentDemo());
        editorBtn.addEventListener('click', () => this.openCurrentInEditor());
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
                return; // Don't interfere with form inputs
            }
            
            if (e.key === 'ArrowLeft') {
                this.prevCodeblock();
            } else if (e.key === 'ArrowRight') {
                this.nextCodeblock();
            }
        });

        // Dynamically discover codeblocks by scanning the codeblocks directory
        await this.discoverCodeblocks();
    }

    async discoverCodeblocks() {
        try {
            console.log('🔍 Discovering codeblocks...');
            
            // Get list of codeblock directories
            const codeblockNames = await this.getCodeblockDirectories();
            
            if (codeblockNames.length === 0) {
                console.warn('⚠️ No codeblocks found, using fallback');
                await this.loadFallbackCodeblocks();
                return;
            }
            
            console.log(`✅ Found ${codeblockNames.length} codeblock(s):`, codeblockNames);

            // Load each discovered codeblock
            let successCount = 0;
            for (const name of codeblockNames) {
                try {
                    await this.loadCodeblock({ name });
                    successCount++;
                } catch (error) {
                    console.error(`❌ Failed to load ${name}:`, error);
                }
            }
            
            console.log(`📦 Successfully loaded ${successCount}/${codeblockNames.length} codeblocks`);
            
            // Render the first codeblock if any were loaded
            if (this.codeblocks.length > 0) {
                this.currentIndex = 0;
                this.renderCurrentCodeblock();
            } else {
                this.showNoCodeblocksMessage();
            }
            
        } catch (error) {
            console.error('💥 Error discovering codeblocks:', error);
            // Fallback to manual list if discovery fails
            await this.loadFallbackCodeblocks();
        }
    }

    async getCodeblockDirectories() {
        // Try to get the list of directories in the codeblocks folder
        // This approach works by attempting to fetch known codeblocks and checking which exist
        const potentialCodeblocks = [
            // Current demos
            'boids',
            
            // Potential future demos
            'particles',
            'fractals',
            'waves',
            'mandelbrot',
            'life',
            'physics',
            'raytracer',
            'mesh',
            'terrain',
            'fluid',
            'cloth',
            'solar-system',
            'galaxy',
            'dna',
            'neural-network',
            'pathfinding',
            'sorting',
            'maze',
            'cellular-automata',
            'l-systems',
            'perlin-noise',
            'voronoi',
            'delaunay',
            'matrix',
            'fire',
            'water',
            'explosion',
            'lightning',
            'aurora',
            'fireworks',
            'islands'
        ];

        const existingCodeblocks = [];
        const batchSize = 5; // Check in batches to avoid overwhelming the server

        // Check which codeblocks actually exist by trying to fetch their description
        for (let i = 0; i < potentialCodeblocks.length; i += batchSize) {
            const batch = potentialCodeblocks.slice(i, i + batchSize);
            
            const promises = batch.map(async (name) => {
                try {
                    const response = await fetch(`./codeblocks/${name}/description.md`, {
                        method: 'HEAD' // Use HEAD request for faster checking
                    });
                    return response.ok ? name : null;
                } catch (error) {
                    return null;
                }
            });

            const results = await Promise.all(promises);
            existingCodeblocks.push(...results.filter(name => name !== null));
        }

        return existingCodeblocks.sort(); // Sort alphabetically
    }

    async loadFallbackCodeblocks() {
        // Fallback to manual list if auto-discovery fails
        console.warn('Falling back to manual codeblock list');
        const fallbackConfigs = [
            {
                name: 'boids',
                title: 'Boids Simulation',
                hasThreeJS: true
            }
        ];

        for (const config of fallbackConfigs) {
            await this.loadCodeblock(config);
        }
        
        // Render the first codeblock if any were loaded
        if (this.codeblocks.length > 0) {
            this.currentIndex = 0;
            this.renderCurrentCodeblock();
        } else {
            this.showNoCodeblocksMessage();
        }
    }

    async loadCodeblock(config) {
        try {
            const name = config.name;
            
            // Load description
            const descriptionResponse = await fetch(`./codeblocks/${name}/description.md`);
            if (!descriptionResponse.ok) {
                throw new Error(`Failed to load description for ${name}`);
            }
            const description = await descriptionResponse.text();

            // Load script
            const scriptResponse = await fetch(`./codeblocks/${name}/script.js`);
            if (!scriptResponse.ok) {
                throw new Error(`Failed to load script for ${name}`);
            }
            const script = await scriptResponse.text();

            // Auto-detect properties
            const hasThreeJS = this.detectThreeJS(script);
            const title = this.extractTitle(description, name);

            const codeblock = {
                name: name,
                title: title,
                description: this.parseMarkdown(description),
                script: script,
                hasThreeJS: hasThreeJS
            };

            this.codeblocks.push(codeblock);
            console.log(`Successfully loaded codeblock: ${name} (ThreeJS: ${hasThreeJS})`);
        } catch (error) {
            console.error(`Error loading codeblock ${config.name}:`, error);
        }
    }
    
    // Show message when no codeblocks are available
    showNoCodeblocksMessage() {
        const content = document.getElementById('slideshow-content');
        if (content) {
            content.innerHTML = `
                <div class="no-codeblocks-message">
                    <h3>📦 No Demos Available</h3>
                    <p>Check back later for interactive coding demonstrations</p>
                </div>
            `;
        }
        
        this.updateNavigation();
    }

    // Auto-detect if a script uses Three.js
    detectThreeJS(script) {
        const threeJSIndicators = [
            'THREE.',
            'new THREE',
            'scene',
            'camera',
            'renderer',
            'WebGLRenderer',
            'PerspectiveCamera',
            'Scene()',
            'Mesh(',
            'Geometry',
            'Material'
        ];

        return threeJSIndicators.some(indicator => 
            script.includes(indicator)
        );
    }

    // Extract title from markdown description
    extractTitle(description, fallbackName) {
        // Look for the first h1 heading
        const h1Match = description.match(/^#\s+(.+)$/m);
        if (h1Match) {
            return h1Match[1].trim();
        }

        // Look for the first h2 heading if no h1
        const h2Match = description.match(/^##\s+(.+)$/m);
        if (h2Match) {
            return h2Match[1].trim();
        }

        // Fall back to capitalizing the folder name
        return fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
    }

    parseMarkdown(markdown) {
        // Simple markdown parser for basic formatting
        return markdown
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(?!<[h|u|l])/gm, '<p>')
            .replace(/(?<!>)$/gm, '</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<[h|u])/g, '$1')
            .replace(/(<\/[h|u].*>)<\/p>/g, '$1');
    }

    renderCodeblock(codeblock) {
        const content = document.getElementById('slideshow-content');
        
        if (!content) return;
        
        // Create the codeblock content with proper structure matching CSS
        content.innerHTML = `
            <div class="codeblock-showcase">
                <div class="codeblock-preview" id="current-preview">
                    <div class="codeblock-preview-placeholder">
                        ${codeblock.hasThreeJS ? '🎮 Interactive Demo Loading...' : '📄 Code Example'}
                    </div>
                    <div class="action-buttons">
                        <button class="action-btn play" title="Play">▶️ Play</button>
                        <button class="action-btn pause" title="Pause" style="display: none;">⏸️ Pause</button>
                    </div>
                </div>
                <div class="codeblock-info">
                    <div class="codeblock-name">${codeblock.title}</div>
                    <div class="codeblock-description">${codeblock.description}</div>
                </div>
            </div>
        `;

        // Setup action buttons
        this.setupActionButtons(codeblock);

        // Initialize Three.js preview if applicable
        if (codeblock.hasThreeJS) {
            this.initializeThreeJSPreview(codeblock);
        }
    }
    
    // Setup action buttons for the current codeblock
    setupActionButtons(codeblock) {
        const playBtn = document.querySelector('.action-btn.play');
        const pauseBtn = document.querySelector('.action-btn.pause');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.resumeCurrentDemo();
                playBtn.style.display = 'none';
                if (pauseBtn) pauseBtn.style.display = 'flex';
            });
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.pauseCurrentDemo();
                pauseBtn.style.display = 'none';
                if (playBtn) playBtn.style.display = 'flex';
            });
        }
    }
    
    // Pause the current demo
    pauseCurrentDemo() {
        if (this.currentDemo && !this.currentDemo.isPaused) {
            this.currentDemo.isPaused = true;
            
            if (this.currentDemo.animationId) {
                cancelAnimationFrame(this.currentDemo.animationId);
                this.currentDemo.animationId = null;
            }
            
            // Try to call demo-specific pause function
            const pauseFunctionName = `pause${this.capitalizeFirstLetter(this.currentDemo.name)}`;
            if (window[pauseFunctionName] && typeof window[pauseFunctionName] === 'function') {
                try {
                    window[pauseFunctionName]();
                } catch (error) {
                    console.warn(`Error calling ${pauseFunctionName}:`, error);
                }
            }
            
            console.log(`Paused demo: ${this.currentDemo.name}`);
        }
    }
    
    // Resume the current demo
    resumeCurrentDemo() {
        if (this.currentDemo && this.currentDemo.isPaused) {
            this.currentDemo.isPaused = false;
            
            // Try to call demo-specific resume function
            const resumeFunctionName = `resume${this.capitalizeFirstLetter(this.currentDemo.name)}`;
            if (window[resumeFunctionName] && typeof window[resumeFunctionName] === 'function') {
                try {
                    window[resumeFunctionName]();
                } catch (error) {
                    console.warn(`Error calling ${resumeFunctionName}:`, error);
                    // Fall back to built-in animation
                    if (this.currentDemo.animate) {
                        this.currentDemo.animate();
                    }
                }
            } else if (this.currentDemo.animate) {
                this.currentDemo.animate();
            }
            
            console.log(`Resumed demo: ${this.currentDemo.name}`);
        }
    }

    async initializeThreeJSPreview(codeblock) {
        const previewElement = document.getElementById('current-preview');
        if (!previewElement || !window.THREE) return;

        try {
            // Clear placeholder
            previewElement.innerHTML = '';
            
            // Create Three.js scene for this preview
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x020617);

            // Create camera with proper aspect ratio
            const camera = new THREE.PerspectiveCamera(
                75, 
                previewElement.clientWidth / previewElement.clientHeight,
                0.1, 
                1000
            );

            // Create renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            const width = previewElement.clientWidth;
            const height = previewElement.clientHeight;
            
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.domElement.style.width = '100%';
            renderer.domElement.style.height = '100%';
            renderer.domElement.style.display = 'block';
            previewElement.appendChild(renderer.domElement);

            // Load and execute the codeblock script
            const response = await fetch(`./codeblocks/${codeblock.name}/script.js`);
            const codeText = await response.text();
            
            let animateFunction = null;
            
            try {
                // Make globals available
                window.scene = scene;
                window.camera = camera;
                window.renderer = renderer;
                
                // Execute the codeblock script
                eval(codeText);
                
                // Look for animation function
                animateFunction = window.render || window.animate || null;
            } catch (error) {
                console.error(`Error in ${codeblock.name} preview:`, error);
                this.showPreviewError(previewElement, error.message);
                return;
            }

            // Create animation loop
            let animationId;
            const animate = () => {
                if (this.currentDemo && this.currentDemo.isPlaying) {
                    animationId = requestAnimationFrame(animate);
                    
                    if (!animateFunction) {
                        renderer.render(scene, camera);
                    } else {
                        try {
                            animateFunction();
                        } catch (error) {
                            console.error(`Animation error in ${codeblock.name}:`, error);
                            if (this.currentDemo) this.currentDemo.isPlaying = false;
                        }
                    }
                }
            };

            // Store demo data
            this.currentDemo = {
                name: codeblock.name,
                isPlaying: true, // Start playing immediately
                animationId: null,
                animate: animate,
                renderer: renderer,
                scene: scene,
                camera: camera
            };

            // Start the animation
            animate();

            // Handle resize
            const resizeObserver = new ResizeObserver(() => {
                const width = previewElement.clientWidth;
                const height = previewElement.clientHeight;
                
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            });
            resizeObserver.observe(previewElement);

            // Store cleanup function
            this.currentDemo.cleanup = () => {
                if (animationId) cancelAnimationFrame(animationId);
                resizeObserver.disconnect();
                renderer.dispose();
                scene.clear();
            };

        } catch (error) {
            console.error(`Failed to initialize Three.js preview for ${codeblock.name}:`, error);
            this.showPreviewError(previewElement, error.message);
        }
    }

    showPreviewError(previewElement, error) {
        previewElement.innerHTML = `
            <div class="preview-error">
                <div style="color: var(--error); font-size: 2rem; margin-bottom: 10px;">⚠️</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem;">Preview Error</div>
                <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 5px;">${error}</div>
            </div>
        `;
    }

    openInEditor(codeblock) {
        // Open the editor with the codeblock
        const editorUrl = `./editor/?codeblock=${encodeURIComponent(codeblock.name)}`;
        window.open(editorUrl, '_blank');
    }
}

// Initialize the portfolio
const portfolio = new DaenylPortfolio();
const codeblockManager = new CodeblockManager();
const showcaseManager = new ShowcaseManager(portfolio);

// Expose to global scope for future extensions
window.DaenylPortfolio = {
    portfolio,
    codeblockManager,
    showcaseManager,
    
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
    },
    
    // API for slideshow navigation
    nextDemo: () => showcaseManager.nextCodeblock(),
    prevDemo: () => showcaseManager.prevCodeblock(),
    goToDemo: (index) => showcaseManager.goToCodeblock(index)
};

// Performance monitoring
if (window.performance && window.performance.mark) {
    window.performance.mark('daenyl-portfolio-loaded');
}
