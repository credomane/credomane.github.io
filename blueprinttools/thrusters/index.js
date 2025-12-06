$(() => {
  $(".js-thrusterNum").on("keyup", () => {
    doUpdate();
  });
  $(".js-thrusterSpeed").on("keyup", () => {
    doUpdate();
  });
  $(".js-pumpNum").on("keyup", () => {
    doUpdate();
  });

  $(".js-pumpSpeed").on("keyup", () => {
    doUpdate();
  });

  $(".js-fillPercent").on("keyup", () => {
    $(".js-efficiency").val(Math.round(efficiencyFromFill(parseInt($(".js-fillPercent").val()))));
    doUpdate();
  });

  $(".js-efficiency").on("keyup", () => {
    $(".js-fillPercent").val(Math.round(fillFromEfficiency(parseInt($(".js-efficiency").val()))));
    doUpdate();
  });

  $(".js-copyBP").on("click", () => {
    navigator.clipboard.writeText($(".js-blueprint").val().trim());
    $(".js-copied").html("Copied!");
    setTimeout(() => {
      $(".js-copied").html("");
    }, 2500);
  });
});

function doUpdate() {
  const thrusterNum = parseInt($(".js-thrusterNum").val());
  const thrusterSpeed = parseInt($(".js-thrusterSpeed").val());
  const pumpNum = parseInt($(".js-pumpNum").val());
  const pumpSpeed = parseInt($(".js-pumpSpeed").val());
  const percent = parseInt($(".js-fillPercent").val());
  const totalThrusterSpeed = thrusterNum * thrusterSpeed;
  const totalPumpSpeed = pumpNum * pumpSpeed;

  //Factorio BP formula for calculating thruster fill reserves for combinator "magic".
  // Keeping a copy here because handy.
  // Resulting value here goes into pump that activates when "T" < result. then a combinator counts ticks resetting when hitting 60.

  //This formula is hitting a desired efficiency target.
  //(thrusterNum * thrusterSpeed * ((percent / 100 - 1) / -0.7 + 0.1)) / (pumpNum * pumpSpeed) * 60

  //This formula is for hitting a desired fill level.
  //(thrusterNum * thrusterSpeed * (percent / 100)) / (pumpNum * pumpSpeed) * 60

  //This formula is for hitting 50% fill level.
  //(thrusterNum * thrusterSpeed * 0.5) / (pumpNum * pumpSpeed) * 60

  //  const thrusterDesired = Math.round((totalThrusterSpeed * 100) / ((10000 / (percent * 100)) * 100));
  const thrusterDesired = totalThrusterSpeed * (percent / 100);
  const onTime = (thrusterDesired / totalPumpSpeed) * 60;
  const onPercent = (thrusterDesired / totalPumpSpeed) * 100;

  $(".js-resThrusterSpeed").html(Math.round(totalThrusterSpeed));
  $(".js-resThrusterDesired").html(Math.round(thrusterDesired));
  $(".js-resFillPercent").html(Math.round(percent * 100) / 100);
  $(".js-resEfficiency").html(Math.round(efficiencyFromFill(percent) * 100) / 100);
  $(".js-resPumpSpeed").html(Math.round(totalPumpSpeed));
  $(".js-resTime").html(Math.round(onTime));
  $(".js-resPercent").html(Math.round(onPercent));
  $(".js-warning").html("");

  if (thrusterDesired > totalPumpSpeed) {
    $(".js-warning").html("YOU NEED MORE PUMP THROUGHPUT!<br>Maximum possible pumping speed is " + totalPumpSpeed + " but need " + thrusterDesired);
  }
  const results = generateDataFor(onTime);
  pdmChart.data.datasets[0].data = results[0];
  pdmChart.data.datasets[1].data = results[1];
  pdmChart.update();
}

function generateDataFor(onTime) {
  let tick = 1; //Tick loops (1 thru N);
  const range = 60;
  let results = [];
  let results2 = [];

  while (tick <= range) {
    let Remainder = (onTime * tick) % range;
    if (Remainder < onTime) {
      results.push("ON");
    } else {
      results.push("OFF");
    }

    if (tick <= onTime) {
      results2.push("ON");
    } else {
      results2.push("OFF");
    }

    tick += 1;
  }

  return [results, results2];
}
