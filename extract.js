const puppeteer = require('puppeteer');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');

const CATEGORY_FILE_NAME = './categoryData.csv';
const TYPE_FILE_NAME = './typeData.csv';

const url = 'https://cloud.google.com/free/docs/aws-azure-gcp-service-comparison';

(async () => {
  /* Initiate the Puppeteer browser */
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  /* Go to the IMDB Movie page and wait for it to load */
  await page.goto(url, { waitUntil: 'networkidle0' });

  const data = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr'));
    let trsArray = [];
    for (const tr of trs) {
      const tds = Array.from(tr.querySelectorAll('td')).map((td) =>
        td.innerText.replace(/,/g, '###'),
      );
      trsArray.push(tds);
    }

    return trsArray;
  });

  /* Outputting what we scraped */
  console.log(data);

  let categoryMap = new Map();
  let typeMap = new Map();

  function sentenceCase(str) {
    if (str === null || str === '') return false;
    else str = str.toString();

    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  for (let i = 0; i < data.length; i++) {
    const tr = data[i].length == 6 ? data[i] : null;
    if (!tr) continue;

    let category = sentenceCase(tr[0]);
    let type = sentenceCase(tr[1]);

    if (!categoryMap.has(category))
      categoryMap.set(category, { Category: category, GCP: '', AWS: '', Azure: '' });

    if (!typeMap.has(type)) typeMap.set(type, { Type: type, GCP: '', AWS: '', Azure: '' });

    const catRow = categoryMap.get(category);
    catRow['GCP'] += tr[2] + '### ';
    catRow['AWS'] += tr[4] + '### ';
    catRow['Azure'] += tr[5] + '### ';

    const typeRow = typeMap.get(type);
    typeRow['GCP'] += tr[2] + '### ';
    typeRow['AWS'] += tr[4] + '### ';
    typeRow['Azure'] += tr[5] + '### ';
  }

  const categoryOutput = Array.from(categoryMap.values()).map((value) => {
    value['GCP'] = value['GCP'].replace(/### *$/, '');
    value['AWS'] = value['AWS'].replace(/### *$/, '');
    value['Azure'] = value['Azure'].replace(/### *$/, '');
    return value;
  });
  const csvCat = new ObjectsToCsv(categoryOutput);
  // await csv.toDisk(CATEGORY_FILE_NAME, { append: true });

  let csvString = await csvCat.toString();
  console.log(csvString);
  //csvString.replaceAll(',', ';').replaceAll(TEMP_COMMA, ',');
  let finalOutput = `sep=;\n ${csvString.replace(/,/g, ';').replace(/###/g, ',')}`;
  fs.writeFileSync(CATEGORY_FILE_NAME, finalOutput);

  /************** */
  const typeOutput = Array.from(typeMap.values()).map((value) => {
    value['GCP'] = value['GCP'].replace(/### *$/, '');
    value['AWS'] = value['AWS'].replace(/### *$/, '');
    value['Azure'] = value['Azure'].replace(/### *$/, '');
    return value;
  });
  const csvType = new ObjectsToCsv(typeOutput);
  // await csv.toDisk(CATEGORY_FILE_NAME, { append: true });

  csvString = await csvType.toString();
  console.log(csvString);
  //csvString.replaceAll(',', ';').replaceAll(TEMP_COMMA, ',');
  finalOutput = `sep=;\n ${csvString.replace(/,/g, ';').replace(/###/g, ',')}`;
  fs.writeFileSync(TYPE_FILE_NAME, finalOutput);

  /*
  console.log(categoryOutput);
  fs.writeFileSync('categoryData.csv', categoryOutput);
  const output = data.map((tr) => tr + '\n');
  fs.writeFileSync('tableData.csv', output);
  */
  await browser.close();
})();
