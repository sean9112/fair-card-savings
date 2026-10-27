import Phaser from 'phaser';
import { gameConfig, gameSizeForViewport } from './game/config';
import './style.css';

const game = new Phaser.Game(gameConfig);

window.addEventListener('resize', () => {
  const size = gameSizeForViewport();
  if (game.scale.width !== size.width || game.scale.height !== size.height) {
    game.scale.setGameSize(size.width, size.height);
  }
});
