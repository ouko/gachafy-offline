import React, { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    let nebulaGlows = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      createNebulaGlows()
    }

    const createNebulaGlows = () => {
      nebulaGlows = [
        {
          x: canvas.width * 0.2,
          y: canvas.height * 0.3,
          radius: Math.max(canvas.width, canvas.height) * 0.5,
          color: 'rgba(184, 41, 247, 0.1)'
        },
        {
          x: canvas.width * 0.8,
          y: canvas.height * 0.7,
          radius: Math.max(canvas.width, canvas.height) * 0.6,
          color: 'rgba(255, 0, 110, 0.08)'
        },
        {
          x: canvas.width * 0.5,
          y: canvas.height * 0.5,
          radius: Math.max(canvas.width, canvas.height) * 0.4,
          color: 'rgba(0, 240, 255, 0.05)'
        }
      ]
    }

    resize()
    window.addEventListener('resize', resize)

    // Create particles
    const createParticles = () => {
      particles = []
      const count = Math.min(100, Math.floor((canvas.width * canvas.height) / 10000))
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.8 + 0.2,
          alpha: Math.random() * 0.6 + 0.1,
          color: ['#FF006E', '#00F0FF', '#B829F7', '#FFFFFF'][Math.floor(Math.random() * 4)],
          pulse: Math.random() * 0.02,
          pulseDir: 1
        })
      }
    }
    createParticles()

    const animate = () => {
      // Clear with deep background
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw Nebula Glows
      nebulaGlows.forEach(glow => {
        const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.radius)
        gradient.addColorStop(0, glow.color)
        gradient.addColorStop(1, 'rgba(5, 5, 5, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      })

      // Draw and update particles
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Pulse alpha
        p.alpha += p.pulse * p.pulseDir
        if (p.alpha > 0.8 || p.alpha < 0.1) p.pulseDir *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()

        // Add a tiny glow to larger particles
        if (p.radius > 1.2) {
          ctx.shadowBlur = 10
          ctx.shadowColor = p.color
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      })
      ctx.globalAlpha = 1

      // Draw connections between nearby particles
      ctx.lineWidth = 0.5
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = '#FFFFFF'
            ctx.globalAlpha = 0.08 * (1 - dist / 100)
            ctx.stroke()
          }
        })
      })
      ctx.globalAlpha = 1

      // Vignette effect
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.width * 0.4,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.9
      )
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.6)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      animationId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  )
}
