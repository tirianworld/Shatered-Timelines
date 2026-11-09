export function launchConfetti(opts?: { particleCount?: number; spread?: number; origin?: { y: number } }) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const count = opts?.particleCount || 70;
  const spread = opts?.spread || 60;
  const originY = opts?.origin?.y !== undefined ? opts.origin.y : 0.6;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  const colors = ['#f59e0b', '#fbbf24', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#ffffff'];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.floor(Math.random() * 8 + 6);
    const startX = window.innerWidth / 2 + (Math.random() * 40 - 20);
    const startY = window.innerHeight * originY;

    el.style.position = 'absolute';
    el.style.left = `${startX}px`;
    el.style.top = `${startY}px`;
    el.style.width = `${size}px`;
    el.style.height = `${Math.floor(size * (Math.random() > 0.5 ? 1.5 : 1))}px`;
    el.style.backgroundColor = color;
    el.style.borderRadius = Math.random() > 0.5 ? '2px' : '50%';
    el.style.transform = `rotate(${Math.random() * 360}deg)`;
    el.style.opacity = '1';
    el.style.transition = 'all 1.2s cubic-bezier(0.25, 1, 0.5, 1)';

    container.appendChild(el);

    const angle = (Math.random() - 0.5) * (spread / 180) * Math.PI;
    const velocity = Math.random() * 400 + 200;
    const destX = startX + Math.sin(angle) * velocity;
    const destY = startY - Math.cos(angle) * velocity * 0.8 + 250;

    requestAnimationFrame(() => {
      el.style.left = `${destX}px`;
      el.style.top = `${destY}px`;
      el.style.opacity = '0';
      el.style.transform = `rotate(${Math.random() * 720}deg) scale(0.5)`;
    });
  }

  setTimeout(() => {
    container.remove();
  }, 1400);
}

export default launchConfetti;
