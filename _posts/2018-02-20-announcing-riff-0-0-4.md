---
layout: single
title: "Announcing riff 0.0.4"
header:
  overlay_image: /images/winter-night.jpg
excerpt:
  With a new go CLI, gRPC, and improved node invoker.
permalink: /blog/announcing-riff-0-0-4/
---

We are happy to announce another new release of riff. Thank you, once again, everyone
who contributed to this effort. Here are some of the highlights.

## a new riff CLI written in go

```sh
$ riff
riff is for functions

version 0.0.4

the riff tool is used to create and manage function resources for the riff FaaS platform https://projectriff.io/

Usage:
  riff [command]

Available Commands:
  apply       Apply function resource definitions
  build       Build a function container
  create      Create a function
  delete      Delete function resources
  help        Help about any command
  init        Initialize a function
  list        List function resources
  logs        Display the logs for a running function
  publish     Publish data to a topic using the http-gateway
  update      Update a function
  version     Display the riff version

Flags:
      --config string   config file (default is $HOME/.riff.yaml)
  -h, --help            help for riff
```

## gRPC under the hood
For this iteration we decided to introduce a gRPC interface between the function sidecar
container and each of the function invokers.

While HTTP works well for invoking functions one event at a time, it was not designed to serve as a protocol for bidirectional streams which don't follow a strict request/reply pattern.

gRPC will allow us to extend streaming semantics, which already exist for Java functions using the reative Flux interface, to functions written in JavaScript and other languages.

Rest assured that we are not changing the existing invoker-function contract for simple (non-streaming) functions. E.g. Javascript functions which were written to use the `http` protocol should keep working just like before.

### gRPC proto
Here is the gRPC function.proto definition which we are using for the 0.0.4 release. Please note that we are still experimenting with this and other streaming protocols. Developers who are experimenting with writing new invokers should expect changes in future. 

```
syntax = "proto3";

package function;

message Message {
	message HeaderValue {
		repeated string values = 1;
	}

	bytes payload = 1;
	map<string, HeaderValue> headers = 2;
}

service MessageFunction {
  rpc Call(stream Message) returns (stream Message) {}
}
```

## go shell invoker
The shell invoker is now a go binary executable, which executes commands directly rather than running them from inside a shell. This allows the shell invoker to connect to the sidecar via gRPC just like other languages. 

NOTE that the new shell invoker new requires a shebang for shell scripts, and uses `stdin` instead of a command line parameter. The echo sample has been modified to use the `cat` utility which simply copies `stdin` to `stdout`. Here is the `echo.sh` script from the sample.

```sh
#!/bin/sh

cat
```

Alternatively, you could specify the `cat` command directly in the Dockerfile - no shell script required!

```docker
FROM projectriff/shell-function-invoker:0.0.4
ENV FUNCTION_URI cat
```

## node invoker
The node invoker just keeps getting better.

For functions which need to manage connections or perform other kinds of one time setup/teardown, the invoker now calls `$init` on startup and `$destroy` before terminating the function. These functions can return promises as well. The node invoker has been fixed to respond promptly to termination signals from Kubernetes.

To help you create functions with npm dependencies, the CLI will now recognize a `package.json` file, and generate a Dockerfile which copies the whole directory into the image and installs dependencies during the build.

E.g. `riff init node --dry-run -a package.json` will produce:

```Dockerfile
FROM projectriff/node-function-invoker:0.0.4
ENV FUNCTION_URI /functions/
COPY . ${FUNCTION_URI}
RUN (cd ${FUNCTION_URI} && npm install --production)
```

Finally, the HTTP gateway will now responds with a 500 status when node functions throw an error.
