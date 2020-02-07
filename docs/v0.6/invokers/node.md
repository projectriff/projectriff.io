---
id: node
title: Node Function Invoker
sidebar_label: Node.js
---

JavaScript functions are invoked using a [Node Function Invoker](https://github.com/projectriff/node-function-invoker) that is provided by riff when building the function.

The _Node Function Invoker_ provides a host for functions consisting of a single [Node.js](https://nodejs.org/) module. It accepts HTTP requests, invokes the function for each request, and sends the function's output to the HTTP response.

## Authoring a function

At runtime, the node function invoker uses `require()` to load the target function module. This module must export the function to invoke.

```js
// square
module.exports = x => x ** 2;
```

The first argument is the triggering message's payload and the returned value is the resulting message's payload.

### async

Asynchronous work can be completed by defining either an `async function` or by returning a `Promise`.

```js
// async
module.exports = async x => x ** 2;

// promise
module.exports = x => Promise.resolve(x ** 2);
```

### streams (experimental)

Streaming functions can be created by setting the `$interactionModel` property on the function to `node-streams`.
They must set the `$arity` to tell the invoker how many (input and output) streams they require.

> NOTE: the `$arity` setting is temporary and will go away in a future release. 

The function is invoked with two arguments:
 - `inputs`, a dictionary of [Readable Streams](https://nodejs.org/dist/latest-v8.x/docs/api/stream.html#stream_class_stream_readable) 
 - `outputs`, a dictionary of [Writeable Streams](https://nodejs.org/dist/latest-v8.x/docs/api/stream.html#stream_class_stream_writable)

All of these streams are object streams and are currently only indexed by declaration order (`"0"`, `"1"`...).

> NOTE: the streams may also be indexed by name in a future release.  

Any value returned by the function is ignored, new messages must be written to the output stream.

```js
// echo.js
module.exports = (inputs, outputs) => {
  inputs["0"].pipe(outputs["0"]);
};
module.exports.$interactionModel = "node-streams";
module.exports.$arity = 2;
```

Any npm package that works with Node Streams can be used.

```js
// upperCase.js
const miss = require("mississippi");

const upperCaser = miss.through.obj((chunk, enc, cb) => {
  cb(null, chunk.toUpperCase());
});

module.exports = (inputs, outputs) => {
  inputs["0"].pipe(upperCaser).pipe(outputs["0"]);
};
module.exports.$interactionModel = "node-streams";
module.exports.$arity = 2;
```

### messages vs payloads

By default, functions accept and produce payloads. Functions that need to interact with headers can instead opt to receive and/or produce messages. A message is an object that contains both headers and a payload. Message headers are a map with case-insensitive keys and multiple string values.

Since JavaScript and Node have no built-in type for messages or headers, riff uses the [@projectriff/message](https://github.com/projectriff/node-message/) npm module. To use messages, functions should install the `@projectriff/message` package:

```bash
npm install --save @projectriff/message
```

#### receiving messages

```js
const { Message } = require('@projectriff/message');

// a function that accepts a message, which is an instance of Message
module.exports = message => {
    const authorization = message.headers.getValue('Authorization');
    ...
};

// tell the invoker the function wants to receive whole messages
module.exports.$argumentTransformers = [(message) => { return message; }];
```

#### producing messages

```js
const { Message } = require("@projectriff/message");

const instanceId = Math.round(Math.random() * 10000);
let invocationCount = 0;

// a function that produces a Message
module.exports = name => {
  return Message.builder()
    .addHeader("X-Riff-Instance", instanceId)
    .addHeader("X-Riff-Count", invocationCount++)
    .payload(`Hello ${name}!`)
    .build();
};

// the following is the same as the default applied argument transformer
module.exports.$argumentTransformers = [(message) => { return message.payload; }];
```
#### cardinality

In the case of request-reply functions (like the above ones), there must be at most one argument transformer.

In the case of streaming functions, there must be either 0 or as many declared argument transformers as there are input streams. 

### lifecycle

Functions that communicate with external services, like a database, can use the `$init` and `$destroy` lifecycle hooks on the function.
These methods are invoked once per function invoker instance, whereas the target function may be invoked multiple times within a single function invoker instance.

The `$init` method is guaranteed to finish before the main function is invoked.
The `$destroy` method is guaranteed to be invoked after all of the main functions are finished.

```js
let client;

// function
module.exports = async ({ key, amount }) => {
  return await client.incrby(key, amount);
};

// setup
module.exports.$init = async () => {
  const Redis = require("redis-promise");
  client = new Redis();
  await client.connect();
};

// cleanup
module.exports.$destroy = async () => {
  await client.quit();
};
```

The lifecycle methods are optional, and should only be implemented when needed. The hooks may be either traditional or async functions. Lifecycle functions have up to 10 seconds to complete their work, or the function invoker aborts.

## Creating a function

The node runtime is detected when either there is a package.json file in the root, or the artifact is specified as a `.js` file.

### bare modules

To deploy a bare Node.js module, the artifact must be specified.

```sh
riff function create square  --artifact square.js \
  --git-repo https://github.com/projectriff-samples/node-square
```

### packages

Functions may define a [package.json](https://docs.npmjs.com/files/package.json) to specify dependent packages to install as well as the main module.

```js
// hello.js
module.exports = name => `Hello ${name}!`
```

```json
// package.json
{
  ...
  "main": "hello.js",
  ...
}
```

```sh
riff function create hello \
  --git-repo https://github.com/projectriff-samples/node-hello
```

## Deploying the function

Please see the runtime documentation for how to deploy and invoke the function.

- [Core runtime](../runtimes/core.md) -- for request-reply functions only!
- [Knative runtime](../runtimes/knative.md) -- for request-reply functions only!
- [Streaming runtime](../runtimes/streaming.md)

## Cleanup

When done with the function, delete the function resource to stop creating new builds. 

> NOTE: Images built by the function continue to exist in the container registry and may continue to be consumed by a runtime.

```sh
riff function delete square
```

```
Deleted function "square"
```
