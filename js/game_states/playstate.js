var playingSoundtrack = true;
var heroCreated = false;

PlayState = {};
PlayState.init = function (data) {
    this.game.stage.disableVisibilityChange = true;
    this.game.renderer.renderSession.roundPixels = true;

    this.keys = this.game.input.keyboard.addKeys({
        left: Phaser.KeyCode.LEFT,
        right: Phaser.KeyCode.RIGHT,
        up: Phaser.KeyCode.UP,
        a: Phaser.KeyCode.A,
        d: Phaser.KeyCode.D,
        spacebar: Phaser.KeyCode.SPACEBAR,
        w: Phaser.KeyCode.W,
        x: Phaser.KeyCode.X,
    });

    this.coinPickupCount = 0;
    this.hasKey = false;

    this.level = (data.level || 0) % LEVEL_COUNT;
};

PlayState.preload = function () {
    this.game.load.json('level:0', 'data/level00.json');

    this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
    this.game.load.spritesheet('spider', 'images/spider.png', 42, 32);
    this.game.load.spritesheet('frog', 'images/frog.png', 34, 28);
    this.game.load.spritesheet('eagle', 'images/eagle.png', 40, 40);
    this.game.load.spritesheet('opossum', 'images/oposum.png', 36, 28);
    this.game.load.spritesheet('hero', 'images/hero.png', 36, 42);
    this.game.load.spritesheet('door', 'images/door.png', 42, 66);
    this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);
    this.game.load.spritesheet('fox', 'images/fox.png', 32, 32);
    this.game.load.spritesheet('decor', 'images/decor.png', 42, 42);

    this.game.load.image('invisible-wall', 'images/invisible_wall.png');
    this.game.load.image('icon:coin', 'images/coin_icon.png');
    this.game.load.image('font:numbers', 'images/numbers.png');
    this.game.load.image('key', 'images/key.png');
    this.game.load.image('door2', 'images/door2.png');
    this.game.load.image('background', 'images/background.png');
    this.game.load.image('fox_jump', 'images/fox-jump.png');
    this.game.load.image('ground', 'images/ground.png');
};

PlayState.create = function () {
    Client.askNewPlayer();

    this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));

    this._createHud();

    this.keys.a.onUp.add(function (e) {
        Client.sendMove(0);
    });

    this.keys.d.onUp.add(function () {
        Client.sendMove(0);
    });

    this.keys.spacebar.onDown.add(function (e) {
        Client.sendJump();
    });
};

PlayState.update = function () {

    if (heroCreated) {

        this._handleCollisions();
        this._handleInput();
        this.coinFont.text = `x${this.coinPickupCount}`;
        this.keyIcon.frame = this.hasKey ? 1 : 0;

        this.game.camera.focusOnXY(this.hero.x, this.hero.y - 200);
    }
};

PlayState._createHud = function () {
    this.keyIcon = this.game.make.image(0, 19, 'icon:key');
    this.keyIcon.anchor.set(0, 0.5);

    const NUMBERS_STR = '0123456789X';
    this.coinFont = this.game.add.retroFont('font:numbers', 20, 26,
        NUMBERS_STR, 6);

    let coinIcon = this.game.make.image(this.keyIcon.width + 7, 0, 'icon:coin');

    let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width,
        coinIcon.height / 2, this.coinFont);
    coinScoreImg.anchor.set(0, 0.5);

    this.hud = this.game.add.group();
    this.hud.add(coinIcon);
    this.hud.position.set(10, 10);
    this.hud.fixedToCamera = true;
    this.hud.add(coinScoreImg);
    this.hud.add(this.keyIcon);
};

PlayState._loadLevel = function (data) {
    this.game.add.image(0, 0, data.background);


    this.game.world.setBounds(0, -2000, 960, 3000);
    this.game.stage.backgroundColor = data.backgroundColor;
    // this.game.add.tileSprite(0, 0, this.game.world.width, this.game.world.height, 'background');

    this.bgDecoration = this.game.add.group();
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.enemies = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    // this.enemyWalls.visible = false;
    this.enemyWalls.alpha = 0;

    this.players = this.game.add.group();

    data.platforms.forEach(this._spawnPlatform, this);
    data.decoration.forEach(this._spawnDecoration, this);
    this._spawnCharacters({ hero: data.hero, spiders: data.spiders, frogs: data.frogs, eagles: data.eagles, opossums: data.opossums });
    data.coins.forEach(this._spawnCoin, this);
    this._spawnDoor(data.door.x, data.door.y, data.door.doorType);
    this._spawnKey(data.key.x, data.key.y);

    this.game.physics.arcade.gravity.y = data.gravity;
};

PlayState._spawnDecoration = function (decoration) {
    let deco = this.bgDecoration.create(decoration.x, decoration.y, 'decor');
    deco.anchor.set(0.5);

    deco.animations.add('type', [decoration.frame]);
    deco.animations.play('type');
}

PlayState._spawnDoor = function (x, y, doorType) {
    this.door = this.bgDecoration.create(x, y, doorType);
    this.door.anchor.setTo(0.5, 1);
    this.game.physics.enable(this.door);
    this.door.body.allowGravity = false;
};

PlayState._spawnKey = function (x, y) {
    this.key = this.bgDecoration.create(x, y, 'key');
    this.key.anchor.set(0.5, 0.5);
    this.game.physics.enable(this.key);
    this.key.body.allowGravity = false;

    this.key.y -= 3;
    this.game.add.tween(this.key)
        .to({ y: this.key.y + 6 }, 600, Phaser.Easing.Sinusoidal.InOut)
        .yoyo(true)
        .loop()
        .start();
};

PlayState._spawnPlatform = function (platform) {
    let sprite = this.platforms.create(
        platform.x, platform.y, platform.image);

    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');

    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
};

PlayState._spawnEnemyWall = function (x, y, side) {
    let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
    // anchor and y displacement
    sprite.anchor.set(side === 'left' ? 1 : 0, 1);

    // physic properties
    this.game.physics.enable(sprite);
    sprite.body.immovable = true;
    sprite.body.allowGravity = false;
};

PlayState._spawnCharacters = function (data) {
    // spawn hero
    // this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    // this.game.add.existing(this.hero);
};

PlayState._spawnCoin = function (coin) {
    let sprite = this.coins.create(coin.x, coin.y, 'coin');
    sprite.anchor.set(0.5, 0.5);

    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;

    sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6fps, looped
    sprite.animations.play('rotate');
};

PlayState._handleCollisions = function () {
    this.game.physics.arcade.collide(this.hero, this.platforms);

    this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin,
        null, this);

    this.game.physics.arcade.collide(this.enemies, this.platforms);

    this.game.physics.arcade.collide(this.enemies, this.enemyWalls);

    this.game.physics.arcade.overlap(this.hero, this.enemies,
        this._onHeroVsEnemy, null, this);

    this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey,
        null, this);

    this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor,
        // ignore if there is no key or the player is on air
        function (hero, door) {
            return this.hasKey && hero.body.touching.down;
        }, this);
};

PlayState._onHeroVsDoor = function (hero, door) {

    this.game.state.restart(true, false, { level: this.level + 1 });
};

PlayState._onHeroVsKey = function (hero, key) {

    key.kill();
    this.hasKey = true;
};

PlayState._onHeroVsEnemy = function (hero, enemy) {
    // if (hero.body.velocity.y > 0) { // kill enemies when hero is falling
    //     hero.bounce();
    //     enemy.die();

    // }
    // else { // game over -> restart the game

    //     this.game.state.restart(true, false, { level: this.level });
    // }
};

PlayState._onHeroVsCoin = function (hero, coin) {

    coin.kill();
    this.coinPickupCount++;
};

PlayState._handleInput = function () {
    if (this.keys.left.isDown || this.keys.a.isDown) { // move hero left
        this.hero.move(-1,true);
    }
    else if (this.keys.right.isDown || this.keys.d.isDown) { // move hero right
        this.hero.move(1,true);
    }
    else { // stop
        this.hero.move(0,true);
    }

    this.keys.up.onDown.add(function () {
        this._jumpButtonPressed();
    }, this);

    this.keys.spacebar.onDown.add(function () {
        this._jumpButtonPressed();
    }, this);

    this.keys.w.onDown.add(function () {
        this._jumpButtonPressed();
    }, this);
};

PlayState._jumpButtonPressed = function () {
    let didJump = this.hero.jump();
    if (didJump) {

    }
};

PlayState._addNewFox = function (newPlayer) {
    console.log("new player added");

    var newFox = new Hero(this.game, 0, 200);
    // this.enemies.add(newFox);
    Network.players[newPlayer.id] = this.enemies.add(newFox);
};

PlayState.movePlayer = function (data) {
    var player = Network.players[data.id];
    player.move(data.direction,false);
};

PlayState.removePlayer = function (id) {
    Network.players[id].destroy();
    delete Network.players[id];
};

PlayState.jumpPlayer = function (id) {
    var player = Network.players[id];
    player.jump();
};

PlayState.createPlayer = function () {
    heroCreated = true;
    this.hero = new Hero(this.game,0, 200);
    this.game.add.existing(this.hero);
}

Network = {};
Network.players = {};