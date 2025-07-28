// CodeBlocks.js - Foundation for JavaScript showcase functionality
// This module will serve as the base for future interactive code editor and showcase pages

class CodeBlockManager {
    constructor() {
        this.codeBlocks = new Map();
        this.themes = {
            dark: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                comment: '#6a9955',
                keyword: '#569cd6',
                string: '#ce9178',
                number: '#b5cea8',
                function: '#dcdcaa'
            },
            light: {
                background: '#ffffff',
                foreground: '#000000',
                comment: '#008000',
                keyword: '#0000ff',
                string: '#a31515',
                number: '#098658',
                function: '#795e26'
            }
        };
        this.currentTheme = 'dark';
        this.init();
    }

    init() {
        console.log('CodeBlockManager initialized - Ready for future showcase functionality');
        this.setupSyntaxHighlighting();
        this.setupThemeSystem();
    }

    // Setup basic syntax highlighting system
    setupSyntaxHighlighting() {
        this.syntaxRules = {
            keywords: /\b(var|let|const|function|class|if|else|for|while|return|import|export|async|await|try|catch|finally)\b/g,
            strings: /(["'])(?:(?!\1)[^\\]|\\.)*\1/g,
            numbers: /\b\d+(\.\d+)?\b/g,
            comments: /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            functions: /\b(\w+)\s*(?=\()/g
        };
    }

    // Setup theme system for code blocks
    setupThemeSystem() {
        // This will be used when implementing code editor pages
        this.applyTheme(this.currentTheme);
    }

    // Apply syntax highlighting to code block
    highlightCode(code, language = 'javascript') {
        let highlighted = code;

        // Apply syntax highlighting rules
        highlighted = highlighted.replace(this.syntaxRules.comments, '<span class="comment">$&</span>');
        highlighted = highlighted.replace(this.syntaxRules.strings, '<span class="string">$&</span>');
        highlighted = highlighted.replace(this.syntaxRules.keywords, '<span class="keyword">$&</span>');
        highlighted = highlighted.replace(this.syntaxRules.numbers, '<span class="number">$&</span>');
        highlighted = highlighted.replace(this.syntaxRules.functions, '<span class="function">$1</span>');

        return highlighted;
    }

    // Create a new code block element
    createCodeBlock(id, code, language = 'javascript', options = {}) {
        const codeBlock = {
            id,
            code,
            language,
            element: null,
            editable: options.editable || false,
            executable: options.executable || false,
            theme: options.theme || this.currentTheme
        };

        const element = document.createElement('div');
        element.className = 'code-block';
        element.setAttribute('data-language', language);
        element.setAttribute('data-theme', codeBlock.theme);

        if (codeBlock.editable) {
            element.contentEditable = true;
            element.addEventListener('input', (e) => {
                codeBlock.code = e.target.textContent;
                this.updateCodeBlock(id);
            });
        }

        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');
        codeElement.innerHTML = this.highlightCode(code, language);
        
        preElement.appendChild(codeElement);
        element.appendChild(preElement);

        if (codeBlock.executable) {
            const runButton = document.createElement('button');
            runButton.textContent = 'Run Code';
            runButton.className = 'run-button';
            runButton.addEventListener('click', () => this.executeCode(id));
            element.appendChild(runButton);
        }

        codeBlock.element = element;
        this.codeBlocks.set(id, codeBlock);

        return element;
    }

    // Update existing code block
    updateCodeBlock(id) {
        const codeBlock = this.codeBlocks.get(id);
        if (!codeBlock) return;

        const codeElement = codeBlock.element.querySelector('code');
        if (codeElement) {
            codeElement.innerHTML = this.highlightCode(codeBlock.code, codeBlock.language);
        }
    }

    // Execute code (for future interactive functionality)
    executeCode(id) {
        const codeBlock = this.codeBlocks.get(id);
        if (!codeBlock || !codeBlock.executable) return;

        try {
            // Create a safe execution context
            const result = this.safeExecute(codeBlock.code);
            this.displayResult(id, result);
        } catch (error) {
            this.displayError(id, error);
        }
    }

    // Safe code execution (limited scope)
    safeExecute(code) {
        // Create a limited execution context
        const context = {
            console: {
                log: (...args) => args.join(' ')
            },
            Math,
            Date,
            JSON,
            Array,
            Object,
            String,
            Number
        };

        // Use Function constructor for safer evaluation
        const func = new Function(...Object.keys(context), `"use strict"; ${code}`);
        return func(...Object.values(context));
    }

    // Display execution result
    displayResult(id, result) {
        const codeBlock = this.codeBlocks.get(id);
        if (!codeBlock) return;

        let resultElement = codeBlock.element.querySelector('.result');
        if (!resultElement) {
            resultElement = document.createElement('div');
            resultElement.className = 'result';
            codeBlock.element.appendChild(resultElement);
        }

        resultElement.innerHTML = `<strong>Result:</strong> ${JSON.stringify(result)}`;
        resultElement.classList.remove('error');
    }

    // Display execution error
    displayError(id, error) {
        const codeBlock = this.codeBlocks.get(id);
        if (!codeBlock) return;

        let resultElement = codeBlock.element.querySelector('.result');
        if (!resultElement) {
            resultElement = document.createElement('div');
            resultElement.className = 'result';
            codeBlock.element.appendChild(resultElement);
        }

        resultElement.innerHTML = `<strong>Error:</strong> ${error.message}`;
        resultElement.classList.add('error');
    }

    // Apply theme to all code blocks
    applyTheme(themeName) {
        if (!this.themes[themeName]) return;

        this.currentTheme = themeName;
        const theme = this.themes[themeName];

        // Create CSS for the theme
        const themeCSS = `
            .code-block[data-theme="${themeName}"] {
                background: ${theme.background};
                color: ${theme.foreground};
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
                font-family: 'Courier New', monospace;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
            
            .code-block[data-theme="${themeName}"] .comment { color: ${theme.comment}; }
            .code-block[data-theme="${themeName}"] .keyword { color: ${theme.keyword}; font-weight: bold; }
            .code-block[data-theme="${themeName}"] .string { color: ${theme.string}; }
            .code-block[data-theme="${themeName}"] .number { color: ${theme.number}; }
            .code-block[data-theme="${themeName}"] .function { color: ${theme.function}; }
            
            .code-block[data-theme="${themeName}"] .run-button {
                background: var(--primary-color);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-top: 8px;
                cursor: pointer;
                font-family: inherit;
                transition: all 0.3s ease;
            }
            
            .code-block[data-theme="${themeName}"] .run-button:hover {
                opacity: 0.8;
                transform: translateY(-1px);
            }
            
            .code-block[data-theme="${themeName}"] .result {
                margin-top: 8px;
                padding: 8px;
                border-radius: 4px;
                background: rgba(255, 255, 255, 0.1);
                font-size: 0.9em;
            }
            
            .code-block[data-theme="${themeName}"] .result.error {
                background: rgba(255, 0, 0, 0.2);
                color: #ff6b6b;
            }
        `;

        // Apply or update theme styles
        let styleElement = document.getElementById(`codeblock-theme-${themeName}`);
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = `codeblock-theme-${themeName}`;
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = themeCSS;
    }

    // Get all code blocks
    getAllCodeBlocks() {
        return Array.from(this.codeBlocks.values());
    }

    // Remove code block
    removeCodeBlock(id) {
        const codeBlock = this.codeBlocks.get(id);
        if (codeBlock && codeBlock.element && codeBlock.element.parentNode) {
            codeBlock.element.parentNode.removeChild(codeBlock.element);
        }
        this.codeBlocks.delete(id);
    }

    // Clear all code blocks
    clearAllCodeBlocks() {
        this.codeBlocks.forEach((codeBlock, id) => {
            this.removeCodeBlock(id);
        });
    }
}

// Portfolio integration helpers
class PortfolioCodeShowcase {
    constructor(codeBlockManager) {
        this.codeBlockManager = codeBlockManager;
        this.showcaseProjects = [];
    }

    // Add a showcase project
    addProject(project) {
        this.showcaseProjects.push({
            id: project.id || Date.now().toString(),
            title: project.title,
            description: project.description,
            code: project.code,
            language: project.language || 'javascript',
            tags: project.tags || [],
            difficulty: project.difficulty || 'intermediate',
            interactive: project.interactive || false
        });
    }

    // Create showcase page (foundation for future implementation)
    createShowcasePage() {
        const container = document.createElement('div');
        container.className = 'portfolio-showcase';
        
        // This is where the future showcase page will be rendered
        console.log('Showcase page foundation ready');
        
        return container;
    }

    // Integration with main portfolio colors
    syncWithPortfolioColors() {
        // Listen for color changes from main portfolio
        document.addEventListener('colorSystemUpdate', (event) => {
            const { primaryColor, secondaryColor, thirdColor } = event.detail;
            
            // Update code block themes to match portfolio colors
            this.updateShowcaseColors(primaryColor, secondaryColor, thirdColor);
        });
    }

    updateShowcaseColors(primary, secondary, third) {
        // Update CSS custom properties for code blocks
        document.documentElement.style.setProperty('--codeblock-primary', primary);
        document.documentElement.style.setProperty('--codeblock-secondary', secondary);
        document.documentElement.style.setProperty('--codeblock-accent', third);
    }
}

// Initialize when DOM is ready (if not already initialized by main script)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCodeBlocks);
} else {
    initCodeBlocks();
}

function initCodeBlocks() {
    // Only initialize if not already done
    if (!window.codeBlockManager) {
        window.codeBlockManager = new CodeBlockManager();
        window.portfolioCodeShowcase = new PortfolioCodeShowcase(window.codeBlockManager);
        
        console.log('CodeBlocks foundation initialized');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CodeBlockManager,
        PortfolioCodeShowcase
    };
}