---
layout: single
title: "Announcing riff v0.3.0"
header:
  overlay_image: /images/frosty-morning.jpg
excerpt:
  With updated Knative components, Windows CLI, and a new Buildpacks design for Functions
permalink: /blog/announcing-riff-0-3-0/
---

We are happy to announce the release of [riff v0.3.0](https://github.com/projectriff/riff/tree/v0.3.x). Thank you all  riff, Buildpacks, and Knative contributors.

The riff CLI can be downloaded from our [releases page](https://github.com/projectriff/riff/releases/tag/v0.3.0) on GitHub. Please follow one of the [getting started](/docs) guides, to create a new cluster on GKE, Minikube, Docker Desktop for Mac, or Docker Desktop for Windows.

Notable changes in this release include:
- update to Buildpacks 0.1, progress towards user defined invokers/buildpacks
- update to Knative Serving and Build on 0.5, Eventing on 0.4
- note: existing eventing interfaces are deprecated and will be removed/replaced in riff v0.4.0
- `--image` is now optional for `riff function create` in most cases
- better riff CLI support for Windows, (we [test](https://github.com/projectriff/riff/blob/master/azure-pipelines.yml) on Windows now)
- `riff namespace cleanup`, similar to system uninstall, but for a namespace
- basic auth for registries via riff cli
- brew and chocolatey packages
- `--sub-path` support for git repos
- `riff function build`, to build an image without creating a service
- `riff.toml` is optional

### Our plans for eventing
 
In pre-Knative riff we had support for streaming messages between Functions mediated by Topics backed by Kafka. With the transition to Knative, we gave up the ability to stream messages from a Channel to a function and were limited to item-at-a-time request-reply semantics.

We still care deeply about the potential of stateful stream processing in a polyglot, FaaS environment.

Fortunately, Knative serving is no longer restricted to http/1.1, which unlocks support for streaming protocols like h2, WebSockets, gRPC and RSocket. We have started working on a PoC that includes the following components:

1. Stream CRD with "name" and "provider" (other properties will be added, e.g. "partitions")
2. Processor CRD with "inputs", "outputs", and "function"
3. Stream Gateway providing a generic API that can be backed by different event-log based messaging systems (such as Kafka or Kinesis); initially exploring [liiklus](https://github.com/bsideup/liiklus)
3. Processor will connect to the Stream Gateway(s) for the input/output Streams and interact with the target Function (with which it's colocated in a Pod) via its Invoker layer using gRPC for bidirectional streaming

### More modular Buildpacks
This release introduces a new buildpacks structure with a buildpack per language. 
Here is an updated map of the buildpack-related repos on Github.

(update image, add links)

![](/images/builders.svg)

- [riff builder](https://github.com/projectriff/riff-buildpack-group) creates the `projectriff/builder` container. 
- [riff buildpack](https://github.com/projectriff/riff-buildpack) contributes invokers for running functions
  - [Node invoker](https://github.com/projectriff/node-function-invoker) runs JavaScript functions 
  - [Java invoker](https://github.com/projectriff/java-function-invoker) runs Java functions
  - [Command invoker](https://github.com/projectriff/command-function-invoker) runs command functions
- [OpenJDK buildpack](https://github.com/cloudfoundry/openjdk-buildpack) contributes OpenJDK JREs and JDKs
- [Build System buildpack](https://github.com/cloudfoundry/build-system-buildpack) performs Java based builds
- [NodeJS buildpack](https://github.com/cloudfoundry/nodejs-cnb) contributes node.js runtime
- [NPM buildpack](https://github.com/cloudfoundry/npm-cnb) performs npm based builds
