// src/main.js

import MainMenuScene from './Cenas/MainMenuScene.js';  // Importe a cena do menu principal
import GameScene from './Cenas/gameScene.js';  // Importe a cena do jogo

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: [MainMenuScene, GameScene]  // Adicione a cena MainMenuScene ao array de cenas
};

const game = new Phaser.Game(config);
