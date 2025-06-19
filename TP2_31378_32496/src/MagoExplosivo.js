// src/Cenas/MagoExplosivo.js
export default class MagoExplosivo {
  constructor(scene, x, y) {
    this.scene = scene

    // Sprite do mago
    this.enemy = scene.add.image(x, y, "mago").setScale(0.15) // Assumindo que você tem uma imagem 'mago'
    this.enemy.setOrigin(0.5, 0.5)

    // Configurações do mago
    this.maxHealth = 12500
    this.health = this.maxHealth
    this.speed = 0.5 // Muito lento
    this.damage = 350

    // Sistema de invencibilidade
    this.isInvincible = false
    this.invincibilityDuration = 300
    this.lastDamageTime = 0

    // Movimento estratégico
    this.moveTimer = 0
    this.moveInterval = 3000 // Move a cada 3 segundos
    this.targetPosition = { x: x, y: y }
    this.isMoving = false

    // Sistema de ataques
    this.attackTimer = 0
    this.attackInterval = 2000 // Ataca a cada 2 segundos
    this.isLowHealth = false
    this.explosionCircles = []

    // Teleporte
    this.teleportTimer = 0
    this.teleportInterval = 8000 // Teleporta a cada 8 segundos
    this.isTeleporting = false

    // Hitbox
    this.hitbox = scene.add.rectangle(x, y, 60, 60, 0x00ff00, 0)
    this.hitbox.setOrigin(0.5, 0.5)

    // Propriedades para compatibilidade
    this.isEnemy = true
    this.isDead = false

    this.createHealthBar()
  }

  createHealthBar() {
    const barWidth = 100
    const barHeight = 10
    const yOffset = -70

    this.healthBarBg = this.scene.add.rectangle(this.enemy.x, this.enemy.y + yOffset, barWidth, barHeight, 0x000000)
    this.healthBar = this.scene.add.rectangle(this.enemy.x, this.enemy.y + yOffset, barWidth, barHeight, 0x8a2be2) // Roxo para mago
  }

  updateHealthBar() {
    if (this.healthBar && this.healthBarBg && !this.isDead) {
      const healthPercent = this.health / this.maxHealth
      this.healthBar.scaleX = healthPercent

      this.healthBarBg.setPosition(this.enemy.x, this.enemy.y - 70)
      this.healthBar.setPosition(this.enemy.x, this.enemy.y - 70)

      // Verifica se entrou em modo de vida baixa
      if (healthPercent <= 0.3 && !this.isLowHealth) {
        this.isLowHealth = true
        this.attackInterval = 1200 // Ataques mais frequentes
        console.log("Mago entrou em modo fúria!")
      }
    }
  }

  takeDamage(dano) {
    if (this.isDead || this.isInvincible) return

    this.isInvincible = true
    this.lastDamageTime = this.scene.time.now

    this.health -= dano
    this.updateHealthBar()

    // Efeito visual
    this.scene.tweens.add({
      targets: this.enemy,
      tint: 0xff0000,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        if (!this.isDead) {
          this.enemy.clearTint()
        }
      },
    })

    // Remove invencibilidade
    this.scene.time.delayedCall(this.invincibilityDuration, () => {
      this.isInvincible = false
    })

    if (this.health <= 0) {
      this.die()
    }
  }

  die(skipCount = false) {
    if (this.isDead) return
    this.isDead = true

    // Limpa círculos de explosão
    this.explosionCircles.forEach((circle) => {
      if (circle.graphic) circle.graphic.destroy()
      if (circle.timer) circle.timer.remove()
    })
    this.explosionCircles = []

    // Remove da lista de inimigos
    if (this.scene.enemyGroup) {
      const index = this.scene.enemyGroup.indexOf(this)
      if (index > -1) {
        this.scene.enemyGroup.splice(index, 1)
      }
    }

    if (!skipCount) {
      this.scene.monstersKilled++
      this.scene.monstersKilledThisPhase++
      this.scene.chefaoMorreu()
    }

    // Efeito de morte
    this.scene.tweens.add({
      targets: [this.enemy, this.healthBar, this.healthBarBg],
      alpha: 0,
      scale: 0,
      duration: 500,
      onComplete: () => {
        this.destroy()
      },
    })
  }

  // Movimento estratégico
  moveStrategically() {
    if (this.isDead || this.isTeleporting) return

    const now = this.scene.time.now

    if (now - this.moveTimer > this.moveInterval && !this.isMoving) {
      // Escolhe nova posição estratégica
      const bounds = this.scene.gridBounds
      const player = this.scene.player.player

      // Tenta manter distância do jogador
      let newX, newY
      do {
        newX = Phaser.Math.Between(bounds.left + 60, bounds.right - 60)
        newY = Phaser.Math.Between(bounds.top + 60, bounds.bottom - 60)
      } while (Phaser.Math.Distance.Between(newX, newY, player.x, player.y) < 150)

      this.targetPosition = { x: newX, y: newY }
      this.isMoving = true
      this.moveTimer = now
    }

    // Move em direção ao alvo
    if (this.isMoving) {
      const distance = Phaser.Math.Distance.Between(this.enemy.x, this.enemy.y, this.targetPosition.x, this.targetPosition.y)

      if (distance > 5) {
        const angle = Phaser.Math.Angle.Between(this.enemy.x, this.enemy.y, this.targetPosition.x, this.targetPosition.y)
        this.enemy.x += Math.cos(angle) * this.speed
        this.enemy.y += Math.sin(angle) * this.speed
        this.hitbox.setPosition(this.enemy.x, this.enemy.y)
      } else {
        this.isMoving = false
      }
    }
  }

  // Sistema de teleporte
  handleTeleport() {
    if (this.isDead) return

    const now = this.scene.time.now

    if (now - this.teleportTimer > this.teleportInterval && !this.isTeleporting) {
      this.startTeleport()
      this.teleportTimer = now
    }
  }

  startTeleport() {
    this.isTeleporting = true

    // Efeito visual de desaparecimento
    this.scene.tweens.add({
      targets: this.enemy,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => {
        // Reposiciona
        const bounds = this.scene.gridBounds
        const newX = Phaser.Math.Between(bounds.left + 60, bounds.right - 60)
        const newY = Phaser.Math.Between(bounds.top + 60, bounds.bottom - 60)

        this.enemy.setPosition(newX, newY)
        this.hitbox.setPosition(newX, newY)

        // Efeito de reaparecimento
        this.scene.tweens.add({
          targets: this.enemy,
          alpha: 1,
          scale: 0.15,
          duration: 300,
          onComplete: () => {
            this.isTeleporting = false
          },
        })
      },
    })
  }

  // Sistema de ataques com círculos explosivos
  handleAttacks() {
    if (this.isDead || this.isTeleporting) return

    const now = this.scene.time.now

    if (now - this.attackTimer > this.attackInterval) {
      if (this.isLowHealth) {
        this.createMultipleExplosionCircles()
      } else {
        this.createExplosionCircle()
      }
      this.attackTimer = now
    }
  }

  createExplosionCircle() {
    const player = this.scene.player.player
    const bounds = this.scene.gridBounds

    // Posição próxima ao jogador ou aleatória
    let targetX, targetY
    if (Math.random() < 0.7) {
      // 70% chance de mirar próximo ao jogador
      const offset = 80
      targetX = player.x + Phaser.Math.Between(-offset, offset)
      targetY = player.y + Phaser.Math.Between(-offset, offset)
    } else {
      // 30% chance de posição aleatória
      targetX = Phaser.Math.Between(bounds.left + 40, bounds.right - 40)
      targetY = Phaser.Math.Between(bounds.top + 40, bounds.bottom - 40)
    }

    // Garante que fica dentro dos limites
    targetX = Phaser.Math.Clamp(targetX, bounds.left + 40, bounds.right - 40)
    targetY = Phaser.Math.Clamp(targetY, bounds.top + 40, bounds.bottom - 40)

    this.createExplosionAt(targetX, targetY)
  }

  createMultipleExplosionCircles() {
    const numCircles = Phaser.Math.Between(3, 5)
    for (let i = 0; i < numCircles; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        this.createExplosionCircle()
      })
    }
  }

  createExplosionAt(x, y) {
    const radius = 50

    // Cria círculo vermelho de aviso
    const warningCircle = this.scene.add.circle(x, y, radius, 0xff0000, 0.3)
    warningCircle.setStrokeStyle(3, 0xff0000)

    const explosionData = {
      x: x,
      y: y,
      radius: radius,
      graphic: warningCircle,
      timer: null,
    }

    // Timer para explosão
    explosionData.timer = this.scene.time.delayedCall(1000, () => {
      this.explodeCircle(explosionData)
    })

    this.explosionCircles.push(explosionData)
  }

  explodeCircle(explosionData) {
    if (this.isDead) return

    // Remove círculo de aviso
    if (explosionData.graphic) {
      explosionData.graphic.destroy()
    }

    // Efeito de explosão
    const explosionEffect = this.scene.add.circle(explosionData.x, explosionData.y, explosionData.radius, 0xff4500, 0.8)

    this.scene.tweens.add({
      targets: explosionEffect,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        explosionEffect.destroy()
      },
    })

    // Verifica dano ao jogador
    const player = this.scene.player.player
    const distance = Phaser.Math.Distance.Between(player.x, player.y, explosionData.x, explosionData.y)

    if (distance <= explosionData.radius) {
      this.scene.player.takeDamage(this.damage)
      this.scene.showDamage(player.x, player.y - 40, this.damage, "#ff4444", "player")
    }

    // Remove da lista
    const index = this.explosionCircles.indexOf(explosionData)
    if (index > -1) {
      this.explosionCircles.splice(index, 1)
    }
  }

  update(player) {
    if (this.isDead) return

    this.moveStrategically()
    this.handleTeleport()
    this.handleAttacks()
    this.updateHealthBar()
  }

  destroy() {
    // Limpa círculos de explosão
    this.explosionCircles.forEach((circle) => {
      if (circle.graphic) circle.graphic.destroy()
      if (circle.timer) circle.timer.remove()
    })

    if (this.enemy) this.enemy.destroy()
    if (this.hitbox) this.hitbox.destroy()
    if (this.healthBar) this.healthBar.destroy()
    if (this.healthBarBg) this.healthBarBg.destroy()
  }
}
