const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Iniciando navegador Puppeteer para saltar el anti-bot de InfinityFree...');
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Usamos un User-Agent realista de Chrome
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  // URL exacta de la API REST de WordPress
  const url = 'https://tiempodesuperliga.rf.gd/wp-json/wp/v2/posts?per_page=5&_fields=id,date,title,link';
  
  console.log('📡 Navegando a la API y resolviendo el reto /aes.js...');
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Extraemos el contenido devuelto por la página (ya con la cookie __test aplicada)
  const content = await page.evaluate(() => document.body.innerText);

  try {
    // Validamos que sea un JSON correcto antes de guardarlo
    const json = JSON.parse(content);
    fs.writeFileSync('noticias.json', JSON.stringify(json, null, 2));
    console.log('✅ ¡Éxito! noticias.json actualizado correctamente.');
  } catch (err) {
    console.error('❌ El contenido obtenido no es un JSON válido:', content);
    process.exit(1);
  }

  await browser.close();
})();
