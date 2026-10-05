import React, { useEffect, useRef } from 'react';

/**
 * CyberBackground
 * High-performance, cybersecurity-themed animated canvas background.
 * Features:
 * - Animated defensive node mesh with glowing cyan vectors & data packets
 * - Dual radar sweep scanners with concentric range rings & degree ticks
 * - Drifting cryptographic telemetry tokens (SHA-256, NIST, CIS, Merkle root)
 * - Interactive mouse reticle that dynamically connects laser vectors to nearby nodes
 * - Clearly visible yet non-distracting cyber aesthetic
 */
export function CyberBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Node & particle setup
    const NODE_COUNT = Math.min(55, Math.max(28, Math.floor(width / 30)));
    const nodes = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1.8,
        baseAlpha: Math.random() * 0.4 + 0.35,
        pulseSpeed: Math.random() * 0.025 + 0.015,
        pulseOffset: Math.random() * Math.PI * 2,
        isShieldNode: i % 6 === 0, // Defense node with outer perimeter ring
      });
    }

    // Drifting cyber telemetry tokens
    const TELEMETRY_TOKENS = [
      '[SHA256:e3b0c442...]',
      '[NIST-800-53:AC-4:ENFORCED]',
      '[CIS-V8.0:S4.1:PASS]',
      '[AIR-GAP:ISOLATED]',
      '[ZERO-TRUST:VERIFIED]',
      '[ISO-27001:A.8.22:ACTIVE]',
      '[MERKLE-ROOT:0x9F4A8C]',
      '[MISTRAL-7B:GBNF:ONLINE]',
      '[PORT-443:TLS1.3:PROTECTED]',
      '[AST-PARSER:CISCO-ASA:OK]',
      '[CHAIN-BLOCK:#1284:SEALED]',
      '[PGVECTOR:HNSW:READY]',
    ];

    const tokens = TELEMETRY_TOKENS.map((text, i) => ({
      text,
      x: (width / (TELEMETRY_TOKENS.length + 1)) * (i + 1) + (Math.random() * 80 - 40),
      y: Math.random() * height,
      vy: -0.25 - Math.random() * 0.2,
      alpha: Math.random() * 0.25 + 0.25,
    }));

    // Radar & scanline state
    let radarAngle = 0;
    let scanLineY = 0;
    let time = 0;

    let mouseX = -1000;
    let mouseY = -1000;
    let mouseHovering = false;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      mouseHovering = true;
    };

    const handleMouseLeave = () => {
      mouseHovering = false;
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      time += 0.018;
      radarAngle += 0.012;
      scanLineY = (scanLineY + 0.85) % height;

      ctx.clearRect(0, 0, width, height);

      // ── 1. Cyber Security Grid Lines & Crosshairs ──
      const gridSize = 72;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.065)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Small digital plus (+) markers at intersections
      ctx.fillStyle = 'rgba(0, 242, 254, 0.18)';
      for (let x = gridSize; x < width; x += gridSize * 2) {
        for (let y = gridSize; y < height; y += gridSize * 2) {
          ctx.fillRect(x - 2, y, 5, 1);
          ctx.fillRect(x, y - 2, 1, 5);
        }
      }

      // ── 2. Top-Right Cyber Defense Radar Scanner ──
      const radarX = Math.min(width - 130, width * 0.92);
      const radarY = 130;
      const radarRadius = 90;

      // Concentric range circles
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
      ctx.lineWidth = 1.2;
      [0.35, 0.68, 1].forEach((scale) => {
        ctx.beginPath();
        ctx.arc(radarX, radarY, radarRadius * scale, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Axis crosshairs with tick marks
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
      ctx.beginPath();
      ctx.moveTo(radarX - radarRadius - 8, radarY);
      ctx.lineTo(radarX + radarRadius + 8, radarY);
      ctx.moveTo(radarX, radarY - radarRadius - 8);
      ctx.lineTo(radarX, radarY + radarRadius + 8);
      ctx.stroke();

      // Degree labels
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.fillText('0°', radarX + radarRadius + 12, radarY + 3);
      ctx.fillText('180°', radarX - radarRadius - 32, radarY + 3);
      ctx.fillText('90°', radarX - 6, radarY + radarRadius + 14);
      ctx.fillText('270°', radarX - 10, radarY - radarRadius - 6);

      // Rotating radar sweep cone
      ctx.save();
      ctx.translate(radarX, radarY);
      ctx.rotate(radarAngle);
      const sweepGrad = ctx.createLinearGradient(0, 0, radarRadius, 0);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.42)');
      sweepGrad.addColorStop(0.6, 'rgba(0, 242, 254, 0.22)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radarRadius, 0, Math.PI / 3.5);
      ctx.closePath();
      ctx.fill();

      // Radar leading sweep vector
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radarRadius, 0);
      ctx.stroke();
      ctx.restore();

      // Radar blip target
      const blipAngle = time * 0.4;
      const blipDist = radarRadius * 0.58;
      const blipX = radarX + Math.cos(blipAngle) * blipDist;
      const blipY = radarY + Math.sin(blipAngle) * blipDist;
      ctx.fillStyle = 'rgba(0, 242, 254, 0.85)';
      ctx.beginPath();
      ctx.arc(blipX, blipY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // ── 3. Drifting Cyber Telemetry Strings ──
      ctx.font = '11px "JetBrains Mono", monospace';
      tokens.forEach((t) => {
        t.y += t.vy;
        if (t.y < -20) {
          t.y = height + 20;
          t.x = Math.random() * width;
        }
        ctx.fillStyle = `rgba(6, 182, 212, ${t.alpha})`;
        ctx.fillText(t.text, t.x, t.y);
      });

      // ── 4. Defense Network Mesh (Nodes & Connecting Vectors) ──
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) { n.x = 0; n.vx *= -1; }
        if (n.x > width) { n.x = width; n.vx *= -1; }
        if (n.y < 0) { n.y = 0; n.vy *= -1; }
        if (n.y > height) { n.y = height; n.vy *= -1; }

        // Mouse interaction: soft repel
        if (mouseHovering) {
          const dx = n.x - mouseX;
          const dy = n.y - mouseY;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          if (distToMouse < 150) {
            const force = (150 - distToMouse) / 150;
            n.x += (dx / distToMouse) * force * 1.8;
            n.y += (dy / distToMouse) * force * 1.8;
          }
        }
      });

      // Connecting vectors between nodes
      const maxDistance = 160;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.28;
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();

            // Animated cyber data packet pulse traveling along vector
            const packetPos = (time * 0.9 + (i * 5 + j) * 0.18) % 1;
            const px = n1.x + (n2.x - n1.x) * packetPos;
            const py = n1.y + (n2.y - n1.y) * packetPos;
            ctx.fillStyle = `rgba(0, 242, 254, ${Math.min(0.95, alpha * 3.5)})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw node bodies with cyber halos
      nodes.forEach((n) => {
        const pulse = Math.sin(time * 2.2 + n.pulseOffset);
        const dynamicAlpha = Math.max(0.2, n.baseAlpha + pulse * 0.15);

        // Outer glow
        const glowGrad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 3.5);
        glowGrad.addColorStop(0, `rgba(0, 242, 254, ${dynamicAlpha * 0.6})`);
        glowGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(6, 182, 212, ${Math.min(1, dynamicAlpha * 1.3)})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        // Defense Shield ring on perimeter nodes
        if (n.isShieldNode) {
          ctx.strokeStyle = `rgba(0, 242, 254, ${Math.min(0.85, dynamicAlpha * 1.2)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 3.8 + pulse * 1.8, 0, Math.PI * 2);
          ctx.stroke();

          // Mini satellite orbit
          const satAngle = time * 3 + n.pulseOffset;
          const satDist = n.radius * 4;
          const sx = n.x + Math.cos(satAngle) * satDist;
          const sy = n.y + Math.sin(satAngle) * satDist;
          ctx.fillStyle = 'rgba(0, 242, 254, 0.9)';
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ── 5. Interactive Mouse Reticle & Vector Coupling ──
      if (mouseHovering && mouseX > 0 && mouseY > 0) {
        // Find 4 nearest nodes and connect laser vectors
        const sortedNodes = [...nodes]
          .map((n) => ({ node: n, dist: Math.hypot(n.x - mouseX, n.y - mouseY) }))
          .filter((item) => item.dist < 220)
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 4);

        sortedNodes.forEach(({ node: n, dist }) => {
          const laserAlpha = (1 - dist / 220) * 0.45;
          ctx.strokeStyle = `rgba(0, 242, 254, ${laserAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(mouseX, mouseY);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Trailing packet towards cursor
          const p = (time * 1.5) % 1;
          const px = n.x + (mouseX - n.x) * p;
          const py = n.y + (mouseY - n.y) * p;
          ctx.fillStyle = 'rgba(0, 242, 254, 0.95)';
          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Targeting cursor ring
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 242, 254, 0.7)';
        ctx.beginPath();
        ctx.moveTo(mouseX - 20, mouseY);
        ctx.lineTo(mouseX - 10, mouseY);
        ctx.moveTo(mouseX + 10, mouseY);
        ctx.lineTo(mouseX + 20, mouseY);
        ctx.moveTo(mouseX, mouseY - 20);
        ctx.lineTo(mouseX, mouseY - 10);
        ctx.moveTo(mouseX, mouseY + 10);
        ctx.lineTo(mouseX, mouseY + 20);
        ctx.stroke();
      }

      // ── 6. Sweeping Cyber Horizon Scan Line ──
      const scanGrad = ctx.createLinearGradient(0, scanLineY - 12, 0, scanLineY + 2);
      scanGrad.addColorStop(0, 'rgba(6, 182, 212, 0.0)');
      scanGrad.addColorStop(1, 'rgba(6, 182, 212, 0.12)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanLineY - 12, width, 12);

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, scanLineY);
      ctx.lineTo(width, scanLineY);
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-90 transition-opacity duration-1000"
      />
    </div>
  );
}

export default CyberBackground;
