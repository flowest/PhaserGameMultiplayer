const LEVEL_COUNT = 1;

window.onload = function () {
    let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
    game.state.add('play', PlayState);
    // game.state.start('play', true, false, { level: 0 });
    game.state.start('play', true, false,{ level: 0, fill: '#ffffff' });
};