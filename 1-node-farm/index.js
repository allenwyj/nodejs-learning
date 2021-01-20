// accessing the file system
const fs = require('fs');
const http = require('http');
const url = require('url');
// slugify is to create unique slugs on the URL
const slugify = require('slugify');

const replaceTemplate = require('./modules/replaceTemplate');

/////////////////////////////////
// FILES

// // Blocking, synchronous way
// const textInput = fs.readFileSync('./txt/input.txt', 'utf-8');
// console.log(textInput);

// // writting txt from node
// const textOutput = `This is what we know about the avocado: ${textInput}.\nCreated on ${Date.now()}`;
// fs.writeFileSync('./txt/output.txt', textOutput);
// console.log('File written!');

// // Non-blocking code execution, asynchronous way
// fs.readFile('./txt/start.txt', 'utf-8', (err, data) => {
//   console.log(data);
// });
// console.log('Reading file...');

// fs.writeFile('./txt/output-asyn.txt', textOutput, 'utf-8', err => {
//   if (err) return console.log('Error!');
//   console.log('Success');
// });

/////////////////////////////////
// SERVER
/////////////////////////////////

// reading data from file
const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObj = JSON.parse(data);

const slugs = dataObj.map((el) => slugify(el.productName, { lower: true }));

// putting templates into the memory once the application starts
const tempOverview = fs.readFileSync(
  `${__dirname}/templates/template-overview.html`,
  'utf-8'
);
const tempProductDetail = fs.readFileSync(
  `${__dirname}/templates/template-product.html`,
  'utf-8'
);
const tempCard = fs.readFileSync(
  `${__dirname}/templates/template-card.html`,
  'utf-8'
);

// creating the server
const server = http.createServer((req, res) => {
  // fetching the url and destructuring  object
  const { query, pathname } = url.parse(req.url, true);

  // overview page
  if (pathname === '/' || pathname === '/overview') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });

    // looping and replacing all the matching patterns, then join all elements into a string pattern
    const cardsHtml = dataObj
      .map((el) => replaceTemplate(tempCard, el))
      .join('');
    // replacing the cards placeholder with the actual data
    const output = tempOverview.replace('{%PRODUCT_CARDS%}', cardsHtml);

    res.end(output);

    // product page
  } else if (pathname === '/product') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });
    const product = dataObj[query.id];
    const output = replaceTemplate(tempProductDetail, product);

    res.end(output);

    // API
  } else if (pathname === '/api') {
    // specifying the sending back data is in JSON type.
    res.writeHead(200, {
      'Content-type': 'application/json',
    });
    res.end(data);

    // Not found
  } else {
    // sending a header with the specific status code
    res.writeHead(404, {
      'Content-type': 'text/html',
      'my-own-header': 'hello-world',
    });
    res.end('<h1>Page Not Found!</h1>');
  }
});

// start to listen any incoming request from http://localhost:8000
server.listen(8000, '127.0.0.1', () => {
  // this call-back function will run as soon as the server starts
  console.log('Listening to requests on port 8000');
});
