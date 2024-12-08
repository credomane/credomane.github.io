function componentToHex(c) {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

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
