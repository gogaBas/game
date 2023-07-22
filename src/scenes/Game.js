import Phaser from "../lib/phaser.js";

// import the carrot class here
import Carrot from "../game/Carrot.js";


export default class Game extends Phaser.Scene {
    /** @type {Phaser.Physics.Arcade.Sprite}  */
    player;
    /** @type {Phaser.Physics.Arcade.staticGroup}  */
    platforms;
    /** @type {Phaser.Types.Input.Keyboard.CursorKeys}  */
    cursors;
    /** @type {Phaser.Physics.Arcade.Group}  */
    carrots;
    /** @type {number}  */
    carrotsCollected = 0;
    carrotsCollectedText;


    constructor() {
        super("game");
    }
    preload() {
        // load background image
        this.load.image("background", "assets/bg_layer1.png");
        // load platform image
        this.load.image("platform", "assets/ground_grass.png");
        // load player image
        this.load.image("bunny-stand", "assets/bunny1_stand.png");
        // load carrot image
        this.load.image("carrot", "assets/carrot.png");

        // adding keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
    }
    create() {
        this.add.image(240, 320, "background").setScrollFactor(1, 0);
        // add a platform image in the middle
        // this.physics.add.image(240, 320, "platform").setScale(0.5);

        // create the group
        this.platforms = this.physics.add.staticGroup();

        // then create 5 platforms for the group
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(80, 400);
            const y = 150 * i;

            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, "platform");
            platform.scale = 0.5;

            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body;
            body.updateFromGameObject();

            // add count text
            const style = { color: "#000", fontSize: "24px"}
            this.carrotsCollectedText = this.add.text(240, 10, 'Carrots: 0', style)
                .setScrollFactor(0)
                .setOrigin(0.5, 0);
        }
        
        // create a bunny sprite
        this.player = this.physics.add
        .sprite(240, 320, "bunny-stand")
        .setScale(0.5);
        
        
        // add collision to the bunny and the platforms
        this.physics.add.collider(this.platforms, this.player);

        // take off some restrictions of player collision with the platforms
        this.player.body.checkCollision.up = false;
        this.player.body.checkCollision.left = false;
        this.player.body.checkCollision.right = false;

        // create camera that follows the player
        this.cameras.main.startFollow(this.player);

        // set the horizontal dead zone to 1.5x game width
        this.cameras.main.setDeadzone(this.scale.width * 1.5);
        
        // create a carrot
        this.carrots = this.physics.add.group({
            classType: Carrot
        });
        // this.carrots.get(240, 320, "carrot");
        // add this collider
        this.physics.add.collider(this.carrots, this.platforms);

        // formatted this way to make it easier to read
        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot, // called on overlap
            undefined,
            this
        )
    }
    update(t, dt) {
        this.platforms.children.iterate((child) => {
            /** @type {Phaser.Physics.Arcade.Sprite}  */
            const platform = child;

            const scrollY = this.cameras.main.scrollY;
            if (platform.y >= scrollY + 700) {
                platform.y = scrollY - Phaser.Math.Between(50, 100);
                platform.body.updateFromGameObject();

                // create a carrot above the platform being reused
                this.addCarrotAbove(platform);
            }
        });

        /* find out from Arcade Physics if the player's Physics Body 
        is touching a platform */
        const touchingGround = this.player.body.touching.down;

        if (touchingGround) {
            this.player.setVelocityY(-300);
        }

        const touchingDown = this.player.body.touching.down;

        if (touchingDown) {
            this.player.setVelocityY(-380);
        }
        // left and right input logic
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            // stop movement if not moving
            this.player.setVelocityX(0);
        }

        this.horizontalWrap(this.player);

        // bottom platform logic implementation
        const bottomPlatform = this.findBottomMostPlatform();
        if (this.player.y > bottomPlatform.y + 200) {
            console.log("game over");
        }
    }

    /** @param {Phaser.GameObjects.Sprite} sprite */
    horizontalWrap(sprite) {
        const halfWidth = sprite.displayWidth * 0.5;
        const gameWidth = this.scale.width;
        if (sprite.x < -halfWidth) {
            sprite.x = gameWidth + halfWidth;
        } else if (sprite.x > gameWidth + halfWidth) {
            sprite.x = -halfWidth;
        }
    }

    // /** @param {Phaser.GameObjects.Sprite} sprite */

    // addCarrotAbove(sprite) {
    //     const y = sprite.y - sprite.displayHeight;

    //     /** @type {Phaser.Physics.Arcade.Sprite} */
    //     const carrot = this.carrots.get(sprite.x, y, "carrot");

    //     // set active and visible
    //     carrot.setActive(true);
    //     carrot.setVisible(true);


    //     this.add.existing(carrot);

    //     // update the physics body size
    //     carrot.body.setSize(carrot.width, carrot.height);

    //     // make sure body is enabled in the physics world
    //     this.physics.world.enable(carrot);

    //     return carrot;
    // }

    // /** @param {Phaser.physics.Arcade.Sprite} player*/
    // /** @param {Carrot} carrot*/

    // handleCollectCarrot(player, carrot) {
        
    //     // hide from the display
    //     this.carrots.killAndHide(carrot);

    //     // disable from physics world
    //     this.physics.world.disableBody(carrot.body);

    //     // increment the number of carrots by 1
    //     this.carrotsCollected++;

    //     // create new text value and set it
    //     const value = `Carrots: ${this.carrotsCollected}`;
    //     this.carrotsCollectedText.text = value;
    // }
    
    // findBottomMostPlatform() {
    //     const platforms = this.platforms.getChildren();
    //     let bottomPlatform = platforms[0]

    //     for (let i = 1; i < platforms.length; ++i) {
    //         const platform = platforms[i]

    //         // discard any platforms that are above current
    //         if (platform.y > bottomPlatform.y) {
    //             continue
    //         }
    //         bottomPlatform = platform
    //     }
    //     return bottomPlatform
    // }

}
