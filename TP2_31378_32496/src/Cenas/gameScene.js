// src/Cenas/gameScene.js
import Player from "../player.js"
import Enemy from "../enemy.js"
import AnimalEnemy from "../AnimalEnemy.js"
import PlantShooterEnemy from "../PlantShooterEnemy.js"
import StoneShooterEnemy from "../StoneShooterEnemy.js"
import TornadoShooterEnemy from "../TornadoShooterEnemy.js"
import ChefaoDividido from "../ChefaoDividido.js"
import MagoExplosivo from "../MagoExplosivo.js"
import PowerUpSystem from "../PowerUpSystem.js"

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" })
    this.resetGameState()
  }

  // Função para resetar completamente o estado do jogo
  resetGameState() {
    this.currentPhase = 1
    this.monstersToKill = 5
    this.monstersKilled = 0
    this.monstersKilledThisPhase = 0
    this.score = 0
    this.chefaoDerrotado = false
    this.powerUpShown = false
    this.gameOver = false
    this.enemiesActive = false

    console.log("Estado do jogo resetado para valores iniciais")
  }

  preload() {
    this.load.image("player", "src/assets/player.png")
    this.load.image("enemy", "src/assets/enemy.png")
    this.load.image("door", "src/assets/door.png")
    this.load.image("portaDecorativa", "src/assets/porta.png")
    this.load.image("bancadaEsq", "src/assets/bancadaEsq.png")
    this.load.image("bancadaDir", "src/assets/bancadaDir.png")
    this.load.image("arrow", "src/assets/arrow.png")
    this.load.image("animalEnemy", "src/assets/animal_enemy.png")
    this.load.image("plantEnemy", "src/assets/plant_enemy.png")
    this.load.image("stoneEnemy", "src/assets/stone_enemy.png")
    this.load.image("tornadoEnemy", "src/assets/tornado_enemy.png")
    this.load.image("tornadoProjectile", "src/assets/tornado_projectile.png")
    this.load.image("pedra", "src/assets/obstaculo_pedra.png")
    this.load.image("gameOverImage", "/src/assets/game_over.png")
    this.load.image("playerDead", "src/assets/playerDead.png")
    this.load.image("angel", "src/assets/angel.png")
    this.load.image("crossIcon", "src/assets/cross_icon.png")
    this.load.image("swordIcon", "src/assets/sword_icon.png")
    this.load.image("chefao", "src/assets/chefao_aranha.png")
    this.load.image("mago", "src/assets/mago_explosivo.png")
  }

  create() {
    // Reseta o estado do jogo sempre que a cena é criada
    this.resetGameState()

    // Criar a grelha de quadrados intercalados
    const cols = 9
    const rows = 9
    const cellSize = 60
    const startX = this.cameras.main.centerX - (cols * cellSize) / 2
    const startY = 120
    this.arrows = []
    this.obstaculos = []
    this.obstaculoPositions = new Set()

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * cellSize
        const y = startY + row * cellSize

        const isLight = (row + col) % 2 === 0
        const color = isLight ? 0xeee5c9 : 0xcbb89d

        this.add.rectangle(x + cellSize / 2, y + cellSize / 2, cellSize, cellSize, color).setStrokeStyle(1, 0x000000)
      }
    }

    // Limites do campo
    this.gridBounds = {
      left: startX,
      right: startX + cols * cellSize,
      top: startY,
      bottom: startY + rows * cellSize,
    }

    // Criar obstáculos apenas se não for fase de chefão
    this.createObstacles()

    // Porta decorativa
    this.decorativeDoor = this.add.image(this.cameras.main.centerX, this.gridBounds.top - 0, "portaDecorativa")
    this.decorativeDoor.setOrigin(0.5, 1)
    this.decorativeDoor.setScale(0.43)
    this.decorativeDoor.setDepth(-1)

    // Bancadas
    const bancadaAltura = 150

    this.add
      .image(this.gridBounds.left + 50, this.gridBounds.top + bancadaAltura / 2, "bancadaEsq")
      .setOrigin(1, 0.5)
      .setScale(0.6)
      .setDepth(-1)

    this.add
      .image(this.gridBounds.left + 50, this.gridBounds.bottom - bancadaAltura / 2, "bancadaEsq")
      .setOrigin(1, 0.5)
      .setScale(0.6)
      .setDepth(-1)

    this.add
      .image(this.gridBounds.right - 50, this.gridBounds.top + bancadaAltura / 2, "bancadaDir")
      .setOrigin(0, 0.5)
      .setScale(0.6)
      .setDepth(-1)

    this.add
      .image(this.gridBounds.right - 50, this.gridBounds.bottom - bancadaAltura / 2, "bancadaDir")
      .setOrigin(0, 0.5)
      .setScale(0.6)
      .setDepth(-1)

    // Jogador - sempre na posição inicial
    this.player = new Player(this, this.cameras.main.centerX, startY + rows * cellSize - 30, "player")

    // Sistema de poderes - sempre resetado
    this.powerUpSystem = new PowerUpSystem(this)

    // Porta
    this.door = this.add
      .image(this.cameras.main.centerX, startY - 20, "door")
      .setScale(0.2)
      .setAlpha(0)

    // Texto da fase na porta
    this.doorPhaseText = this.add
      .text(this.door.x + 4, this.door.y - 42, `${this.currentPhase}`, {
        fontFamily: "Arial Black",
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(10)

    // Textos de UI
    this.phaseText = this.add.text(10, 10, `Fase: ${this.currentPhase}`, { fontSize: "24px", fill: "#fff" })
    this.monstersKilledText = this.add.text(10, 40, `Monstros mortos: ${this.monstersKilled}`, {
      fontSize: "24px",
      fill: "#fff",
    })

    // Gerar inimigos
    this.enemyGroup = []
    this.spawnEnemiesForPhase()

    // Ativar inimigos após delay
    this.time.delayedCall(1500, () => {
      this.enemiesActive = true
    })

    console.log(`Jogo iniciado na fase ${this.currentPhase}`)
  }

  // Nova função para criar obstáculos baseada na fase
  createObstacles() {
    // Remove obstáculos existentes
    this.obstaculos.forEach((obstacle) => obstacle.destroy())
    this.obstaculos = []
    this.obstaculoPositions.clear()

    // Não cria obstáculos em fases de chefão (múltiplos de 10) ou recuperação
    if (this.isBossPhase() || this.isRecoveryPhase()) {
      return
    }

    const cols = 9
    const rows = 9
    const cellSize = 60
    const totalObstaculos = Phaser.Math.Between(3, 5)

    // Posição inicial do jogador (para evitar spawnar pedras lá)
    const playerStartX = this.cameras.main.centerX
    const playerStartY = this.gridBounds.bottom - 30

    while (this.obstaculos.length < totalObstaculos) {
      const col = Phaser.Math.Between(0, cols - 1)
      const row = Phaser.Math.Between(0, rows - 1)
      const key = `${col},${row}`

      const x = this.gridBounds.left + col * cellSize + cellSize / 2
      const y = this.gridBounds.top + row * cellSize + cellSize / 2

      // Verifica se a posição não está muito próxima do jogador
      const distanceToPlayer = Phaser.Math.Distance.Between(x, y, playerStartX, playerStartY)
      const minDistanceFromPlayer = 120 // Distância mínima do jogador (2 células)

      if (!this.obstaculoPositions.has(key) && distanceToPlayer > minDistanceFromPlayer) {
        const sprite = this.add.image(x, y, "pedra").setScale(0.2)
        this.obstaculos.push(sprite)
        this.obstaculoPositions.add(key)
      }
    }
  }

  // Verifica se é fase de chefão
  isBossPhase() {
    return this.currentPhase % 10 === 0
  }

  // Verifica se é fase de recuperação
  isRecoveryPhase() {
    return [5, 15, 25, 35, 45].includes(this.currentPhase)
  }

  // Nova função para spawnar inimigos baseada na fase
  spawnEnemiesForPhase() {
    this.enemyGroup = []

    if (this.isBossPhase()) {
      // Define qual chefão spawnar baseado na fase específica
      if (this.currentPhase === 10 || this.currentPhase === 30) {
        this.spawnChefao() // Aranha nas fases 10 e 30
      } else if (this.currentPhase === 20 || this.currentPhase === 40 || this.currentPhase === 50) {
        this.spawnMago() // Mago nas fases 20, 40 e 50
      } else {
        // Para fases além da 50 (60, 70, etc.), pode alternar ou criar padrão
        if (this.currentPhase % 20 === 0) {
          this.spawnMago() // Fases 60, 80, 100... = Mago
        } else {
          this.spawnChefao() // Fases 70, 90, 110... = Aranha
        }
      }
      this.monstersToKill = 1
    } else {
      this.monstersToKill = 5
      for (let i = 0; i < this.monstersToKill; i++) {
        this.spawnEnemy()
      }
    }

    // Aplica buff de dificuldade baseado na fase atual
    this.applyPhaseBuffToEnemies()
  }

  // Nova função para aplicar buff de dificuldade
  applyPhaseBuffToEnemies() {
    // Calcula o buff baseado na fase (fase 1 = sem buff, fase 2 = +20 vida +3 dano, etc.)
    const phaseMultiplier = this.currentPhase - 1
    const healthBonus = phaseMultiplier * 20
    const damageBonus = phaseMultiplier * 3

    console.log(`Fase ${this.currentPhase}: Aplicando +${healthBonus} vida e +${damageBonus} dano aos inimigos`)

    this.enemyGroup.forEach((enemy) => {
      if (enemy.maxHealth) {
        enemy.maxHealth += healthBonus
        enemy.health = enemy.maxHealth // Vida atual = vida máxima
      }
      if (enemy.damage !== undefined) {
        enemy.damage += damageBonus
      }

      // Atualiza barra de vida se existir
      if (enemy.updateHealthBar) {
        enemy.updateHealthBar()
      }
    })
  }

  spawnEnemy() {
    const bounds = this.gridBounds
    let spawnX, spawnY

    do {
      spawnX = Phaser.Math.Between(bounds.left + 30, bounds.right - 30)
      spawnY = Phaser.Math.Between(bounds.top + 30, bounds.bottom - 30)
    } while (this.isPositionTooCloseToPlayer(spawnX, spawnY))

    let enemy
    const rand = Math.random()

    if (rand < 0.2) {
      enemy = new AnimalEnemy(this, spawnX, spawnY, "animalEnemy")
    } else if (rand < 0.45) {
      enemy = new Enemy(this, spawnX, spawnY, "enemy")
    } else if (rand < 0.7) {
      enemy = new PlantShooterEnemy(this, spawnX, spawnY, "plantEnemy")
    } else if (rand < 0.9) {
      enemy = new StoneShooterEnemy(this, spawnX, spawnY, "stoneEnemy")
    } else {
      enemy = new TornadoShooterEnemy(this, spawnX, spawnY, "tornadoEnemy")
    }

    this.enemyGroup.push(enemy)
  }

  spawnChefao() {
    const x = this.cameras.main.centerX
    const y = this.gridBounds.top + 100
    const chefao = new ChefaoDividido(this, x, y, "grande")
    this.enemyGroup.push(chefao)
    console.log("Chefão Aranha criado na fase", this.currentPhase)
  }

  spawnMago() {
    const x = this.cameras.main.centerX
    const y = this.gridBounds.top + 100
    const mago = new MagoExplosivo(this, x, y)
    this.enemyGroup.push(mago)
    console.log("Mago Explosivo criado na fase", this.currentPhase)
  }

  showDamage(x, y, amount, color = "#ffffff", key = "default") {
    if (!this.lastDamageTextTime) this.lastDamageTextTime = {}
    const now = this.time.now

    if (!this.lastDamageTextTime[key] || now - this.lastDamageTextTime[key] > 1000) {
      this.lastDamageTextTime[key] = now

      const text = this.add
        .text(x, y, `-${amount}`, {
          fontFamily: "Arial Black",
          fontSize: "22px",
          color,
          fontStyle: "bold",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5)

      this.tweens.add({
        targets: text,
        y: y - 30,
        alpha: 0,
        duration: 700,
        ease: "Cubic.easeOut",
        onComplete: () => text.destroy(),
      })
    }
  }

  isPositionTooCloseToPlayer(x, y) {
    return Phaser.Math.Distance.Between(x, y, this.player.player.x, this.player.player.y) < 400
  }

  // Nova função para verificar se deve mostrar seleção de poder
  checkForPowerUpSelection() {
    // Só mostra se todos os monstros foram mortos e ainda não mostrou
    if (this.monstersKilledThisPhase >= this.monstersToKill && !this.powerUpShown) {
      const shouldShowPowerUp = this.currentPhase % 2 === 0 && !this.isRecoveryPhase() && !this.isBossPhase()

      if (shouldShowPowerUp) {
        this.powerUpShown = true
        this.powerUpSystem.showPowerUpSelection()
        return true
      }
    }
    return false
  }

  update(time, delta) {
    this.player.update()
    this.arrows.forEach((arrow) => arrow.update(time, delta))
    this.arrows = this.arrows.filter((a) => a.sprite.active)

    // Atualiza inimigos (incluindo chefões)
    if (this.enemiesActive) {
      for (const enemy of this.enemyGroup) {
        if (enemy && enemy.update && !enemy.isDead) {
          enemy.update(this.player.player)
        }
      }
    }

    // Verificar colisão entre jogador e inimigos
    for (const enemy of this.enemyGroup) {
      if (enemy.health > 0 && !enemy.isDead) {
        if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.hitbox.getBounds(), enemy.hitbox.getBounds())) {
          this.player.takeDamage(enemy.damage || 25)
          this.showDamage(this.player.player.x, this.player.player.y - 40, enemy.damage || 25, "#ff4444", "player")

          enemy.takeDamage(10)
          this.showDamage(
            enemy.enemy.x,
            enemy.enemy.y - 40,
            10,
            "#ffffff",
            "enemy_" + enemy.enemy.x + "_" + enemy.enemy.y,
          )
        }
      }
    }

    // Verifica se deve mostrar seleção de poder ANTES da porta
    if (!this.checkForPowerUpSelection()) {
      // Só mostra a porta se não estiver selecionando poder
      if (this.monstersKilledThisPhase >= this.monstersToKill && !this.powerUpSystem.isSelectingPower) {
        this.showDoor()

        if (
          this.door.alpha > 0 &&
          Phaser.Geom.Intersects.RectangleToRectangle(this.player.hitbox.getBounds(), this.door.getBounds())
        ) {
          this.advancePhase()
        }
      }
    }

    if (this.player.health <= 0 && !this.gameOver) {
      this.player.die()
      return
    }

    // Atualizar textos
    this.phaseText.setText(`Fase: ${this.currentPhase}`)
    this.monstersKilledText.setText(`Monstros mortos: ${this.monstersKilled}`)
  }

  showDoor() {
    const allEnemiesDead = this.enemyGroup.every((enemy) => enemy.health <= 0 || enemy.isDead)

    if (allEnemiesDead) {
      this.door.setAlpha(1)
    }
  }

  advancePhase() {
    if (this.isBossPhase() && !this.chefaoDerrotado) {
      return
    }

    // Agora só avança a fase, pois a seleção de poder já foi feita
    this.score += 1
    this.currentPhase += 1
    this.continuePhase()
  }

  continuePhase() {
    this.monstersKilledThisPhase = 0
    this.chefaoDerrotado = false
    this.powerUpShown = false // Reset para próxima fase

    if (this.isRecoveryPhase()) {
      this.startRecoveryPhase()
    } else {
      // Limpa inimigos atuais
      this.enemyGroup.forEach((enemy) => enemy.die(true))
      this.enemyGroup = []

      // Reposiciona jogador
      this.player.player.x = this.cameras.main.centerX
      this.player.player.y = this.gridBounds.bottom - 30
      this.player.updateHealthBar()
      this.player.updateHealthText()

      // Recria obstáculos baseado na nova fase
      this.createObstacles()

      // Spawna inimigos para nova fase
      this.spawnEnemiesForPhase()
    }

    this.door.setAlpha(0)
    this.doorPhaseText.setText(`${this.currentPhase}`)

    this.enemiesActive = false
    this.time.delayedCall(1500, () => {
      this.enemiesActive = true
    })
  }

  chefaoMorreu() {
    console.log("Chefão foi derrotado!")
    this.chefaoDerrotado = true
    this.monstersKilledThisPhase = this.monstersToKill // Marca como completo
  }

  startRecoveryPhase() {
    const angel = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "angel").setScale(0.5)

    const blessingText = this.add
      .text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "Escolha uma benção:", {
        fontSize: "24px",
        fill: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)

    const recoveryButton = this.add
      .image(this.cameras.main.centerX - 100, this.cameras.main.centerY + 100, "crossIcon")
      .setScale(0.1)
      .setInteractive()
    recoveryButton.setOrigin(0.5)

    const damageButton = this.add
      .image(this.cameras.main.centerX + 100, this.cameras.main.centerY + 100, "swordIcon")
      .setScale(0.1)
      .setInteractive()
    damageButton.setOrigin(0.5)

    recoveryButton.on("pointerdown", () => {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 100)
      this.player.updateHealthBar()
      this.player.updateHealthText()
      angel.destroy()
      blessingText.destroy()
      recoveryButton.destroy()
      damageButton.destroy()
      this.time.delayedCall(2500, () => {
        this.advancePhase()
      })
    })

    damageButton.on("pointerdown", () => {
      // Log do valor antes
      console.log("Dano antes:", this.player.arrowDamage)

      // Aumenta o dano
      this.player.arrowDamage += 50

      // Log do valor depois
      console.log("Dano depois:", this.player.arrowDamage)

      // Feedback visual para o jogador
      const damageText = this.add
        .text(
          this.cameras.main.centerX,
          this.cameras.main.centerY + 50,
          `Dano aumentado para ${this.player.arrowDamage}!`,
          {
            fontSize: "20px",
            fill: "#ff6600",
            fontStyle: "bold",
            stroke: "#000000",
            strokeThickness: 3,
          },
        )
        .setOrigin(0.5)
        .setDepth(300)

      // Remove o texto após 2 segundos
      this.time.delayedCall(2000, () => {
        damageText.destroy()
      })

      angel.destroy()
      blessingText.destroy()
      recoveryButton.destroy()
      damageButton.destroy()
      this.time.delayedCall(2500, () => {
        this.advancePhase()
      })
    })
  }
}
