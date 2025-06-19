// src/PlantShooterEnemy.js
export default class PlantShooterEnemy {
  constructor(scene, x, y, key = 'plantEnemy') {
    this.scene = scene;
    this.enemy = scene.add.image(x, y, key).setScale(0.08);
    this.hitbox = scene.add.ellipse(x, y, 60, 70, 0x00ff00, 0);
    this.hitbox.setOrigin(0.5, 0.5);

    this.health = 700;
    this.maxHealth = 700;
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();

    this.damage = 25;
    this.lastDamageTime = 0;
    this.invincibleDuration = 200;

    this.lastShotTime = 0;
    this.shootInterval = 2000;

    this.projectiles = [];
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
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];

    if (!skipCount) {
      this.scene.monstersKilled++;
      this.scene.monstersKilledThisPhase++;
    }
  }

  update(player) {
    if (!this.alive) return;

    const now = this.scene.time.now;

    if (now - this.lastShotTime > this.shootInterval) {
      this.shootProjectile(player);
      this.lastShotTime = now;
    }

    this.projectiles.forEach((proj, index) => {
      proj.x += proj.vx;
      proj.y += proj.vy;

      // Verificar colisão com obstáculos (pedras)
      if (this.scene.obstaculos?.some(ob =>
        Phaser.Math.Distance.Between(proj.x, proj.y, ob.x, ob.y) < 30
      )) {
        proj.destroy(); // Destrói o projétil ao colidir com um obstáculo
        this.projectiles.splice(index, 1);
        return;
      }

      if (Phaser.Math.Distance.Between(proj.x, proj.y, player.x, player.y) < 30) {
        this.scene.player.takeDamage(this.damage);

        // Mostrar o dano sofrido pelo jogador em vermelho
        this.scene.showDamage(
          player.x,
          player.y - 30,
          this.damage,
          '#ff0000',
          'proj_' + Math.random()
        );

        proj.destroy();
        this.projectiles.splice(index, 1);
      }
    });

    this.hitbox.setPosition(this.enemy.x, this.enemy.y);
    this.updateHealthBar();
  }

  shootProjectile(player) {
    const proj = this.scene.add.circle(this.enemy.x, this.enemy.y, 6, 0x006400);
    const dx = player.x - this.enemy.x;
    const dy = player.y - this.enemy.y;
    const len = Math.hypot(dx, dy);
    const speed = 2;
    proj.vx = (dx / len) * speed;
    proj.vy = (dy / len) * speed;
    this.projectiles.push(proj);
  }
}
