'use client';

import Link from "next/link";
import styles from './styles/home.module.css';
import { instrumentSans } from './fonts';
import { useEffect, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  trail: boolean;
}

export default function Home() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    let animationFrameId: number;
    const updateParticles = () => {
      setParticles(prevParticles => 
        prevParticles
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx * 3,
            y: particle.y + particle.vy * 3,
            vy: particle.vy + (particle.trail ? 0.6 : 1.0),
            size: particle.trail ? particle.size * 0.8 : particle.size,
            life: particle.life - (particle.trail ? 8 : 4)
          }))
          .filter(particle => particle.life > 0)
      );
      animationFrameId = requestAnimationFrame(updateParticles);
    };

    updateParticles();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const createFirework = (x: number, y: number) => {
    const colors = ['#ff0000', '#ffa500', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#ee82ee', '#ff1493', '#00ffff'];
    const newParticles: Particle[] = [];
    
    // Create main burst particles
    for (let i = 0; i < 100; i++) {
      const angle = (Math.PI * 2 * i) / 100;
      const speed = 16 + Math.random() * 20;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Main particle
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20 + Math.random() * 10,
        color,
        size: 6 + Math.random() * 4,
        trail: false
      });

      // Trail particles
      for (let j = 0; j < 2; j++) {
        newParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed * 0.6,
          vy: Math.sin(angle) * speed * 0.6,
          life: 10 + Math.random() * 5,
          color,
          size: 3 + Math.random() * 2,
          trail: true
        });
      }
    }

    // Add secondary burst after a delay
    setTimeout(() => {
      setParticles(prev => {
        const secondaryBurst: Particle[] = [];
        for (let i = 0; i < 50; i++) {
          const angle = (Math.PI * 2 * i) / 50;
          const speed = 10 + Math.random() * 12;
          const color = colors[Math.floor(Math.random() * colors.length)];
          
          secondaryBurst.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 6,
            life: 15 + Math.random() * 8,
            color,
            size: 4 + Math.random() * 3,
            trail: false
          });
        }
        return [...prev, ...secondaryBurst];
      });
    }, 25);

    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleClick = (e: React.MouseEvent) => {
    createFirework(e.clientX, e.clientY);
  };

  // Add your prototypes to this array
  const prototypes = [
    {
      title: 'Example Prototype',
      description: 'Create your first prototype by adding a new page in the prototypes folder.',
      path: '/prototypes/example'
    },
    {
      title: 'Example Prototype 2',
      description: 'Create your first prototype by adding a new page in the prototypes folder.',
      path: '/prototypes/example2'
    },
    {
      title: 'Example Prototype 3',
      description: 'Create your first prototype by adding a new page in the prototypes folder.',
      path: '/prototypes/example3'
    },
    {
      title: 'Example Prototype 4',
      description: 'Create your first prototype by adding a new page in the prototypes folder.',
      path: '/prototypes/example4'
    },
    // Add your new prototypes here like this:
    // {
    //   title: 'My New Prototype',
    //   description: 'A short description of what this prototype does',
    //   path: '/prototypes/my-new-prototype'
    // },
  ];

  return (
    <div 
      className={`${styles.container} ${instrumentSans.className}`}
      onClick={handleClick}
    >
      <header className={styles.header}>
        <h1>Parth's prototypes</h1>
      </header>

      <main>
        <section className={styles.grid}>
          {/* Map through the prototypes array to create cards */}
          {prototypes.map((prototype, index) => (
            <Link 
              key={index}
              href={prototype.path} 
              className={styles.card}
            >
              <h3>{prototype.title}</h3>
              <p>{prototype.description}</p>
            </Link>
          ))}
        </section>
      </main>

      {particles.map((particle, index) => (
        <div
          key={index}
          style={{
            position: 'fixed',
            left: particle.x,
            top: particle.y,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: '50%',
            backgroundColor: particle.color,
            opacity: particle.life / (particle.trail ? 40 : 100),
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.size/2}px ${particle.color}`,
            transition: 'opacity 0.1s ease-out'
          }}
        />
      ))}
    </div>
  );
}
