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
    $(".js-efficiency").val(effFromFill(parseInt($(".js-fillPercent").val())));
    doUpdate();
  });
  $(".js-efficiency").on("keyup", () => {
    $(".js-fillPercent").val(fillFromEff(parseInt($(".js-efficiency").val())));
    doUpdate();
  });
});

function doUpdate() {
  const thrusterNum = parseInt($(".js-thrusterNum").val());
  const thrusterSpeed = parseInt($(".js-thrusterSpeed").val());
  const pumpNum = parseInt($(".js-pumpNum").val());
  const pumpSpeed = parseInt($(".js-pumpSpeed").val());
  const percent = parseInt($(".js-fillPercent").val());
  const efficiency = parseInt($(".js-efficiency").val());
  const totalThrusterSpeed = thrusterNum * thrusterSpeed;
  const totalPumpSpeed = pumpNum * pumpSpeed;

  const thrusterDesired = Math.round((totalThrusterSpeed * 100) / Math.round((10000 / (percent * 100)) * 100));
  const onTime = Math.round((thrusterDesired / totalPumpSpeed) * 60);
  const onPercent = Math.round((thrusterDesired / totalPumpSpeed) * 100);

  $(".js-resThrusterSpeed").html(totalThrusterSpeed);
  $(".js-resThrusterDesired").html(thrusterDesired);
  $(".js-resFillPercent").html(percent);
  $(".js-resEfficiency").html(effFromFill(percent));
  $(".js-resPumpSpeed").html(totalPumpSpeed);
  $(".js-resTime").html(onTime);
  $(".js-resPercent").html(onPercent);
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
      results.push(1);
    } else {
      results.push(-1);
    }

    if (tick <= onTime) {
      results2.push(1);
    } else {
      results2.push(-1);
    }

    tick += 1;
  }

  return [results, results2];
}
