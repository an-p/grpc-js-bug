This repository demonstrates a possible bug
in [grpc-js](https://github.com/grpc/grpc-node/tree/master/packages/grpc-js) >= 1.9.0.

With grpc-js@1.8.21 and before, RPC calls fail immediately with `14 UNAVAILABLE` after the connection to the server is
lost, which
seems to be in line with [gRFC A62](https://github.com/grpc/proposal/blob/master/A62-pick-first.md):

> During the backoff period, wait_for_ready RPCs are queued while other RPCs fail.

However, since grpc-js@1.9.0, which implements gRFC A62, RPC calls only fail after exceeding the deadline, despite
`waitForReady` being set to false (the default). It looks like the subchannel never enters the TRANSIENT_FAILURE state
in the first place.

## How to run

```
npm install
node main.js
```

## Example Output

### grpc-js 1.8.21

```
[GRPC 1.8|0.112] RPC call sent
[GRPC 1.8|0.138] RPC call returned: 0
[GRPC 1.8|0.215] RPC call sent       
[GRPC 1.8|0.217] RPC call returned: 1
[GRPC 1.8|0.322] RPC call sent
[GRPC 1.8|0.324] RPC call failed: 14 UNAVAILABLE: No connection established
```

### grpc-js 1.9.2

```
[GRPC 1.9|0.109] RPC call sent
[GRPC 1.9|0.140] RPC call returned: 0
[GRPC 1.9|0.214] RPC call sent
[GRPC 1.9|0.218] RPC call returned: 1
[GRPC 1.9|0.322] RPC call sent
[GRPC 1.9|0.429] RPC call sent
[GRPC 1.9|0.537] RPC call sent
[GRPC 1.9|0.645] RPC call sent
[GRPC 1.9|0.753] RPC call sent
[GRPC 1.9|0.830] RPC call failed: 4 DEADLINE_EXCEEDED: Deadline exceeded
[GRPC 1.9|0.937] RPC call failed: 4 DEADLINE_EXCEEDED: Deadline exceeded
[GRPC 1.9|1.045] RPC call failed: 4 DEADLINE_EXCEEDED: Deadline exceeded
[GRPC 1.9|1.153] RPC call failed: 4 DEADLINE_EXCEEDED: Deadline exceeded
[GRPC 1.9|1.260] RPC call failed: 4 DEADLINE_EXCEEDED: Deadline exceeded
```
