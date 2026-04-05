/**
 * js/background.js
 * Lightweight canvas particle system for ambient background animation.
 * Draws soft floating orbs to give depth without heavy libraries.
 */

const Background = (() => {

  let canvas, ctx, orbs = [], raf;

  const ORB_COUNT  = 6;
  const COLORS = [
    'rgba(255, 95, 31, 0.12)',
    'rgba(255, 60, 172, 0.10)',
    'rgba(0, 201, 177, 0.08)',
    'rgba(91, 141, 239, 0.08)',
  ];

  function init() {
    canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    spawnOrbs();
    animate();
    window.addEventListener('resize', resize);
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawnOrbs() {
    orbs = Array.from({ length: ORB_COUNT }, () => ({
      x    : Math.random() * window.innerWidth,
      y    : Math.random() * window.innerHeight,
      r    : 120 + Math.random() * 200,
      vx   : (Math.random() - 0.5) * 0.3,
      vy   : (Math.random() - 0.5) * 0.2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    orbs.forEach(o => {
      // Move
      o.x += o.vx;
      o.y += o.vy;

      // Soft bounce at edges
      if (o.x < -o.r)              o.x = canvas.width + o.r;
      if (o.x > canvas.width + o.r) o.x = -o.r;
      if (o.y < -o.r)              o.y = canvas.height + o.r;
      if (o.y > canvas.height + o.r) o.y = -o.r;

      // Draw radial gradient orb
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, o.color);
      g.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });

    raf = requestAnimationFrame(animate);
  }

  function destroy() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  }

  return { init, destroy };
})();

window.Background = Background;
