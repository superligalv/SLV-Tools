const fs = require("fs");

const ligaId = process.env.LIGA_ID || "502760";
const url = `https://gesliga.com/Clasificacion.aspx?Liga=${ligaId}`;

async function run() {
  const res = await fetch(url);
  const html = await res.text();

  const matches = html.match(/<table[\s\S]*?<\/table>/g);

  if (!matches) {
    console.log("No table found");
    return;
  }

  const tableHtml = matches[0];

  const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/g) || [];

  let data = [];

  rows.forEach(r => {
    const cols = r.match(/<t[dh][\s\S]*?<\/t[dh]>/g);
    if (!cols) return;

    const row = cols.map(c =>
      c.replace(/<[^>]*>/g, "").trim()
    );

    data.push(row);
  });

  const output = {
    liga: ligaId,
    updated: new Date().toISOString(),
    data
  };

  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(
    `data/liga-${ligaId}.json`,
    JSON.stringify(output, null, 2)
  );

  console.log("JSON generado");
}

run();
