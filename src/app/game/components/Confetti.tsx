'use client';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  size: number;
  rotation: number;
  fallSpeed: number;
}

const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
const shapes: Array<'circle' | 'square' | 'triangle'> = ['circle', 'square', 'triangle'];

export default function Confetti({ play }: { play: boolean }) {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (play) {
      // Create 50 confetti pieces bursting from center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 50; // Distribute evenly in a circle
        const velocity = Math.random() * 200 + 100; // Random burst velocity
        const x = centerX + Math.cos(angle) * velocity;
        const y = centerY + Math.sin(angle) * velocity;

        return {
          id: i,
          x,
          y,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          size: Math.random() * 8 + 4, // 4-12px
          rotation: Math.random() * 360,
          fallSpeed: Math.random() * 0.5 + 0.5, // Random fall speed multiplier
        };
      });

      setConfettiPieces(pieces);

      // Clear confetti after 3 seconds
      setTimeout(() => {
        setConfettiPieces([]);
      }, 3000);
    }
  }, [play]);

  const renderShape = (piece: ConfettiPiece) => {
    const baseStyle = {
      width: piece.size,
      height: piece.size,
      backgroundColor: piece.color,
      position: 'absolute' as const,
    };

    switch (piece.shape) {
      case 'circle':
        return <div style={{ ...baseStyle, borderRadius: '50%' }} />;
      case 'square':
        return <div style={baseStyle} />;
      case 'triangle':
        return (
          <div
            style={{
              ...baseStyle,
              width: 0,
              height: 0,
              backgroundColor: 'transparent',
              borderLeft: `${piece.size / 2}px solid transparent`,
              borderRight: `${piece.size / 2}px solid transparent`,
              borderBottom: `${piece.size}px solid ${piece.color}`,
            }}
          />
        );
      default:
        return <div style={baseStyle} />;
    }
  };

  return (
    <AnimatePresence>
      {play && confettiPieces.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
        >
          {confettiPieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: 0,
                y: 0,
                rotate: piece.rotation,
                scale: 0,
              }}
              animate={{
                x: (Math.random() - 0.5) * 100, // Slight horizontal drift
                y: window.innerHeight - piece.y + 100, // Fall to bottom of screen
                rotate: piece.rotation + 360, // Spin as they fall
                scale: [0, 1, 1, 0], // Scale in, stay visible, scale out
              }}
              transition={{
                duration: 3 / piece.fallSpeed, // Different fall speeds
                ease: 'easeOut',
                scale: {
                  times: [0, 0.1, 0.9, 1],
                  duration: 3,
                },
              }}
              style={{
                position: 'absolute',
                left: piece.x,
                top: piece.y,
              }}
            >
              {renderShape(piece)}
            </motion.div>
          ))}

          {/* Winner text */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-center"
            >
              <div className="text-8xl mb-4">🎉</div>
              <div className="text-4xl font-bold text-yellow-400 drop-shadow-lg">WINNER!</div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
