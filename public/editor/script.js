// Three.js Editor for Daenyl.com
// Dynamic Three.js code editor with live preview

class ThreeJSEditor {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.animationId = null;
        this.userCode = '';
        this.userAnimateFunction = null;
        this.userObjects = [];
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = 0;
        
        this.init();
    }

    async init() {
        await this.initMonaco();
        this.setupThreeJS();
        this.setupEventListeners();
        this.setupConsole();
        this.inheritColors();
        this.loadDefaultExample();
    }

    // Initialize Monaco Editor
    async initMonaco() {
        return new Promise((resolve) => {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' } });
            require(['vs/editor/editor.main'], () => {
                this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                    value: '',
                    language: 'javascript',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on'
                });
                resolve();
            });
        });
    }

    // Setup Three.js scene
    setupThreeJS() {
        const container = document.getElementById('three-preview');
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Clear loading message and add canvas
        container.innerHTML = '';
        container.appendChild(this.renderer.domElement);

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }

    // Setup event listeners
    setupEventListeners() {
        document.getElementById('run-btn').addEventListener('click', () => this.executeCode());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetScene());
        document.getElementById('clear-editor').addEventListener('click', () => this.clearEditor());
        document.getElementById('load-example').addEventListener('click', () => this.loadDefaultExample());
        document.getElementById('clear-console').addEventListener('click', () => this.clearConsole());
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
    }

    // Setup console capture
    setupConsole() {
        const consoleOutput = document.getElementById('console-output');
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            this.addToConsole('log', args.join(' '));
            originalLog.apply(console, args);
        };

        console.error = (...args) => {
            this.addToConsole('error', args.join(' '));
            originalError.apply(console, args);
        };

        console.warn = (...args) => {
            this.addToConsole('warn', args.join(' '));
            originalWarn.apply(console, args);
        };
    }

    addToConsole(type, message) {
        const consoleOutput = document.getElementById('console-output');
        const logElement = document.createElement('div');
        logElement.className = `console-${type}`;
        logElement.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        consoleOutput.appendChild(logElement);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // Inherit colors from parent site (day-based system)
    inheritColors() {
        try {
            // Calculate day-based colors same as main site
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = now - start;
            const oneDay = 1000 * 60 * 60 * 24;
            const dayOfYear = Math.floor(diff / oneDay);
            
            // Ensure we're within 1-365/366 range
            const currentDay = Math.max(1, Math.min(dayOfYear, this.isLeapYear(now.getFullYear()) ? 366 : 365));
            
            // Calculate hues based on day of year
            const primaryHue = currentDay;
            const secondaryHue = (primaryHue - 50 + 360) % 360;
            const thirdHue = (primaryHue + 50) % 360;
            
            // Apply to CSS
            const root = document.documentElement;
            root.style.setProperty('--primary-hue', primaryHue);
            root.style.setProperty('--secondary-hue', secondaryHue);
            root.style.setProperty('--third-hue', thirdHue);
            
            console.log(`Editor colors - Day ${currentDay}: Primary(${primaryHue}°), Secondary(${secondaryHue}°), Third(${thirdHue}°)`);
        } catch (error) {
            console.log('Using default colors:', error);
        }
    }

    // Helper function for leap year calculation
    isLeapYear(year) {
        return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    }

    // Execute user code
    executeCode() {
        try {
            this.clearConsole();
            this.resetScene();

            const code = this.editor.getValue();
            this.userCode = code;

            // Make Three.js globals available to user code
            window.scene = this.scene;
            window.camera = this.camera;
            window.renderer = this.renderer;
            window.THREE = THREE;

            // Execute the code in global context
            const wrappedCode = `
                (function() {
                    ${code}
                    
                    // Return animate function if it exists
                    if (typeof animate === 'function') {
                        return animate;
                    }
                    return null;
                })()
            `;

            this.userAnimateFunction = eval(wrappedCode);

            this.startAnimation();
            console.log('Code executed successfully!');
        } catch (error) {
            console.error('Execution error:', error.message);
        }
    }

    // Start animation loop
    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            
            // Calculate FPS
            this.frameCount++;
            const currentTime = performance.now();
            if (currentTime - this.lastTime >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
                document.getElementById('fps-counter').textContent = `FPS: ${this.fps}`;
                this.frameCount = 0;
                this.lastTime = currentTime;
            }

            // Call user animate function if it exists
            if (this.userAnimateFunction) {
                try {
                    this.userAnimateFunction();
                } catch (error) {
                    console.error('Animation error:', error.message);
                    this.userAnimateFunction = null;
                }
            }

            this.renderer.render(this.scene, this.camera);
        };

        animate();
    }

    // Reset scene
    resetScene() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Clear scene
        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
            this.scene.remove(object);
        }

        this.userAnimateFunction = null;
        this.userObjects = [];
        this.renderer.render(this.scene, this.camera);
        document.getElementById('fps-counter').textContent = 'FPS: --';
    }

    // Clear editor
    clearEditor() {
        this.editor.setValue('');
        this.resetScene();
    }

    // Clear console
    clearConsole() {
        document.getElementById('console-output').innerHTML = '';
    }

    // Toggle fullscreen
    toggleFullscreen() {
        const container = document.getElementById('three-preview');
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err.message);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Handle resize
    handleResize() {
        const container = document.getElementById('three-preview');
        if (container && this.camera && this.renderer) {
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    }

    // Load default example
    loadDefaultExample() {
        const exampleCode = `// Welcome to the Three.js Editor!
// This is a basic rotating cube example

// Create geometry and material
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshPhongMaterial({ 
    color: 0x3b82f6,
    shininess: 100
});

// Create mesh and add to scene
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Position camera
camera.position.z = 3;

// Animation function
function animate() {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
}

console.log('Basic cube example loaded!');
console.log('Click the Run button to see it in action.');`;

        this.editor.setValue(exampleCode);
    }

    // Load specific codeblock
    async loadCodeblock(name) {
        try {
            const response = await fetch(`../codeblocks/${name}/script.js`);
            const code = await response.text();
            this.editor.setValue(code);
            console.log(`Loaded codeblock: ${name}`);
        } catch (error) {
            console.error(`Failed to load codeblock ${name}:`, error);
        }
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const editor = new ThreeJSEditor();

    // Check if a specific codeblock should be loaded
    const urlParams = new URLSearchParams(window.location.search);
    const codeblock = urlParams.get('codeblock');
    if (codeblock) {
        // Wait for editor to be ready, then load the codeblock
        setTimeout(() => {
            editor.loadCodeblock(codeblock);
        }, 1000);
    }

    // Expose editor to global scope for debugging
    window.threeEditor = editor;
});

// Performance monitoring
if (window.performance && window.performance.mark) {
    window.performance.mark('three-editor-loaded');
}