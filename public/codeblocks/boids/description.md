# Boids Flocking Simulation

A sophisticated 3D particle system demonstrating emergent flocking behavior with Three.js. This simulation features **200 interactive boids** that showcase complex group dynamics emerging from simple individual rules.

## Core Flocking Principles

Based on Craig Reynolds' original 1986 boids model, each agent follows three fundamental behaviors:

- **Separation**: Boids avoid crowding local flockmates (1.0 unit radius)
- **Alignment**: Boids steer towards the average heading of neighbors (2.0 unit radius)
- **Cohesion**: Boids steer towards the average position of neighbors (2.0 unit radius)

## Enhanced Features

### Interactive Elements
- **Mouse Attraction**: Hover to attract the flock toward your cursor
- **Orbital Camera**: Click and drag to rotate around the flock
- **Smooth Controls**: Responsive camera with spherical coordinate system

### Visual Design
- **Dynamic Colors**: Linear gradient coloring based on X-axis position
- **Smooth Orientation**: Quaternion-based rotation interpolation for natural movement
- **Cone Geometry**: Directional indicators showing each boid's heading
- **Realistic Lighting**: Ambient and directional lighting for depth perception

### Performance Optimizations
- **60 FPS Lock**: Precise frame timing for consistent performance
- **Viewport Pausing**: Automatically pauses when not visible to save resources
- **Optimized Rendering**: Efficient neighbor detection and force calculations

## Implementation Differences

This implementation enhances the classic boids model with several modern improvements:

### Boundary Behavior
- **Gentle Avoidance**: Instead of hard wrapping, boids smoothly turn away from boundaries
- **Reduced Force**: 90% weaker boundary forces for more natural edge behavior
- **Margin System**: 2-unit buffer zone for gradual turning responses

### Enhanced Dynamics
- **Higher Speed**: Increased maximum speed (3.5 units) for more dynamic movement
- **Stronger Forces**: Enhanced steering capabilities (0.05 max force) for responsive flocking
- **Smooth Interpolation**: Gradual orientation changes prevent jarring rotations

### Modern Rendering
- **WebGL Integration**: Hardware-accelerated 3D rendering with Three.js
- **Color Mapping**: Position-based hue progression creates visual flow indicators
- **Interactive Controls**: Real-time camera manipulation and mouse interaction

The result is a mesmerizing display of artificial life that demonstrates how simple rules can create complex, organic movement patterns reminiscent of bird flocks, fish schools, or insect swarms.