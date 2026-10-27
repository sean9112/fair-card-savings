import Phaser from 'phaser';
import GameScene from '../phaser/scenes/GameScene';

export const gameSizeForViewport = () => {
  const portrait = window.innerWidth < 760 && window.innerHeight > window.innerWidth;
  return portrait ? { width: 720, height: 1180 } : { width: 1280, height: 720 };
};

const initialSize = gameSizeForViewport();

export const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#e3eee7',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: initialSize.width,
    height: initialSize.height,
  },
  scene: [GameScene],
} satisfies Phaser.Types.Core.GameConfig;
