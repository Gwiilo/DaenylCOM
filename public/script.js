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
        // Colors are now set in CSS - no dynamic updates needed
    }

    // Setup fixed modern colors
    setupDynamicColors() {
        // Modern, professional color scheme - no more day-based changes
        this.colors = {
            primary: '#3b82f6',    // Modern blue
            secondary: '#6366f1',  // Indigo
            third: '#8b5cf6'       // Purple
        };
        
        console.log('Fixed color scheme loaded:', this.colors);
    }

    // Check if year is leap year
    isLeapYear(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }

    // Colors are now fixed in CSS - no dynamic updates needed

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
        this.loadCodeblocks();
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
        this.grid = document.getElementById('codeblocks-grid');
        if (!this.grid) {
            console.error('Codeblocks grid not found');
            return;
        }

        // For now, we'll manually define the codeblocks
        const codeblockConfigs = [
            {
                name: 'boids',
                title: 'Boids Simulation',
                hasThreeJS: true
            }
            // Add more codeblocks here as you create them
        ];

        for (const config of codeblockConfigs) {
            await this.loadCodeblock(config);
        }
    }

    async loadCodeblock(config) {
        try {
            // Load description
            const descriptionResponse = await fetch(`./codeblocks/${config.name}/description.md`);
            const description = await descriptionResponse.text();

            // Load script
            const scriptResponse = await fetch(`./codeblocks/${config.name}/script.js`);
            const script = await scriptResponse.text();

            const codeblock = {
                name: config.name,
                title: config.title || config.name,
                description: this.parseMarkdown(description),
                script: script,
                hasThreeJS: config.hasThreeJS || false
            };

            this.codeblocks.push(codeblock);
            this.renderCodeblock(codeblock);
        } catch (error) {
            console.error(`Error loading codeblock ${config.name}:`, error);
        }
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
        if (!this.grid) return;

        const showcaseElement = document.createElement('div');
        showcaseElement.className = 'codeblock-showcase';
        showcaseElement.innerHTML = `
            <div class="codeblock-preview" id="preview-${codeblock.name}">
                <div class="codeblock-preview-placeholder">
                    ${codeblock.hasThreeJS ? '🎮 Interactive Demo' : '📄 Code Example'}
                </div>
            </div>
            <div class="codeblock-info">
                <div class="codeblock-name">${codeblock.title}</div>
                <div class="codeblock-description">${codeblock.description}</div>
            </div>
        `;

        // Add click handler to open in editor
        showcaseElement.addEventListener('click', () => {
            this.openInEditor(codeblock);
        });

        this.grid.appendChild(showcaseElement);

        // Initialize Three.js preview if applicable
        if (codeblock.hasThreeJS) {
            this.initializeThreeJSPreview(codeblock.name);
        }
    }

    initializeThreeJSPreview(name) {
        // This will be implemented when we add Three.js
        const previewElement = document.getElementById(`preview-${name}`);
        if (previewElement) {
            // For now, just update the placeholder
            const placeholder = previewElement.querySelector('.codeblock-preview-placeholder');
            if (placeholder) {
                placeholder.innerHTML = '🌐 Three.js Preview<br><small>Click to open in editor</small>';
            }
        }
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
    }
};

// Performance monitoring
if (window.performance && window.performance.mark) {
    window.performance.mark('daenyl-portfolio-loaded');
}
