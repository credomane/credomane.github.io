$(() => {
  $("#datapercent0")
    .val(data.percent0)
    .on("change", (event) => {
      data.percent0 = parseInt(event.currentTarget.value);
      updateEverything();
    });
  $("#datapercent100")
    .val(data.percent100)
    .on("change", (event) => {
      data.percent100 = parseInt(event.currentTarget.value);
      updateEverything();
    });
  $("#dataresolution")
    .val(data.resolution)
    .on("change", (event) => {
      data.resolution = parseInt(event.currentTarget.value);
      updateEverything();
    });
  $("#databarwidth")
    .val(data.barWidth)
    .on("change", (event) => {
      data.barWidth = parseInt(event.currentTarget.value);
      updateEverything();
    });
  $("#datacolor1")
    .val(data.color1)
    .on("change", (event) => {
      data.color1 = event.currentTarget.value;
      updateEverything();
    });
  $("#datacolor2")
    .val(data.color2)
    .on("change", (event) => {
      data.color2 = event.currentTarget.value;
      updateEverything();
    });

  $("#datasignalname")
    .val(data.signalName)
    .on("change", (event) => {
      data.signalName = event.currentTarget.value;
      updateEverything();
    });
  $("#datasignaltype")
    .val(data.signalType)
    .on("change", (event) => {
      data.signalType = event.currentTarget.checked;
      updateEverything();
    });
  $("#datasignalshow")
    .prop("checked", data.signalshow)
    .on("change", (event) => {
      data.signalshow = event.currentTarget.checked;
      updateEverything();
    });
  $("#datasignalside")
    .val(data.signalside)
    .on("change", (event) => {
      data.signalside = event.currentTarget.value;
      updateEverything();
    });

  $("#datapercentageshow")
    .prop("checked", data.percentageShow)
    .on("change", (event) => {
      data.percentageShow = event.currentTarget.checked;
      updateEverything();
    });
  $("#datapercentageside")
    .prop("checked", data.percentageSide)
    .on("change", (event) => {
      data.percentageSide = event.currentTarget.value;
      updateEverything();
    });
  $("#datapercentagecolor")
    .prop("checked", data.percentageColor)
    .on("change", (event) => {
      data.percentageColor = event.currentTarget.checked;
      updateEverything();
    });

  updateEverything();
});

const data = {
  percent0: 0,
  percent100: 100,
  resolution: 1,
  barWidth: 20,
  color1: "#B80F0A",
  color2: "#5CE65C",
  signalType: "item",
  signalName: "iron-plate",
  signalShow: true,
  signalSide: "L",
  percentageShow: true,
  percentageSide: "R",
  percentageColor: true,
};

function updateEverything() {
  data.preview = [];
  data.bp = JSON.parse(JSON.stringify(bp));
  const icon = makeIcon(data.signalType, data.signalName);
  bp.icons[1].signal = icon;

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

    if (data.signalShow) {
      const signalText = "[" + data.signalType + "=" + data.signalName + "]";
      if (data.signalSide === "L") {
        textL += signalText;
      } else {
        textR += signalText;
      }
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
      textBP = "[color=" + color + "]" + textL + " " + textM + " " + textR + "[/color]";
    } else {
      textPV = textL + " <div style='color:" + color + "'>" + textM + "[/color] " + textR;
      textBP = textL + " [color=" + color + "]" + textM + "</div> " + textR;
    }

    data.preview.push({ val: getValueFromPercent(percent, data.percent0, data.percent100), text: textPV });
    data.bp.entities[0].control_behavior.parameters.unshift(makeParameter(icon, getValueFromPercent(percent, data.percent0, data.percent100), textBP));
  }

  //$("#blueprint").val(JSON.stringify(data.bp, null, 2));
  $("#blueprint").val(encodeBlueprint(data.bp));

  let html = "";
  for (let i = 0; i < data.preview.length; ++i) {
    const entry = data.preview[i];
    html += entry.val + "&nbsp;==&nbsp;" + entry.text;
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

function makeIcon(signalType, signalName) {
  let icon = {};
  if (signalType !== "item") {
    icon.type = signalType;
  }
  icon.name = signalName;

  return icon;
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
  var encoded = atob(str.substring(1));
  var decoded = pako.inflate(encoded);
  var string = new TextDecoder("utf-8").decode(decoded);
  var jsonObject = JSON.parse(string);
  var jsonString = JSON.stringify(jsonObject, null, 4);
  return jsonObject;
}

function encodeBlueprint(jsonObject) {
  let jsonString = JSON.stringify(jsonObject);
  let decoded = pako.deflate(jsonString);
  let str = btoa(decoded);
  return str;
}

const bp = {
  icons: [
    {
      signal: {
        name: "display-panel",
      },
      index: 1,
    },
    {
      signal: {
        type: "virtual",
        name: "signal-anything",
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
    },
  ],
  item: "blueprint",
  version: 562949954994181,
};
