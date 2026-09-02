// require('polyfills');

var CONST = require('const');
var Extend = require('utils/object/Extend');

var Phaser = {

    Game: require('core/Game'),

    Scene: require('scene/Scene'),

    Scenes: require('scene'),

    Scale: require('scale'),

    Sound: require('sound'),

    Plugins: require('plugins'),

    Animations: require('animations'),

    Tweens: require('tweens'),

    Time: require('time'),

    Utils: require('utils'),

    Math: require('math'),

    Cameras: {
        Scene2D: require('cameras/2d')
    },

    Events: require('events/index'),

    Loader: require('loader'),

    TextureManager: require('textures/TextureManager'),

    Renderer: require('renderer'),

    Physics: {
        Arcade: require('physics/arcade')
    },

    Input: {
        Keyboard: require('input/keyboard'),
        Mouse: require('input/mouse'),
        Pointer: require('input/Pointer'),
        InputPlugin: require('input/InputPlugin')
    },

    GameObjects: {

        Events: require('gameobjects/events'),
        DisplayList: require('gameobjects/DisplayList'),
        UpdateList: require('gameobjects/UpdateList'),
        GameObjectFactory: require('gameobjects/GameObjectFactory'),
        GameObjectCreator: require('gameobjects/GameObjectCreator'),

        Sprite: require('gameobjects/sprite/Sprite'),
        Image: require('gameobjects/image/Image'),
        Text: require('gameobjects/text/Text'),
        Container: require('gameobjects/container/Container'),
        Graphics: require('gameobjects/graphics/Graphics'),
        Group: require('gameobjects/group/Group'),
        Blitter: require('gameobjects/blitter/Blitter'),
        TileSprite: require('gameobjects/tilesprite/TileSprite'),

        Factories: {
            Sprite: require('gameobjects/sprite/SpriteFactory'),
            Image: require('gameobjects/image/ImageFactory'),
            Text: require('gameobjects/text/TextFactory'),
            Container: require('gameobjects/container/ContainerFactory'),
            Graphics: require('gameobjects/graphics/GraphicsFactory'),
            Group: require('gameobjects/group/GroupFactory'),
            Blitter: require('gameobjects/blitter/BlitterFactory'),
            TileSprite: require('gameobjects/tilesprite/TileSpriteFactory')
        }

    }

};

Phaser = Extend(false, Phaser, CONST);
Phaser.default = Phaser;

module.exports = Phaser;
global.Phaser = Phaser;