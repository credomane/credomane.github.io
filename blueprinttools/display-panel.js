
function makeProgressBar(maxValue, startColor, endColor) {
  const newBP = JSON.parse(JSON.stringify(bp));
}

function makeGradient(start,end){
    
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
          parameters: [
            {
              condition: {
                first_signal: {
                  type: "virtual",
                  name: "signal-anything",
                },
                constant: 5,
                comparator: ">",
              },
              icon: {
                type: "virtual",
                name: "signal-anything",
              },
              text: "[color=?]█░░░░░░░░░░░░░░░░░░░[/color] 5%",
            },
          ],
        },
      },
    ],
    item: "blueprint",
    version: 562949954994181,
  },
};
