const data = {
  percent0: 0,
  percent100: 100,
  resolution: 2,
  barWidth: 20,
  color1: "#B80F0A",
  color2: "#5CE65C",
  percentageShow: true,
  percentageSide: "R",
  percentageColor: false,
};

function updateEverything() {
  data.preview = [];
  data.bp = JSON.parse(JSON.stringify(bp));
  const icon = { name: "parameter-0" };

  const color1 = hexToRgb(data.color1);
  const color2 = hexToRgb(data.color2);

  for (let percent = 0; percent <= 100; percent += data.resolution) {
    let textL = "";
    let textM = "";
    let textR = "";

    if (percent == 99 && data.resolution == 33) {
      //Hack to make the 33% resolution work.
      percent = 100;
    }

    if (data.percentageShow) {
      const percentText = percent + "%";
      if (data.percentageSide === "L") {
        textL += percentText;
      } else {
        textR += percentText;
      }
    }

    textM = makeProgressBar(percent);

    const color = rgbToHex(colorGradient(percent / 100, color1, color2));

    let textPV = "";
    let textBP = "";
    if (data.percentageColor) {
      textPV = "<span style='color:" + color + "'>" + textL + " " + textM + " " + textR + "</span><br>";
      textBP = "[color=#FF" + color.substr(1) + "]" + textL + " " + textM + " " + textR + "[/color]";
    } else {
      textPV = textL + " <span style='color:" + color + "'>" + textM + "</span> " + textR + "<br>";
      textBP = textL + " [color=#FF" + color.substr(1) + "]" + textM + "[/color] " + textR;
    }

    let parameter = makeParameter(icon, getValueFromPercent(percent, data.percent0, data.percent100), textBP);
    let preview = { val: getValueFromPercent(percent, data.percent0, data.percent100), comparator: ">=", text: textPV };
    if (percent == 0) {
      //Generate 0% with different rules so that it is the one the appears anytime the signal is less than 1%.
      let parameter = makeParameter(icon, getValueFromPercent(data.resolution, data.percent0, data.percent100), textBP);
      parameter.condition.comparator = "<=";
      preview = { val: getValueFromPercent(data.resolution, data.percent0, data.percent100), comparator: "<=", text: textPV };
    } else if (percent == 39 && data.resolution == 1) {
      //Apparently Display Panels have a limit of 100 messages. Resolution 1 generates 101 messages and thus exceeds the limit. So skip one.
      continue;
    }

    data.bp.blueprint.entities[0].control_behavior.parameters.unshift(parameter);
    data.preview.push(preview);
  }

  $("#blueprintJSON").val(JSON.stringify(data.bp, null, 2));
  $("#blueprint").val(encodeBlueprint(data.bp));

  let html = "";
  for (let i = 0; i < data.preview.length; ++i) {
    const entry = data.preview[i];
    if (i == 0) {
      html += entry.val + "&nbsp;<=&nbsp;" + entry.text;
    } else {
      html += entry.val + "&nbsp;>=&nbsp;" + entry.text;
    }
  }
  $("#bppreview").html(html);
}

function makeProgressBar(percent) {
  let bar = "";
  for (let i = 0; i < data.barWidth; ++i) {
    if (getPercentFromValue(i, 0, data.barWidth) < percent) {
      bar += "█";
    } else {
      bar += "░";
    }
  }

  return bar;
}

function makeParameter(icon, value, text) {
  return {
    condition: {
      first_signal: icon,
      constant: value,
      comparator: ">=",
    },
    icon: icon,
    text: text,
  };
}

function getPercentFromValue(val, low, high) {
  let newHigh = high - low;
  let newVal = val - low;

  return Math.floor((newVal / newHigh) * 100);
}

function getValueFromPercent(percent, low, high) {
  percent = percent / 100;
  return Math.floor(percent * (high - low) + low);
}

function decodeBlueprint(str) {
  return JSON.parse(pako.inflate(atob(str.substr(1)), { to: "string" }));
}

function encodeBlueprint(jsonObject) {
  return "0" + btoa(pako.deflate(JSON.stringify(jsonObject), { to: "string" }));
}

const bp = {
  blueprint: {
    icons: [
      {
        signal: {
          name: "display-panel",
        },
        index: 1,
      },
      {
        signal: {
          type: "item",
          name: "parameter-0",
        },
        index: 2,
      },
    ],
    entities: [
      {
        entity_number: 1,
        name: "display-panel",
        position: {
          x: 10.5,
          y: 52.5,
        },
        control_behavior: {
          parameters: [],
        },
        text: "Warning: Circuit network wire found.",
        icon: {
          name: "parameter-0",
        },
        always_show: true,
      },
    ],
    parameters: [
      {
        type: "id",
        name: "The signal to watch the value of",
        id: "parameter-0",
      },
    ],
    item: "blueprint",
    version: 562949954994181,
  },
};
