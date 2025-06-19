// src/animalEnemy.js
export default class AnimalEnemy {
  constructor(scene, x, y, key = 'animalEnemy') {
    this.scene = scene;
    this.enemy = scene.add.image(x, y, key).setScale(0.15);
    this.hitbox = scene.add.ellipse(x, y, 60, 70, 0x808080, 0);
    this.hitbox.setOrigin(0.5, 0.5);

    this.health = 400;
    this.maxHealth = 400;
    this.speed = 1.5;
    this.changeDirectionInterval = 1500;
    this.lastDirectionChange = 0;

    this.healthBar = scene.add.graphics();
    this.updateHealthBar();

    this.damage = 10;
    this.lastDamageTime = 0;
    this.invincibleDuration = 200;

    // Direção inicial aleatória
    this.direction = new Phaser.Math.Vector2(Phaser.Math.Between(-1, 1), Phaser.Math.Between(-1, 1)).normalize();
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
    this.enemy.destroy();
    this.hitbox.destroy();
    this.healthBar.destroy();
    if (!skipCount) {
      this.scene.monstersKilled++;
      this.scene.monstersKilledThisPhase++;
    }
  }

  handleCollision(playerHitbox) {
    playerHitbox.takeDamage(this.damage);
  }

  // Função que verifica se o inimigo pode se mover para uma nova posição
  canMoveTo(x, y) {
    return !this.scene.obstaculos?.some(ob =>
      Phaser.Math.Distance.Between(x, y, ob.x, ob.y) < 30 // Verifica se há um obstáculo na posição
    );
  }

  update() {
    const now = this.scene.time.now;

    // Muda de direção aleatoriamente
    if (now - this.lastDirectionChange > this.changeDirectionInterval) {
      this.direction = new Phaser.Math.Vector2(Phaser.Math.Between(-1, 1), Phaser.Math.Between(-1, 1)).normalize();
      this.lastDirectionChange = now;
    }

    // Calcula a nova posição do inimigo
    const newX = this.enemy.x + this.direction.x * this.speed;
    const newY = this.enemy.y + this.direction.y * this.speed;

    // Verifica se a nova posição não colide com um obstáculo
    if (this.canMoveTo(newX, newY)) {
      this.enemy.x = newX;
      this.enemy.y = newY;
    }

    // Garantir que o inimigo fica dentro da zona do campo
    const bounds = this.scene.gridBounds;
    if (this.enemy.x < bounds.left) this.enemy.x = bounds.left;
    if (this.enemy.x > bounds.right) this.enemy.x = bounds.right;
    if (this.enemy.y < bounds.top) this.enemy.y = bounds.top;
    if (this.enemy.y > bounds.bottom) this.enemy.y = bounds.bottom;

    this.hitbox.setPosition(this.enemy.x, this.enemy.y);
    this.updateHealthBar();
  }
}
