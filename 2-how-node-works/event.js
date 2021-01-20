const EventEmitter = require('events');
const http = require('http');

class Sales extends EventEmitter {
  constructor() {
    super();
  }
}

// create an emitter
const myEmitter = new Sales();

myEmitter.on('newSale', () => {
  console.log('There was a new sale!');
});

myEmitter.on('newSale', () => {
  console.log('Customer name: Allen');
});

myEmitter.on('newSale', (stock) => {
  console.log(`There are now ${stock} items left in stock.`);
});

// emit the event, passing parameters
myEmitter.emit('newSale', 9);

/*
 ****************************************
 */
const server = http.createServer();

server.on('request', (req, res) => {
  console.log('Request recieved!');
  console.log(req.url);
  res.end('Request recieved');
});

server.on('request', (req, res) => {
  console.log('Another request recieved');
});

server.on('close', () => {
  console.log('Server closed');
});

// start the server
server.listen(8000, '127.0.0.1', () => {
  console.log('Waiting for requests....');
});
