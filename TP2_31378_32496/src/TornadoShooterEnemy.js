// src/TornadoShooterEnemy.js
export default class TornadoShooterEnemy {
  constructor(scene, x, y, key = 'tornadoEnemy') {
    this.scene = scene;
    this.enemy = scene.add.image(x, y, key).setScale(0.10);
    this.hitbox = scene.add.ellipse(x, y, 60, 70, 0x8888ff, 0).setOrigin(0.5, 0.5);

    this.health = 600;
    this.maxHealth = 600;
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();

    this.damage = 30;
    this.lastDamageTime = 0;
    this.invincibleDuration = 300;

    this.shootInterval = 3500;
    this.lastShotTime = 0;

    this.tornadoes = [];
    this.tornadoSpeed = 1.2;

    this.moving = true;
    this.moveDuration = 1000;
    this.pauseDuration = 2000;
    this.lastMoveToggle = scene.time.now;

    this.moveDirection = new Phaser.Math.Vector2(
      Phaser.Math.FloatBetween(-1, 1),
      Phaser.Math.FloatBetween(-1, 1)
    ).normalize();
    this.speed = 1.3;

    this.alive = true;
  }

  takeDamage(amount) {
    const now = this.scene.time.now;
    if (now - this.lastDamageTime > this.invincibleDuration) {
      this.health -= amount;
      this.lastDamageTime = now;

      if (this.health <= 0) this.die();
      else this.flash();

      this.updateHealthBar();
    }
  }

  flash() {
    this.enemy.setAlpha(0.5);
    this.scene.time.delayedCall(this.invincibleDuration, () => {
      if (this.enemy) this.enemy.setAlpha(1);
    });
  }

  updateHealthBar() {
    this.healthBar.clear();
    if (this.health < this.maxHealth) {
      this.healthBar.fillStyle(0xff0000, 1);
      this.healthBar.fillRect(this.enemy.x - 30, this.enemy.y - 55, 60 * (this.health / this.maxHealth), 5);
    }
  }

  die(skipCount = false) {
    this.alive = false;
    this.enemy.destroy();
    this.hitbox.destroy();
    this.healthBar.destroy();
    this.tornadoes.forEach(t => t.sprite.destroy());

    if (!skipCount) {
      this.scene.monstersKilled++;
      this.scene.monstersKilledThisPhase++;
    }
  }

  shootTornado(player) {
    const sprite = this.scene.add.image(this.enemy.x, this.enemy.y, 'tornadoProjectile').setScale(0.07);
    this.tornadoes.push({
      sprite,
      createdAt: this.scene.time.now
    });
  }

  // Função para verificar colisão com obstáculos enquanto o projétil se move
  checkCollisionsWithObstacles(proj) {
    return this.scene.obstaculos?.some(ob =>
      Phaser.Math.Distance.Between(proj.sprite.x, proj.sprite.y, ob.x, ob.y) < 30 // Verifica se o projétil colide com um obstáculo
    );
  }

  update(player) {
    const now = this.scene.time.now;

    if (this.alive) {
      if (this.moving && now - this.lastMoveToggle > this.moveDuration) {
        this.moving = false;
        this.lastMoveToggle = now;
      } else if (!this.moving && now - this.lastMoveToggle > this.pauseDuration) {
        this.moving = true;
        this.moveDirection = new Phaser.Math.Vector2(
          Phaser.Math.FloatBetween(-1, 1),
          Phaser.Math.FloatBetween(-1, 1)
        ).normalize();
        this.lastMoveToggle = now;
      }

      if (this.moving) {
        this.enemy.x += this.moveDirection.x * this.speed;
        this.enemy.y += this.moveDirection.y * this.speed;

        const bounds = this.scene.gridBounds;
        if (this.enemy.x < bounds.left) this.enemy.x = bounds.left;
        if (this.enemy.x > bounds.right) this.enemy.x = bounds.right;
        if (this.enemy.y < bounds.top) this.enemy.y = bounds.top;
        if (this.enemy.y > bounds.bottom) this.enemy.y = bounds.bottom;
      } else if (now - this.lastShotTime > this.shootInterval) {
        this.shootTornado(player);
        this.lastShotTime = now;
      }
    }

    this.tornadoes.forEach((t, i) => {
      const dx = player.x - t.sprite.x;
      const dy = player.y - t.sprite.y;
      const len = Math.hypot(dx, dy);
      const vx = (dx / len) * this.tornadoSpeed;
      const vy = (dy / len) * this.tornadoSpeed;

      t.sprite.x += vx;
      t.sprite.y += vy;
      t.sprite.flipX = vx < 0;

      // Verificar colisão com obstáculos (pedras)
      if (this.checkCollisionsWithObstacles(t)) {
        t.sprite.destroy(); // Destrói o projétil se colidir com um obstáculo
        this.tornadoes.splice(i, 1);
        return;
      }

      if (now - t.createdAt > 4000) {
        t.sprite.destroy();
        this.tornadoes.splice(i, 1);
        return;
      }

      if (Phaser.Math.Distance.Between(t.sprite.x, t.sprite.y, player.x, player.y) < 35) {
        this.scene.player.takeDamage(this.damage);

        // Mostrar dano em vermelho no jogador
        this.scene.showDamage(
          player.x,
          player.y - 30,
          this.damage,
          '#ff0000',
          'proj_tornado_' + Math.random()
        );

        t.sprite.destroy();
        this.tornadoes.splice(i, 1);
        return;
      }

      const bounds = this.scene.gridBounds;
      if (
        t.sprite.x < bounds.left - 30 || t.sprite.x > bounds.right + 30 ||
        t.sprite.y < bounds.top - 30 || t.sprite.y > bounds.bottom + 30
      ) {
        t.sprite.destroy();
        this.tornadoes.splice(i, 1);
      }
    });

    this.hitbox.setPosition(this.enemy.x, this.enemy.y);
    this.updateHealthBar();
  }
}
