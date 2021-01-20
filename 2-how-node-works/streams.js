const fs = require('fs');
const server = require('http').createServer();

// getting data from test-file.txt and sent it into the client
server.on('request', (req, res) => {
  // Solution 1 - bad: sending the whole file at once
  //   fs.readFile('test-file.txt', (err, data) => {
  //     if (err) console.log(err);
  //     res.end(data);
  //   });
  //
  // Solution2: Streams
  // Problem: the order of data streams cannot be guranteed in the real situation,
  // due to the network speed - backpressure problem
  // create data streams from test-file.txt
  //   const readable = fs.createReadStream('test-file.txt');
  //   // listening the stream data
  //   readable.on('data', (chunk) => {
  //     res.write(chunk);
  //   });
  //   readable.on('end', () => {
  //     res.end();
  //   });
  //   readable.on('error', (err) => {
  //     console.log(err);
  //     res.statusCode = 500;
  //     res.end('File not found');
  //   });
  //
  // Solution 3
  // Using pipe() to solve backpressure problem
  const readable = fs.createReadStream('test-file.txt');
  // explanation: readableSource.pipe(writeableDest)
  // pipe() will solve the backpressure problem and do res.write() automatically.
  readable.pipe(res);
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Listening...');
});
