import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export function FireworkCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0 });
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      
      // Add particles on move
      const dist = Math.hypot(mouse.current.x - lastMouse.current.x, mouse.current.y - lastMouse.current.y);
      if (dist > 5) {
        addParticles(mouse.current.x, mouse.current.y, 2);
        lastMouse.current = { ...mouse.current };
      }
    };

    const handleClick = (e: MouseEvent) => {
      addParticles(e.clientX, e.clientY, 15); // Explosion on click
    };

    const addParticles = (x: number, y: number, count: number) => {
      const colors = ['#f59e0b', '#fbbf24', '#f87171', '#fb7185', '#ffffff'];
      for (let i = 0; i < count; i++) {
        particles.current.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1.0,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 2 + 1
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life -= 0.02;
        
        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw custom cursor dot
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(mouse.current.x, mouse.current.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Outer glow for cursor
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f59e0b';
      ctx.stroke();
      ctx.shadowBlur = 0;

      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleClick);
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ cursor: 'none' }}
    />
  );
}
