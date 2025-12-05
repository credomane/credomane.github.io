let pdmChart;
$(() => {
  const ctx = document.getElementById("pdmChart");
  const config = {
    type: "line",
    data: {
      labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
      datasets: [
        {
          label: "PDM",
          borderColor: "rgba(255, 99, 132,0.5)",
          backgroundColor: "rgba(255, 99, 132,0.5)",
          data: [],
          borderWidth: 1,
          pointStyle: "circle",
          pointRadius: 2,
          cubicInterpolationMode: "monotone",
        },
        {
          label: "Simple",
          borderColor: "rgba(50, 98, 255, 0.5)",
          backgroundColor: "rgba(50, 99, 255,0.5)",
          data: [],
          pointStyle: "rect",
          pointRadius: 5,
          borderWidth: 1,
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
          text: "Visual of Pump Duty Cycle",
        },
      },
      scales: {
        y: {
          type: "linear",
          display: true,
          position: "left",
          min: -2,
          max: 2,
          ticks: {
            stepSize: 1,
          },
        },
      },
    },
  };
  pdmChart = new Chart(ctx, config);
  doUpdate();
});
