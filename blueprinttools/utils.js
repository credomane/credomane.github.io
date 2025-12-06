/**
 * Just a bunch of function to do some basic things I need in multiple places.
 */

/**
 * Takes a number 0-255 and turns it into hex string.
 * @param {number} c 0-255
 * @returns
 */
function componentToHex(c) {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

/**
 *
 * @param {number|array|Object} r 0-255 or [0-255, 0-255, 0-255], or {r=0-255, g=0-255, b=0-255}
 * @param {number?} g 0-255
 * @param {number?} b 0-255
 * @returns
 */
function rgbToHex(r, g, b) {
  if (g == null && b == null) {
    if (r.red !== null) {
      g = r.g;
      b = r.b;
      r = r.r;
    } else {
      g = r[1];
      b = r[2];
      r = r[0];
    }
  }

  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/**
 *
 * @param {*} hex
 * @returns
 */
function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 *
 * @param {*} fadeFraction
 * @param {*} rgbColor1
 * @param {*} rgbColor2
 * @returns
 */
function colorGradient(fadeFraction, rgbColor1, rgbColor2) {
  let color1 = rgbColor1;
  let color2 = rgbColor2;

  let diffR = color2.r - color1.r;
  let diffG = color2.g - color1.g;
  let diffB = color2.b - color1.b;

  let gradient = {
    r: parseInt(Math.floor(color1.r + diffR * fadeFraction), 10),
    g: parseInt(Math.floor(color1.g + diffG * fadeFraction), 10),
    b: parseInt(Math.floor(color1.b + diffB * fadeFraction), 10),
  };

  return gradient;
}

/**
 * Takes a factorio blueprint string and converts it to a JSON Object
 * @param {string} str
 * @returns {jsonObject}
 */
function decodeBlueprint(str) {
  return JSON.parse(pako.inflate(atob(str.substr(1)), { to: "string" }));
}

/**
 * Takes a JSON Object and converts it to a factorio blueprint string.
 * @param {jsonObject} jsonObject
 * @returns {string}
 */
function encodeBlueprint(jsonObject) {
  return "0" + btoa(pako.deflate(JSON.stringify(jsonObject), { to: "string" }));
}

/**
 * Takes the fill percentage of the thrusters and turns that into the efficiency.
 * Fill percentage is fluid in thruster divided by 1000 (does the data stage allow for changing that?)
 * Formula taken from https://www.desmos.com/calculator/b9a3qxddzd
 * @param {number} x Percentage 0-100
 * @returns
 */
function efficiencyFromFill(x) {
  let y = (-0.7 * (x / 100 - 0.1) + 1) * 100;
  if (y < 51) {
    y = 51;
  } else if (y > 100) {
    y = 100;
  }
  return y;
}

/**
 * Takes the thrusters efficiency and turns that into the fill percentage needed.
 * Formula taken from https://www.desmos.com/calculator/b9a3qxddzd
 * @param {number} y Percentage 0-100
 * @returns
 */
function fillFromEfficiency(y) {
  if (y < 51) {
    y = 51;
  } else if (y > 100) {
    y = 100;
  }
  let x = ((y / 100 - 1) / -0.7 + 0.1) * 100;
  return x;
}

/**
 * Takes the fill percentage of the thrusters and turns that into the efficiency.
 * Fill percentage is fluid in thruster divided by 1000 (does the data stage allow for changing that?)
 * Formula taken from https://www.desmos.com/calculator/b9a3qxddzd
 * @param {number} x Percentage 0-100
 * @returns
 */
function usageFromFill(x) {
  let y = (2.71 * (x / 100 - 0.1) + 0.1) * 100;
  if (y < 10) {
    y = 10;
  } else if (y > 200) {
    y = 200;
  }
  return y;
}

/**
 * Takes the thrusters efficiency and turns that into the fill percentage needed.
 * Formula taken from https://www.desmos.com/calculator/b9a3qxddzd
 * @param {number} y Percentage 0-100
 * @returns
 */
function fillFromUsage(y) {
  if (y < 10) {
    y = 10;
  } else if (y > 200) {
    y = 200;
  }
  let x = ((y / 100 - 0.1) / 2.71 + 0.1) * 100;
  return x;
}

/**
 * Takes the fill percentage of the thrusters and turns that into the current thrust %.
 * Fill percentage is fluid in thruster divided by 1000 (does the data stage allow for changing that?)
 * This function mostly accurate to the wiki table! +-1% in a few spots.
 * Formula taken from https://www.desmos.com/calculator/b9a3qxddzd
 * @param {number} x Percentage 0-100
 * @returns
 */
function thrustFromFill(x) {
  y = (efficiencyFromFill(x) * usageFromFill(x) - 150) / 100;
  if (y > 100) {
    y = 100;
  }
  return y;
}

/**
 * Takes the current thrust % that into the fill percentage needed.
 * Formula taken from https://www.desmos.com/calculator/b9a3qxddzd
 * @param {number} y Percentage 0-100
 * @returns
 */
function fillFromThrust(y) {
  //Looping like this seems stupid but I couldn't figure out how to otherwise invert it.
  for (let i = 1; i <= 100; ++i) {
    let x = Math.round(thrustFromFill(i));
    if (x == y) {
      return i;
    }
  }
  return 0;
}
