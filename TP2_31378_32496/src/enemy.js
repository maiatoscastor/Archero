// src/enemy.js
export default class Enemy {
  constructor(scene, x, y, key) {
    this.scene = scene;
    this.enemy = scene.add.image(x, y, key).setScale(0.15);  // Criar a imagem do inimigo
    this.lastDamageTime = 0;
    this.invincibleDuration = 200;
    this.showHealthBar = false;
    this.speed = 0.8;

    // Criar o hitbox oval para o inimigo
    this.hitbox = scene.add.ellipse(x, y, 60, 70, 0x808080, 0);  // Usando um retângulo simples para o hitbox
    this.hitbox.setOrigin(0.5, 0.5);

    this.health = 700;  // Vida do inimigo
    this.maxHealth = 700;

    // Barra de vida do monstro (sem números, só a barra)
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();

    // Definir o dano do inimigo
    this.damage = 0;  // Inicialmente sem dano
  }

  // Função para aplicar dano ao inimigo
  takeDamage(amount) {
    const now = this.scene.time.now;

    // Só aplica dano se o tempo de invencibilidade tiver passado
    if (now - this.lastDamageTime > this.invincibleDuration) {
      this.health -= amount;
      this.showHealthBar = true;
      this.lastDamageTime = now;

      if (this.health <= 0) {
        this.die();  // Se o inimigo morrer
      } else {
        this.flash(); // Aplica efeito visual (ver abaixo)
      }

      this.updateHealthBar(); // Atualiza a barra de vida
    }
  }

  flash() {
    this.enemy.setAlpha(0.5);
    this.scene.time.delayedCall(this.invincibleDuration, () => {
      if (this.enemy) this.enemy.setAlpha(1);
    });
  }

  // Atualiza a barra de vida do monstro
  updateHealthBar() {
    this.healthBar.clear();

    if (this.showHealthBar) {
      this.healthBar.fillStyle(0xff0000, 1);  // Vermelho
      this.healthBar.fillRect(this.enemy.x - 30, this.enemy.y - 55, 60 * (this.health / this.maxHealth), 5);
    }
  }

  // Função chamada quando o inimigo morre
  die(skipCount = false) {
    console.log('Enemy Dead!');
    this.enemy.destroy();  // Remove a imagem do inimigo
    this.hitbox.destroy(); // Remove o hitbox do inimigo
    this.healthBar.destroy(); // Remove a barra de vida do inimigo
    
    // Aumenta o contador de monstros mortos apenas se não for para pular a contagem
    if (!skipCount) {
      this.scene.monstersKilled += 1;      // Incrementa o total de monstros mortos
      this.scene.monstersKilledThisPhase += 1; // Incrementa os monstros mortos na fase atual
    }
  }

  // Função para detectar a colisão e aplicar dano ao jogador
  handleCollision(playerHitbox) {
    // O inimigo sempre causa dano quando colide com o jogador
    playerHitbox.takeDamage(this.damage);  // Aplicar o dano do inimigo baseado na fase
  }

  // Função que verifica se o inimigo pode se mover para uma nova posição
  canMoveTo(x, y) {
    return !this.scene.obstaculos?.some(ob =>
      Phaser.Math.Distance.Between(x, y, ob.x, ob.y) < 30 // Verifica se há um obstáculo na posição
    );
  }

  update(player) {
    const dx = player.x - this.enemy.x;
    const dy = player.y - this.enemy.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 1) {
      const velocityX = (dx / dist) * this.speed;
      const velocityY = (dy / dist) * this.speed;

      // Calcula a nova posição do inimigo
      const newX = this.enemy.x + velocityX;
      const newY = this.enemy.y + velocityY;

      // Verifica se a nova posição não colide com um obstáculo
      if (this.canMoveTo(newX, newY)) {
        this.enemy.x = newX;
        this.enemy.y = newY;
      }
    }

    // Garantir que o inimigo fica dentro da zona do campo
    const bounds = this.scene.gridBounds;

    // Corrigir posição X se sair dos limites
    if (this.enemy.x - this.hitbox.width / 2 < bounds.left) {
      this.enemy.x = bounds.left + this.hitbox.width / 2;
    } else if (this.enemy.x + this.hitbox.width / 2 > bounds.right) {
      this.enemy.x = bounds.right - this.hitbox.width / 2;
    }

    // Corrigir posição Y se sair dos limites
    if (this.enemy.y - this.hitbox.height / 2 < bounds.top) {
      this.enemy.y = bounds.top + this.hitbox.height / 2;
    } else if (this.enemy.y + this.hitbox.height / 2 > bounds.bottom) {
      this.enemy.y = bounds.bottom - this.hitbox.height / 2;
    }

    // Atualizar posição do hitbox e barra de vida
    this.hitbox.setPosition(this.enemy.x, this.enemy.y);
    this.updateHealthBar();
  }
}
