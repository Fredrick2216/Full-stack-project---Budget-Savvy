
import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
  active: boolean;
  lifetime: number;
  currentLife: number;
}

interface Galaxy {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  opacity: number;
}

const SpaceBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const galaxiesRef = useRef<Galaxy[]>([]);
  const requestIdRef = useRef<number>(0);
  
  // Initialize stars, shooting stars, and galaxies
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to window size
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Re-initialize stars when window is resized
      initStars();
      initShootingStars();
      initGalaxies();
    };
    
    // Initialize 200 stars
    const initStars = () => {
      const stars: Star[] = [];
      const starCount = Math.min(200, Math.floor((canvas.width * canvas.height) / 5000));
      
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.3,
          speed: Math.random() * 0.05,
          twinkleSpeed: Math.random() * 0.05 + 0.01,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }
      
      starsRef.current = stars;
    };
    
    // Initialize shooting stars
    const initShootingStars = () => {
      const shootingStars: ShootingStar[] = [];
      const shootingStarCount = 5;
      
      for (let i = 0; i < shootingStarCount; i++) {
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height / 2, // Start in top half
          length: Math.random() * 80 + 40,
          speed: Math.random() * 5 + 5,
          opacity: 0,
          angle: Math.PI / 4 + (Math.random() * Math.PI / 4),
          active: false,
          lifetime: Math.random() * 100 + 50,
          currentLife: 0
        });
      }
      
      shootingStarsRef.current = shootingStars;
    };
    
    // Initialize galaxies
    const initGalaxies = () => {
      const galaxies: Galaxy[] = [];
      const galaxyCount = 3;
      const colors = ['#9B87F5', '#D946EF', '#6E59A5'];
      
      for (let i = 0; i < galaxyCount; i++) {
        galaxies.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 100 + 100,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() * 0.0005) + 0.0001,
          color: colors[i % colors.length],
          opacity: Math.random() * 0.2 + 0.05
        });
      }
      
      galaxiesRef.current = galaxies;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestIdRef.current);
    };
  }, []);
  
  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, 
        canvas.height / 2, 
        0, 
        canvas.width / 2, 
        canvas.height / 2, 
        canvas.width
      );
      gradient.addColorStop(0, '#13122b');
      gradient.addColorStop(0.5, '#0d0c21');
      gradient.addColorStop(1, '#070711');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw galaxies
      galaxiesRef.current.forEach(galaxy => {
        ctx.save();
        ctx.translate(galaxy.x, galaxy.y);
        ctx.rotate(galaxy.rotation);
        galaxy.rotation += galaxy.rotationSpeed;
        
        const galaxyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size);
        galaxyGradient.addColorStop(0, `${galaxy.color}88`);
        galaxyGradient.addColorStop(0.6, `${galaxy.color}44`);
        galaxyGradient.addColorStop(1, 'transparent');
        
        ctx.globalAlpha = galaxy.opacity;
        ctx.beginPath();
        ctx.ellipse(0, 0, galaxy.size, galaxy.size / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = galaxyGradient;
        ctx.fill();
        ctx.restore();
      });
      
      // Draw stars
      starsRef.current.forEach(star => {
        // Update star twinkle
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
        
        // Make stars drift slowly upward
        star.y -= star.speed;
        if (star.y < -5) {
          star.y = canvas.height + 5;
          star.x = Math.random() * canvas.width;
        }
        
        // Draw star
        ctx.globalAlpha = star.opacity * twinkle;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add subtle glow for larger stars
        if (star.size > 1.2) {
          const glow = ctx.createRadialGradient(
            star.x, star.y, 0, 
            star.x, star.y, star.size * 3
          );
          glow.addColorStop(0, `rgba(255, 255, 255, ${0.1 * twinkle})`);
          glow.addColorStop(1, 'transparent');
          
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      
      // Draw shooting stars
      shootingStarsRef.current.forEach(shootingStar => {
        // Randomly activate inactive shooting stars
        if (!shootingStar.active && Math.random() < 0.002) {
          shootingStar.active = true;
          shootingStar.x = Math.random() * canvas.width;
          shootingStar.y = -50; // Start above viewport
          shootingStar.opacity = 0;
          shootingStar.currentLife = 0;
          shootingStar.angle = Math.PI / 4 + (Math.random() * Math.PI / 4);
        }
        
        if (shootingStar.active) {
          shootingStar.currentLife++;
          
          // Fade in
          if (shootingStar.currentLife < 10) {
            shootingStar.opacity = shootingStar.currentLife / 10;
          }
          // Fade out
          else if (shootingStar.currentLife > shootingStar.lifetime - 10) {
            shootingStar.opacity = (shootingStar.lifetime - shootingStar.currentLife) / 10;
          }
          
          // Update position
          shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
          shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
          
          // Deactivate if out of bounds or lifetime expired
          if (
            shootingStar.x > canvas.width + 100 || 
            shootingStar.y > canvas.height + 100 ||
            shootingStar.currentLife >= shootingStar.lifetime
          ) {
            shootingStar.active = false;
          }
          
          // Draw shooting star
          if (shootingStar.active) {
            ctx.save();
            ctx.translate(shootingStar.x, shootingStar.y);
            ctx.rotate(shootingStar.angle);
            
            // Draw tail
            const tailGradient = ctx.createLinearGradient(0, 0, -shootingStar.length, 0);
            tailGradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
            tailGradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-shootingStar.length, 0);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = tailGradient;
            ctx.stroke();
            
            // Draw head
            ctx.globalAlpha = shootingStar.opacity;
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
          }
        }
      });
      
      requestIdRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    requestIdRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(requestIdRef.current);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 0 
      }}
    />
  );
};

export default SpaceBackground;
