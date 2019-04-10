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

## Notable changes

### Cloud Native Buildpacks

- update to [pack v0.1.0](https://github.com/buildpack/pack/releases/tag/v0.1.0)
- [builder](https://github.com/projectriff/builder/blob/master/builder.toml) uses separate buildpack per function invoker 
- The Java buildpack includes support for Java 11.  Please add a `compiler.source` to your Maven pom or Gradle config.

  #### Maven
  ```xml
    <properties>
      <maven.compiler.source>1.8</maven.compiler.source>
    </properties>
  ```

  #### Gradle
  ```
  sourceCompatibility = 1.8
  ```

### Knative

- update to [Knative Serving v0.5.0](https://github.com/knative/serving/releases/tag/v0.5.0) and Istio [v1.0.7](https://github.com/knative/serving/pull/3668/files)
- update to [Knative Build v0.5.0](https://github.com/knative/build/releases/tag/v0.5.0)
- update to [Knative Eventing v0.4.0](https://github.com/knative/eventing/releases/tag/v0.4.0)

### riff CLI

- support for Windows
- easy install via [brew](https://formulae.brew.sh/formula/riff) and [chocolatey](https://chocolatey.org/packages/riff/0.3.0)
- `riff system install` and `riff system uninstall` with improved robustness and cleanup
- `riff namespace init`
    - with basic auth for other registries
- `riff namespace cleanup` similar to system uninstall, but for a namespace
- `riff function build` builds an image without creating a service
- `riff function create`
    - `--sub-path` for `--git-repo` builds from a subdirectory
    - `--image` auto-inferred from registry prefix and function name
    - `riff.toml` optional alternative to CLI parameters
- `riff service invoke` with improved error handling
- `riff channel create` will default to using a default channel provisioner

## More modular Buildpacks
This release introduces a new buildpacks structure with a buildpack per language. 
Here is an updated map of the buildpack-related repos on Github.

![](/images/builders2.svg)

[riff Builder](https://github.com/projectriff/builder) is the container for function builds using buildpacks.

#### Java group
- [OpenJDK buildpack](https://github.com/cloudfoundry/openjdk-buildpack): contributes OpenJDK JREs and JDKs
- [Build System buildpack](https://github.com/cloudfoundry/build-system-buildpack): performs Java based builds
- [Java function buildpack](https://github.com/projectriff/java-function-buildpack): contributes [Java invoker](https://github.com/projectriff/java-function-invoker)

#### Node group
- [NodeJS buildpack](https://github.com/cloudfoundry/nodejs-cnb): contributes node.js runtime
- [NPM buildpack](https://github.com/cloudfoundry/npm-cnb): performs npm based builds
- [Node function buildpack](https://github.com/projectriff/node-function-buildpack): contributes the [Node  invoker](https://github.com/projectriff/node-function-invoker) for running JavaScript functions

#### Command group
- [Command function buildpack](https://github.com/projectriff/command-function-buildpack): contributes the [Command invoker](https://github.com/projectriff/command-function-invoker) for running Linux commands.


## Our plans for eventing
 
In pre-Knative riff we had support for streaming messages between Functions mediated by Topics backed by Kafka. With the transition to Knative, we gave up the ability to stream messages from a Channel to a function and were limited to item-at-a-time request-reply semantics.

We still care deeply about the potential of stateful stream processing in a polyglot, FaaS environment.

Fortunately, Knative serving is no longer restricted to http/1.1, which unlocks support for streaming protocols like h2, WebSockets, gRPC and RSocket. We have started working on a PoC that includes the following components:

1. Stream CRD with "name" and "provider" (other properties will be added, e.g. "partitions")
2. Processor CRD with "inputs", "outputs", and "function"
3. Stream Gateway providing a generic API that can be backed by different event-log based messaging systems (such as Kafka or Kinesis); initially exploring [liiklus](https://github.com/bsideup/liiklus)
4. Processor will connect to the Stream Gateway(s) for the input/output Streams and interact with the target Function (with which it's colocated in a Pod) via its Invoker layer using gRPC for bidirectional streaming

NOTE: Existing eventing interfaces are deprecated and will be removed/replaced in riff v0.4.0.

