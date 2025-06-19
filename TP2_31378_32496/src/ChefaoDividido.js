// src/Cenas/ChefaoDividido.js
export default class ChefaoDividido {
  constructor(scene, x, y, tipo = "grande") {
    this.scene = scene

    // Usando uma imagem em vez de um Sprite
    this.enemy = scene.add.image(x, y, "chefao").setScale(tipo === "grande" ? 0.2 : tipo === "medio" ? 0.1 : 0.05)
    this.enemy.setOrigin(0.5, 0.5)

    // Configurações do chefão
    this.tipo = tipo
    this.maxHealth = tipo === "grande" ? 2500 : tipo === "medio" ? 1250 : 750
    this.health = this.maxHealth
    this.speed = tipo === "grande" ? 1 : tipo === "medio" ? 1.5 : 2
    this.damage = 150

    // Sistema de invencibilidade
    this.isInvincible = false
    this.invincibilityDuration = 300 // 0.3 segundos em milissegundos
    this.lastDamageTime = 0

    // Movimentação do chefão
    this.changeDirectionInterval = 2000
    this.lastDirectionChange = 0
    this.direction = new Phaser.Math.Vector2(Phaser.Math.Between(-1, 1), Phaser.Math.Between(-1, 1)).normalize()

    // Cria hitbox (colisão)
    const hitboxSize = tipo === "grande" ? 80 : tipo === "medio" ? 60 : 40
    this.hitbox = scene.add.rectangle(x, y, hitboxSize, hitboxSize, 0x00ff00, 0)
    this.hitbox.setOrigin(0.5, 0.5)

    // Propriedades para compatibilidade com sistema de inimigos
    this.isEnemy = true
    this.isDead = false

    // Cria barra de vida
    this.createHealthBar()
  }

  createHealthBar() {
    const barWidth = this.tipo === "grande" ? 80 : this.tipo === "medio" ? 60 : 40
    const barHeight = 8
    const yOffset = this.tipo === "grande" ? -60 : this.tipo === "medio" ? -45 : -30

    // Fundo da barra
    this.healthBarBg = this.scene.add.rectangle(this.enemy.x, this.enemy.y + yOffset, barWidth, barHeight, 0x000000)

    // Barra de vida
    this.healthBar = this.scene.add.rectangle(this.enemy.x, this.enemy.y + yOffset, barWidth, barHeight, 0xff0000)
  }

  updateHealthBar() {
    if (this.healthBar && this.healthBarBg && !this.isDead) {
      const healthPercent = this.health / this.maxHealth
      this.healthBar.scaleX = healthPercent

      const yOffset = this.tipo === "grande" ? -60 : this.tipo === "medio" ? -45 : -30
      this.healthBarBg.setPosition(this.enemy.x, this.enemy.y + yOffset)
      this.healthBar.setPosition(this.enemy.x, this.enemy.y + yOffset)
    }
  }

  // Compatibilidade com sistema existente
  takeDamage(dano) {
    this.receberDano(dano)
  }

  receberDano(dano) {
    if (this.isDead || this.isInvincible) return

    // Ativa invencibilidade
    this.isInvincible = true
    this.lastDamageTime = this.scene.time.now

    this.health -= dano
    this.updateHealthBar()

    // Efeito visual de dano com piscada durante invencibilidade
    this.startInvincibilityEffect()

    // Timer para remover invencibilidade
    this.scene.time.delayedCall(this.invincibilityDuration, () => {
      this.isInvincible = false
      // Garante que a aranha volta ao normal após invencibilidade
      if (!this.isDead) {
        this.enemy.setAlpha(1)
        this.enemy.clearTint()
      }
    })

    if (this.health <= 0) {
      this.die()
    }
  }

  // Efeito visual durante invencibilidade
  startInvincibilityEffect() {
    if (this.isDead) return

    // Efeito de piscada (flashing) durante invencibilidade
    this.scene.tweens.add({
      targets: this.enemy,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(this.invincibilityDuration / 200), // Pisca durante toda a invencibilidade
      onComplete: () => {
        if (!this.isDead) {
          this.enemy.setAlpha(1)
        }
      },
    })

    // Efeito de cor vermelha inicial
    this.scene.tweens.add({
      targets: this.enemy,
      tint: 0xff0000,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        if (!this.isDead && !this.isInvincible) {
          this.enemy.clearTint()
        }
      },
    })
  }

  // Compatibilidade com sistema existente
  die(skipCount = false) {
    this.morrer(skipCount)
  }

  morrer(skipCount = false) {
    if (this.isDead) return
    this.isDead = true

    // Remove invencibilidade ao morrer
    this.isInvincible = false

    // Remove da lista de inimigos
    if (this.scene.enemyGroup) {
      const index = this.scene.enemyGroup.indexOf(this)
      if (index > -1) {
        this.scene.enemyGroup.splice(index, 1)
      }
    }

    // Incrementa contador se não for skip
    if (!skipCount) {
      this.scene.monstersKilled++
      this.scene.monstersKilledThisPhase++
    }

    // Cria chefões menores se necessário
    if (this.tipo === "grande") {
      this.criarChefoesMenores(2, "medio")
    } else if (this.tipo === "medio") {
      this.criarChefoesMenores(2, "pequeno")
    }

    // Verifica se todos os chefões foram derrotados
    this.checkAllBossesDefeated()

    // Efeito de morte
    this.scene.tweens.add({
      targets: [this.enemy, this.healthBar, this.healthBarBg],
      alpha: 0,
      scale: 0,
      duration: 300,
      onComplete: () => {
        this.destroy()
      },
    })
  }

  criarChefoesMenores(quantidade, tipoNovo) {
    for (let i = 0; i < quantidade; i++) {
      const offsetX = Phaser.Math.Between(-100, 100)
      const offsetY = Phaser.Math.Between(-100, 100)

      let newX = this.enemy.x + offsetX
      let newY = this.enemy.y + offsetY

      // Garante que fique dentro dos limites
      const bounds = this.scene.gridBounds
      newX = Phaser.Math.Clamp(newX, bounds.left + 50, bounds.right - 50)
      newY = Phaser.Math.Clamp(newY, bounds.top + 50, bounds.bottom - 50)

      const novoChefao = new ChefaoDividido(this.scene, newX, newY, tipoNovo)
      this.scene.enemyGroup.push(novoChefao)
    }
  }

  checkAllBossesDefeated() {
    // Pequeno delay para permitir que novos chefões sejam criados
    this.scene.time.delayedCall(100, () => {
      const chefoesVivos = this.scene.enemyGroup.filter((enemy) => enemy instanceof ChefaoDividido && !enemy.isDead)

      if (chefoesVivos.length === 0) {
        this.scene.chefaoMorreu()
      }
    })
  }

  moveRandomly() {
    if (this.isDead) return

    const now = this.scene.time.now

    if (now - this.lastDirectionChange > this.changeDirectionInterval) {
      this.direction = new Phaser.Math.Vector2(Phaser.Math.Between(-1, 1), Phaser.Math.Between(-1, 1)).normalize()
      this.lastDirectionChange = now
    }

    const newX = this.enemy.x + this.direction.x * this.speed
    const newY = this.enemy.y + this.direction.y * this.speed

    const bounds = this.scene.gridBounds
    if (newX < bounds.left + 40 || newX > bounds.right - 40) {
      this.direction.x = -this.direction.x
    }
    if (newY < bounds.top + 40 || newY > bounds.bottom - 40) {
      this.direction.y = -this.direction.y
    }

    this.enemy.setPosition(this.enemy.x + this.direction.x * this.speed, this.enemy.y + this.direction.y * this.speed)
    this.hitbox.setPosition(this.enemy.x, this.enemy.y)

    this.updateHealthBar()
  }

  // Compatibilidade com sistema existente - recebe o player como parâmetro
  update(player) {
    this.moveRandomly()

    // Colisão com projéteis é tratada no GameScene
    // Colisão com player é tratada no GameScene
  }

  destroy() {
    if (this.enemy) this.enemy.destroy()
    if (this.hitbox) this.hitbox.destroy()
    if (this.healthBar) this.healthBar.destroy()
    if (this.healthBarBg) this.healthBarBg.destroy()
  }
}
