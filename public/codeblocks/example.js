// Example JavaScript code for Daenyl.com portfolio showcase
// This demonstrates the codeblock functionality

// Example 1: Day-based color calculation
function calculateDayColors(date = new Date()) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    const primaryHue = Math.max(1, Math.min(dayOfYear, 365));
    const secondaryHue = (primaryHue - 50 + 360) % 360;
    const thirdHue = (primaryHue + 50) % 360;
    
    return { primaryHue, secondaryHue, thirdHue };
}

// Example 2: Animated background with lerping
class BackgroundAnimator {
    constructor() {
        this.time = 0;
        this.speed = 0.008;
    }
    
    update() {
        this.time += this.speed;
        
        const x = 50 + Math.sin(this.time) * 20;
        const y = 50 + Math.cos(this.time * 0.7) * 15;
        
        return { x, y };
    }
}

// Example 3: Color interpolation utility
function lerpColor(color1, color2, t) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Export for use in main portfolio
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateDayColors, BackgroundAnimator, lerpColor };
}
