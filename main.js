const grpcVersions = {
  '1.9': require('@grpc/grpc-js'),
  '1.8': require('grpc-js-1.8'),
};
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const packageDefinition = protoLoader.loadSync(path.join(__dirname, 'service.proto'));

// milliseconds until deadline for grpc calls
const timeout = 500;
// milliseconds between sending grpc calls
const delay = 100;
// milliseconds before the grpc server is stopped
const stopServerAfter = 250;

const startTime = process.hrtime();

function log(grpcVersion, msg) {
  const hrtime = process.hrtime(startTime);
  const seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
  console.log(`[GRPC ${grpcVersion}|${seconds}] ${msg}`);
}

// a simple echo server using grpc-js 1.9
const server = new grpcVersions['1.9'].Server();
server.addService(grpcVersions['1.9'].loadPackageDefinition(packageDefinition).EchoService.service, {
  echo: (call, callback) => {
    callback(null, {text: call.request.text});
  }
});
server.bindAsync('127.0.0.1:12345', grpcVersions['1.9'].ServerCredentials.createInsecure(), () => {
  server.start();
});

// clients using grpc-js 1.9.2 and 1.8.21
for (const [grpcVersion, grpc] of Object.entries(grpcVersions)) {
  const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
  const client = new protoDescriptor.EchoService(
    '127.0.0.1:12345',
    grpc.credentials.createInsecure(),
    {'grpc.enable_retries': 0}
  );

  let iteration = 0;
  const interval = setInterval(() => {
    const deadline = new Date(Date.now() + timeout);
    client.echo({text: iteration.toString()}, {deadline}, (err, data) => {
      if (err) {
        log(grpcVersion, `RPC call failed: ${err.message}`);
        clearInterval(interval);
      } else {
        log(grpcVersion, `RPC call returned: ${data.text}`);
      }
    });
    log(grpcVersion, `RPC call sent`);
    iteration++;
  }, delay);
  setTimeout(() => {
    server.forceShutdown();
  }, stopServerAfter);
}
