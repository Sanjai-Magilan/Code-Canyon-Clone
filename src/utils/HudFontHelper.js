/**
 * Exact atlas pixel widths for every glyph in fonth.png.
 */
export const GLYPH_WIDTHS = {
  "A": 112,
  "B": 84,
  "C": 105,
  "D": 97,
  "E": 83,
  "F": 75,
  "G": 107,
  "H": 93,
  "I": 32,
  "J": 84,
  "K": 98,
  "L": 70,
  "M": 123,
  "N": 105,
  "O": 116,
  "P": 87,
  "Q": 116,
  "R": 85,
  "S": 90,
  "T": 95,
  "U": 95,
  "V": 105,
  "W": 165,
  "X": 104,
  "Y": 107,
  "Z": 85,
  "a": 86,
  "b": 88,
  "c": 80,
  "d": 88,
  "e": 79,
  "f": 76,
  "g": 87,
  "h": 85,
  "i": 36,
  "j": 56,
  "k": 83,
  "l": 52,
  "m": 119,
  "n": 79,
  "o": 84,
  "p": 81,
  "q": 86,
  "r": 67,
  "s": 70,
  "t": 67,
  "u": 81,
  "v": 75,
  "w": 121,
  "x": 84,
  "y": 85,
  "z": 70,
  "0": 100,
  "1": 55,
  "2": 87,
  "3": 83,
  "4": 84,
  "5": 78,
  "6": 80,
  "7": 81,
  "8": 78,
  "9": 80,
  ".": 34,
  "!": 44,
  "?": 37,
  "-": 34,
  "[": 73,
  "]": 36,
  ":": 57,
  "'": 82,
  ">": 49,
  "<": 49,
  " ": 50
};

/**
 * Reusable helper utility for rendering proportional text using the game's custom "hud-font" spritesheet.
 */
export default class HudFontHelper {
  /**
   * Maps a character to its corresponding frame index in fonth.png.
   * @param {string} char Single character string.
   * @returns {number|null} Frame index or null if space / unmapped.
   */
  static getFrameIndex(char) {
    const code = char.charCodeAt(0);
    // Uppercase A-Z (Frames 0..25)
    if (code >= 65 && code <= 90) return code - 65;
    // Lowercase a-z (Frames 26..51)
    if (code >= 97 && code <= 122) return code - 97 + 26;
    // Digits 0-9 (Frames 52..61)
    if (code >= 48 && code <= 57) return code - 48 + 52;
    // Punctuation and symbols
    if (char === '.') return 62;
    if (char === '!') return 63;
    if (char === '?') return 64;
    if (char === '-') return 65;
    if (char === '[') return 66;
    if (char === ']') return 67;
    if (char === ':') return 68;
    if (char === '\'') return 69;
    if (char === '>') return 72;
    if (char === '<') return 73;
    return null;
  }

  /**
   * Renders a text string proportionally using each glyph's exact atlas width.
   * 
   * @param {Phaser.Scene} scene The parent scene instance.
   * @param {number} x Base X coordinate.
   * @param {number} y Base Y coordinate.
   * @param {string} text Text string to render.
   * @param {Object} [options] Formatting and positioning options.
   * @param {number} [options.scale=0.24] Scale multiplier for each letter sprite.
   * @param {number} [options.tint=0xffffff] Tint color hex (e.g. 0x00ff00 for green).
   * @param {string} [options.align="center"] Horizontal alignment ("left", "center", "right").
   * @param {number} [options.letterSpacing=10] Additional gap between adjacent character glyphs (unscaled px).
   * @param {number} [options.depth=100] Rendering depth layer.
   * @param {number} [options.alpha=1] Alpha transparency.
   * @returns {Phaser.GameObjects.Sprite[]} Array of created letter sprite objects.
   */
  static renderText(scene, x, y, text, options = {}) {
    const scale = options.scale !== undefined ? options.scale : 0.24;
    const tint = options.tint !== undefined ? options.tint : 0xffffff;
    const align = options.align || "center";
    const letterSpacing = options.letterSpacing !== undefined ? options.letterSpacing : 10;
    const depth = options.depth !== undefined ? options.depth : 100;
    const alpha = options.alpha !== undefined ? options.alpha : 1;

    const sprites = [];
    const len = text.length;
    if (len === 0) return sprites;

    // Calculate total unscaled width by summing individual glyph widths plus spacing gaps
    let totalUnscaledWidth = 0;
    for (let i = 0; i < len; i++) {
      const char = text[i];
      const width = GLYPH_WIDTHS[char] !== undefined ? GLYPH_WIDTHS[char] : 50;
      totalUnscaledWidth += width;
      if (i < len - 1) {
        totalUnscaledWidth += letterSpacing;
      }
    }

    const totalScaledWidth = totalUnscaledWidth * scale;

    // Calculate initial cursor X position based on alignment
    let cursorX = x;
    if (align === "center") {
      cursorX = x - totalScaledWidth / 2;
    } else if (align === "right") {
      cursorX = x - totalScaledWidth;
    } else {
      cursorX = x; // "left"
    }

    // Render characters proportionally along the cursor path
    for (let i = 0; i < len; i++) {
      const char = text[i];
      const frame = HudFontHelper.getFrameIndex(char);
      const width = GLYPH_WIDTHS[char] !== undefined ? GLYPH_WIDTHS[char] : 50;

      if (frame !== null && frame !== undefined) {
        const sprite = scene.add.sprite(cursorX, y, "hud-font");
        sprite.setFrame(frame);
        sprite.setOrigin(0, 0.5); // Left-aligned origin to match atlas left-aligned glyphs
        sprite.setScale(scale);
        sprite.setDepth(depth);
        sprite.setAlpha(alpha);
        if (tint !== null && tint !== undefined) {
          sprite.setTint(tint);
        }
        sprites.push(sprite);
      }

      // Advance cursor by this glyph's width plus letterSpacing scaled
      cursorX += (width + letterSpacing) * scale;
    }

    return sprites;
  }
}
