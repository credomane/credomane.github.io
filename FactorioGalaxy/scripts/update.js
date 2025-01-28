const cheerio = require("cheerio");
const fs = require("node:fs");

const searchStr = "initSpacemapViewer";

cheerio.fromURL("https://factorio.com/galaxy").then((res) => {
  let html = res("script:contains('" + searchStr + "')")[0].children[0].data;
  const offsetStart = html.indexOf(searchStr + "(") + (searchStr.length + 1);
  const offsetStop = html.indexOf(")});");
  html = JSON.parse(html.substr(offsetStart, offsetStop - offsetStart).trim());
  console.log("Got", html.stars.users.length, "stars.");
  fs.writeFileSync(__dirname + "/../stars.json", JSON.stringify(html));
});
