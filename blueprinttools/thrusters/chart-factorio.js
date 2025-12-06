let factorioChart;
$(() => {
  const ctx = document.getElementById("factorioChart");
  const config = {
    type: "line",
    data: {
      labels: [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
        64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
      ],
      datasets: [
        {
          label: "Fuel Consumption",
          borderColor: "rgba(235, 93, 11, 0.5)",
          backgroundColor: "rgba(235, 93, 11, 0.5)",
          data: [],
          pointStyle: "rectRot",
          pointRadius: 2,
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
        },
        {
          label: "Efficiency",
          borderColor: "rgba(41, 230, 16, 0.5)",
          backgroundColor: "rgba(41, 230, 16,0.5)",
          data: [],
          pointStyle: "rect",
          pointRadius: 2,
          borderWidth: 1,
          cubicInterpolationMode: "monotone",
        },
        {
          label: "Thrust",
          borderColor: "rgba(161, 25, 240, 0.5)",
          backgroundColor: "rgba(161, 25, 240,0.5)",
          data: [],
          borderWidth: 2,
          pointStyle: "circle",
          pointRadius: 2,
          cubicInterpolationMode: "monotone",
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            usePointStyle: true,
          },

          position: "top",
        },
        title: {
          display: true,
          text: "Factorio 2.0 Thruster Graph",
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Fuel Reserve Percentage",
          },
          type: "linear",
          display: true,
          min: 0,
          max: 100,
          ticks: {
            stepSize: 5,
          },
        },
        y: {
          title: {
            display: true,
            text: "%",
          },
          type: "linear",
          display: true,
          position: "left",
          min: 0,
          max: 200,
          ticks: {
            stepSize: 10,
          },
        },
      },
    },
  };
  factorioChart = new Chart(ctx, config);

  for (let i = 0; i <= 100; i++) {
    factorioChart.data.datasets[0].data.push(Math.round(usageFromFill(i)));
    factorioChart.data.datasets[1].data.push(Math.round(efficiencyFromFill(i)));
    factorioChart.data.datasets[2].data.push(Math.round(thrustFromFill(i)));
  }

  factorioChart.update();
});
