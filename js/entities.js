const Entities = (() => {
  const GRAVITY = 0.6;
  const FRICTION = 0.85;

  class Player {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 30;
      this.h = 60;
      this.vx = 0;
      this.vy = 0;
      this.speed = 4;
      this.jumpForce = -12;
      this.onGround = false;
      this.facing = 1;
      this.hp = 100;
      this.maxHp = 100;
      this.state = 'idle';
      this.attackTimer = 0;
      this.attackCooldown = 0;
      this.invincible = 0;
      this.animFrame = 0;
      this.weapon = 'sword';
      this.victoryPose = false;
    }

    update(input, platforms, hazards) {
      if (this.victoryPose) return;

      if (this.attackCooldown > 0) this.attackCooldown--;
      if (this.attackTimer > 0) this.attackTimer--;
      if (this.invincible > 0) this.invincible--;

      if (this.attackTimer <= 0) {
        if (input.left) { this.vx = -this.speed; this.facing = -1; this.state = 'run'; }
        else if (input.right) { this.vx = this.speed; this.facing = 1; this.state = 'run'; }
        else { this.vx *= FRICTION; this.state = this.onGround ? 'idle' : 'jump'; }

        if (input.jump && this.onGround) {
          this.vy = this.jumpForce;
          this.onGround = false;
          this.state = 'jump';
          AudioManager.play('jump');
        }

        if (input.attack && this.attackCooldown <= 0) {
          this.attackTimer = 15;
          this.attackCooldown = 30;
          this.state = 'attack';
          AudioManager.play('attack');
        }
      }

      this.vy += GRAVITY;
      this.x += this.vx;
      this.y += this.vy;

      this.onGround = false;
      for (const p of platforms) {
        if (this._collides(p)) {
          if (this.vy > 0 && this.y + this.h - this.vy <= p.y + 5) {
            this.y = p.y - this.h;
            this.vy = 0;
            this.onGround = true;
          } else if (this.vy < 0 && this.y - this.vy >= p.y + p.h - 5) {
            this.y = p.y + p.h;
            this.vy = 0;
          } else if (this.vx > 0) {
            this.x = p.x - this.w;
          } else if (this.vx < 0) {
            this.x = p.x + p.w;
          }
        }
      }

      for (const h of hazards) {
        if (this._collides(h) && this.invincible <= 0) {
          this.takeDamage(h.damage || 20);
        }
      }

      this.animFrame++;
    }

    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      this.invincible = 60;
      AudioManager.play('hit');
    }

    heal(amount) {
      this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    isAttacking() {
      return this.attackTimer > 10;
    }

    getAttackBox() {
      const reach = 40;
      return {
        x: this.facing > 0 ? this.x + this.w : this.x - reach,
        y: this.y + 10,
        w: reach,
        h: 40
      };
    }

    _collides(rect) {
      return this.x < rect.x + rect.w && this.x + this.w > rect.x &&
             this.y < rect.y + rect.h && this.y + this.h > rect.y;
    }

    draw(ctx) {
      const cx = this.x + this.w / 2;
      const cy = this.y;
      const f = this.facing;
      const blink = this.invincible > 0 && Math.floor(this.invincible / 4) % 2;

      if (blink) ctx.globalAlpha = 0.5;

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      const legSwing = this.state === 'run' ? Math.sin(this.animFrame * 0.3) * 8 : 0;
      const armSwing = this.state === 'run' ? Math.sin(this.animFrame * 0.3) * 6 : 0;

      ctx.beginPath();
      ctx.arc(cx, cy + 12, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx - 3 * f, cy + 10, 2, 0, Math.PI * 2);
      ctx.arc(cx + 3 * f, cy + 10, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy + 14, 3, 0, Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx, cy + 22);
      ctx.lineTo(cx, cy + 42);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 12 - armSwing * f, cy + 28);
      ctx.lineTo(cx, cy + 26);
      ctx.lineTo(cx + (this.state === 'attack' ? 25 * f : 12 + armSwing * f), cy + (this.state === 'attack' ? 20 : 28));
      ctx.stroke();

      if (this.weapon === 'sword' && this.state === 'attack') {
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 25 * f, cy + 20);
        ctx.lineTo(cx + 40 * f, cy + 10);
        ctx.stroke();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
      } else if (this.weapon === 'staff') {
        ctx.strokeStyle = '#9b59b6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx + 15 * f, cy + 15);
        ctx.lineTo(cx + 15 * f, cy - 5);
        ctx.stroke();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(cx + 15 * f, cy - 7, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
      }

      ctx.beginPath();
      ctx.moveTo(cx, cy + 42);
      ctx.lineTo(cx - 10 + legSwing, cy + 58);
      ctx.moveTo(cx, cy + 42);
      ctx.lineTo(cx + 10 - legSwing, cy + 58);
      ctx.stroke();

      if (this.victoryPose) {
        ctx.beginPath();
        ctx.moveTo(cx - 18, cy + 10);
        ctx.lineTo(cx - 25, cy - 5);
        ctx.moveTo(cx + 18, cy + 10);
        ctx.lineTo(cx + 25, cy - 5);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }
  }

  class Enemy {
    constructor(type, x, y, config = {}) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.config = config;
      this.hp = config.hp || 50;
      this.maxHp = this.hp;
      this.damage = config.damage || 15;
      this.speed = config.speed || 1.5;
      this.vx = config.vx || -this.speed;
      this.vy = 0;
      this.w = config.w || 40;
      this.h = config.h || 40;
      this.alive = true;
      this.attackTimer = 0;
      this.animFrame = 0;
      this.patrolMin = config.patrolMin || x - 100;
      this.patrolMax = config.patrolMax || x + 100;
      this.attackRange = config.attackRange || 50;
      this.attackCooldown = 0;
      this.flying = config.flying || false;
      this.boss = config.boss || false;
    }

    update(player, platforms) {
      if (!this.alive) return;
      this.animFrame++;
      if (this.attackCooldown > 0) this.attackCooldown--;

      const dx = player.x - this.x;
      const dist = Math.abs(dx);

      if (this.flying) {
        this.y += Math.sin(this.animFrame * 0.05) * 0.5;
        if (dist < 200) this.vx = dx > 0 ? this.speed : -this.speed;
        else this.vx *= 0.9;
      } else if (this.boss) {
        if (dist < 250 && dist > this.attackRange) {
          this.vx = dx > 0 ? this.speed * 1.2 : -this.speed * 1.2;
        } else if (dist <= this.attackRange && this.attackCooldown <= 0) {
          this.attackTimer = 20;
          this.attackCooldown = 60;
        } else {
          this.vx *= 0.9;
        }
      } else {
        this.x += this.vx;
        if (this.x <= this.patrolMin || this.x >= this.patrolMax) this.vx *= -1;
        if (dist < this.attackRange && this.attackCooldown <= 0) {
          this.attackTimer = 15;
          this.attackCooldown = 45;
        }
      }

      if (!this.flying) {
        this.x += this.vx;
        this.vy += GRAVITY;
        this.y += this.vy;
        for (const p of platforms) {
          if (this._collides(p) && this.vy > 0) {
            this.y = p.y - this.h;
            this.vy = 0;
          }
        }
      } else {
        this.x += this.vx;
      }

      if (this.attackTimer > 0) {
        this.attackTimer--;
        if (this.attackTimer === 5 && dist < this.attackRange + 20) {
          if (player.invincible <= 0) player.takeDamage(this.damage);
        }
      }

      if (player.isAttacking()) {
        const ab = player.getAttackBox();
        if (this._collides(ab)) {
          this.takeDamage(25);
        }
      }
    }

    takeDamage(amount) {
      this.hp -= amount;
      AudioManager.play('enemyHit');
      if (this.hp <= 0) {
        this.alive = false;
      }
    }

    _collides(rect) {
      return this.x < rect.x + rect.w && this.x + this.w > rect.x &&
             this.y < rect.y + rect.h && this.y + this.h > rect.y;
    }

    draw(ctx) {
      if (!this.alive) return;
      const cx = this.x + this.w / 2;
      const cy = this.y + this.h / 2;

      switch (this.type) {
        case 'slime': this._drawSlime(ctx, cx, cy); break;
        case 'bat': this._drawBat(ctx, cx, cy); break;
        case 'golem': this._drawGolem(ctx, cx, cy); break;
        case 'skeleton': this._drawSkeleton(ctx, cx, cy); break;
        case 'fire': this._drawFireMonster(ctx, cx, cy); break;
        case 'troll': this._drawTroll(ctx, cx, cy); break;
        case 'spider': this._drawSpider(ctx, cx, cy); break;
        case 'ghost': this._drawGhost(ctx, cx, cy); break;
        case 'knight': this._drawKnight(ctx, cx, cy); break;
        case 'dragon': this._drawDragon(ctx, cx, cy); break;
      }
    }

    _drawSlime(ctx, cx, cy) {
      const squish = Math.sin(this.animFrame * 0.1) * 3;
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 5 + squish, 20, 15 - squish * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.ellipse(cx, cy + 10, 15, 8, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx - 6, cy, 3, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx - 6, cy, 1.5, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawBat(ctx, cx, cy) {
      const wing = Math.sin(this.animFrame * 0.3) * 12;
      ctx.fillStyle = '#8e44ad';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6c3483';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy);
      ctx.quadraticCurveTo(cx - 20, cy - wing, cx - 30, cy + 5);
      ctx.lineTo(cx - 5, cy + 3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 5, cy);
      ctx.quadraticCurveTo(cx + 20, cy - wing, cx + 30, cy + 5);
      ctx.lineTo(cx + 5, cy + 3);
      ctx.fill();
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 1, 2, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawGolem(ctx, cx, cy) {
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(cx - 18, cy - 15, 36, 30);
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(cx - 14, cy - 20, 28, 10);
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(cx - 6, cy - 14, 3, 0, Math.PI * 2);
      ctx.arc(cx + 6, cy - 14, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawSkeleton(ctx, cx, cy) {
      ctx.strokeStyle = '#ecf0f1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 12, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 13, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 13, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx, cy + 12);
      ctx.moveTo(cx - 12, cy + 2);
      ctx.lineTo(cx + 12, cy + 2);
      ctx.moveTo(cx, cy + 12);
      ctx.lineTo(cx - 8, cy + 22);
      ctx.moveTo(cx, cy + 12);
      ctx.lineTo(cx + 8, cy + 22);
      ctx.stroke();
    }

    _drawFireMonster(ctx, cx, cy) {
      const flicker = Math.sin(this.animFrame * 0.2) * 3;
      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 22);
      grad.addColorStop(0, '#f1c40f');
      grad.addColorStop(0.5, '#e67e22');
      grad.addColorStop(1, '#e74c3c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 18 + flicker, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawTroll(ctx, cx, cy) {
      ctx.fillStyle = '#27ae60';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 22, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e8449';
      ctx.fillRect(cx - 20, cy - 25, 8, 12);
      ctx.fillRect(cx + 12, cy - 25, 8, 12);
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 3, 3, 0, Math.PI * 2);
      ctx.arc(cx + 7, cy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawSpider(ctx, cx, cy) {
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI - Math.PI / 2;
        const legMove = Math.sin(this.animFrame * 0.2 + i) * 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
        ctx.lineTo(cx + Math.cos(angle) * 22, cy + Math.sin(angle) * 22 + legMove);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
        ctx.lineTo(cx - Math.cos(angle) * 22, cy + Math.sin(angle) * 22 - legMove);
        ctx.stroke();
      }
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 2, 2, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    _drawGhost(ctx, cx, cy) {
      const alpha = 0.6 + Math.sin(this.animFrame * 0.05) * 0.2;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#bdc3c7';
      ctx.beginPath();
      ctx.arc(cx, cy - 5, 15, Math.PI, 0);
      ctx.lineTo(cx + 15, cy + 15);
      for (let i = 0; i < 4; i++) {
        const wx = cx + 15 - i * 10;
        ctx.lineTo(wx, cy + 15 + (i % 2 ? 5 : 0));
      }
      ctx.lineTo(cx - 15, cy + 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 5, 4, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    _drawKnight(ctx, cx, cy) {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(cx - 15, cy - 20, 30, 35);
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 30);
      ctx.lineTo(cx - 12, cy - 18);
      ctx.lineTo(cx + 12, cy - 18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(cx - 3, cy - 35, 6, 10);
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 12, 2, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy - 12, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + 15, cy);
      ctx.lineTo(cx + 30, cy - 15);
      ctx.stroke();
    }

    _drawDragon(ctx, cx, cy) {
      const wing = Math.sin(this.animFrame * 0.08) * 8;
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 30, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.moveTo(cx - 25, cy - 10);
      ctx.quadraticCurveTo(cx - 50, cy - 30 - wing, cx - 40, cy + 5);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 25, cy - 10);
      ctx.quadraticCurveTo(cx + 50, cy - 30 - wing, cx + 40, cy + 5);
      ctx.fill();
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.moveTo(cx + 25, cy);
      ctx.lineTo(cx + 40, cy + 5);
      ctx.lineTo(cx + 30, cy - 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 5, 4, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy - 5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(cx - 10, cy - 5, 2, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy - 5, 2, 0, Math.PI * 2);
      ctx.fill();
      if (this.attackTimer > 10) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.7)';
        ctx.beginPath();
        ctx.moveTo(cx + 30, cy);
        ctx.lineTo(cx + 60, cy - 10);
        ctx.lineTo(cx + 60, cy + 10);
        ctx.fill();
      }
    }
  }

  class Collectible {
    constructor(type, x, y) {
      this.type = type;
      this.x = x;
      this.y = y;
      this.w = 20;
      this.h = 20;
      this.collected = false;
      this.bobFrame = Math.random() * Math.PI * 2;
    }

    update() { this.bobFrame += 0.05; }

    draw(ctx) {
      if (this.collected) return;
      const bob = Math.sin(this.bobFrame) * 4;
      const cx = this.x + 10;
      const cy = this.y + 10 + bob;

      if (this.type === 'coin') {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#f39c12';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', cx, cy + 4);
      } else {
        ctx.fillStyle = '#ffe66d';
        const spikes = 5;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
          const r = i % 2 === 0 ? 10 : 5;
          const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
          const px = cx + Math.cos(a) * r;
          const py = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    collides(player) {
      if (this.collected) return false;
      return player.x < this.x + this.w && player.x + player.w > this.x &&
             player.y < this.y + this.h && player.y + player.h > this.y;
    }
  }

  class Princess {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 30;
      this.h = 55;
      this.animFrame = 0;
    }

    update() { this.animFrame++; }

    draw(ctx) {
      const cx = this.x + 15;
      const cy = this.y;
      const wave = Math.sin(this.animFrame * 0.05) * 2;

      ctx.fillStyle = '#f8c8dc';
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy + 20);
      ctx.quadraticCurveTo(cx - 20, cy + 55, cx, cy + 55);
      ctx.quadraticCurveTo(cx + 20, cy + 55, cx + 15, cy + 20);
      ctx.fill();

      ctx.fillStyle = '#fce4ec';
      ctx.beginPath();
      ctx.arc(cx, cy + 12, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e91e63';
      ctx.beginPath();
      ctx.arc(cx, cy + 5, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(cx - 12, cy + 5, 24, 8);

      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(cx - 3, cy + 11, 2, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy + 11, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e91e63';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy + 15, 3, 0, Math.PI);
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 8);
      ctx.lineTo(cx, cy - 18 + wave);
      ctx.lineTo(cx + 5, cy - 8);
      ctx.fill();
    }
  }

  function drawBackground(ctx, w, h, theme) {
    const themes = {
      forest: ['#2d5016', '#4a7c23', '#6abf4b'],
      cave: ['#1a1a2e', '#2d2d44', '#3d3d5c'],
      swamp: ['#1a3c1a', '#2d5a2d', '#4a7c4a'],
      tower: ['#4a3728', '#6b4f3a', '#8b7355'],
      castle: ['#2c2c3e', '#3d3d5c', '#5c5c7a'],
      fire: ['#4a1010', '#7a2020', '#c0392b'],
      maze: ['#1a2a1a', '#2d4a2d', '#3d6b3d'],
      ghost: ['#1a1a3e', '#2d2d5c', '#4a4a7c'],
      arena: ['#3e2723', '#5d4037', '#795548'],
      dragon: ['#1a0a0a', '#3d1010', '#6b1a1a']
    };

    const colors = themes[theme] || themes.forest;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(0.5, colors[1]);
    grad.addColorStop(1, colors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 20; i++) {
      const sx = (i * 137 + theme.length * 50) % w;
      const sy = (i * 89) % (h * 0.6);
      const sr = 2 + (i % 3);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (theme === 'forest') {
      for (let i = 0; i < 5; i++) {
        const tx = i * (w / 4) + 30;
        ctx.fillStyle = '#1a3c0a';
        ctx.beginPath();
        ctx.moveTo(tx, h * 0.5);
        ctx.lineTo(tx - 20, h * 0.5);
        ctx.lineTo(tx, h * 0.2);
        ctx.lineTo(tx + 20, h * 0.5);
        ctx.fill();
      }
    } else if (theme === 'cave') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * w / 3, 0);
        ctx.lineTo(i * w / 3 + 60, 0);
        ctx.lineTo(i * w / 3 + 30, h * 0.3);
        ctx.fill();
      }
    } else if (theme === 'fire') {
      ctx.globalAlpha = 0.3;
      for (let i = 0; i < 6; i++) {
        const fx = (i * 80 + Date.now() * 0.02) % w;
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(fx, h);
        ctx.quadraticCurveTo(fx + 15, h - 60, fx + 30, h);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (theme === 'dragon') {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#e74c3c';
      for (let i = 0; i < 8; i++) {
        const lx = (i * 100) % w;
        ctx.beginPath();
        ctx.ellipse(lx, h - 20, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  return { Player, Enemy, Collectible, Princess, drawBackground, GRAVITY };
})();
