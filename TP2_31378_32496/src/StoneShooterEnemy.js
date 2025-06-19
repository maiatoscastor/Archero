// src/StoneShooterEnemy.js
export default class StoneShooterEnemy {
  constructor(scene, x, y, key = 'stoneEnemy') {
    this.scene = scene;
    this.enemy = scene.add.image(x, y, key).setScale(0.11);
    this.hitbox = scene.add.ellipse(x, y, 60, 70, 0x888888, 0).setOrigin(0.5, 0.5);

    this.health = 600;
    this.maxHealth = 600;
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();

    this.damage = 20;
    this.lastDamageTime = 0;
    this.invincibleDuration = 200;

    this.shootInterval = 2500;
    this.lastShotTime = 0;

    this.projectiles = [];
    this.projectileSpeed = 2;

    this.moving = true;
    this.moveDuration = 1000;
    this.pauseDuration = 1500;
    this.lastMoveToggle = scene.time.now;

    this.moveDirection = new Phaser.Math.Vector2(
      Phaser.Math.FloatBetween(-1, 1),
      Phaser.Math.FloatBetween(-1, 1)
    ).normalize();
    this.speed = 1.2;

    this.alive = true;
  }

  takeDamage(amount) {
    const now = this.scene.time.now;
    if (!this.alive) return;
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
    this.projectiles.forEach(p => p.circle.destroy());
    this.projectiles = [];

    if (!skipCount) {
      this.scene.monstersKilled++;
      this.scene.monstersKilledThisPhase++;
    }
  }

  shootProjectiles() {
    if (!this.alive) return;

    for (let i = 0; i < 3; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const vx = Math.cos(angle) * this.projectileSpeed;
      const vy = Math.sin(angle) * this.projectileSpeed;

      const proj = {
        circle: this.scene.add.circle(this.enemy.x, this.enemy.y, 6, 0x5e4b3c),
        vx,
        vy,
        bounces: 0
      };

      this.projectiles.push(proj);
    }
  }

  // Função para verificar colisão com obstáculos
  checkCollisionsWithObstacles(proj) {
    return this.scene.obstaculos?.some(ob =>
      Phaser.Math.Distance.Between(proj.circle.x, proj.circle.y, ob.x, ob.y) < 30 // Verifica se o projétil colide com um obstáculo
    );
  }

  update(player) {
    if (!this.alive) return;

    const now = this.scene.time.now;

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
      this.shootProjectiles();
      this.lastShotTime = now;
    }

    const bounds = this.scene.gridBounds;
    this.projectiles.forEach((proj, index) => {
      proj.circle.x += proj.vx;
      proj.circle.y += proj.vy;

      // Verificar colisão com obstáculos (pedras)
      if (this.checkCollisionsWithObstacles(proj)) {
        proj.circle.destroy(); // Destrói o projétil se colidir com um obstáculo
        this.projectiles.splice(index, 1);
        return;
      }

      const rebounded = (
        (proj.circle.x < bounds.left || proj.circle.x > bounds.right) ||
        (proj.circle.y < bounds.top || proj.circle.y > bounds.bottom)
      );

      if (rebounded && proj.bounces < 3) {
        if (proj.circle.x < bounds.left || proj.circle.x > bounds.right) proj.vx *= -1;
        if (proj.circle.y < bounds.top || proj.circle.y > bounds.bottom) proj.vy *= -1;
        proj.bounces++;
      } else if (proj.bounces >= 3) {
        proj.circle.destroy();
        this.projectiles.splice(index, 1);
        return;
      }

      if (Phaser.Math.Distance.Between(proj.circle.x, proj.circle.y, player.x, player.y) < 30) {
        this.scene.player.takeDamage(this.damage);

        // Mostra dano em vermelho no jogador
        this.scene.showDamage(
          player.x,
          player.y - 30,
          this.damage,
          '#ff0000',
          'proj_stone_' + Math.random()
        );

        proj.circle.destroy();
        this.projectiles.splice(index, 1);
      }
    });

    this.hitbox.setPosition(this.enemy.x, this.enemy.y);
    this.updateHealthBar();
  }
}
