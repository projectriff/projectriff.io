---
layout: single
title: "Announcing riff v0.1.2 on Knative"
header:
  overlay_image: /images/liverpool-st.jpg
excerpt:
  With verbose builds and function chaining using Channels and Subscriptions    
permalink: /blog/announcing-riff-0-1-2-on-Knative/
---

[riff v0.1.2](https://github.com/projectriff/riff/releases/tag/v0.1.2) on Knative is now available. Many thanks to all riff and Knative contributors.

## install
We recommend installing riff v0.1.2 on a fresh Kubernetes cluster. The riff CLI can be downloaded from our [releases page](https://github.com/projectriff/riff/releases) on GitHub. Please follow one of the [getting started](/docs) guides,  to create a new cluster on GKE or minikube.

## feedback during builds
There are two new options to provide feedback during builds. In previous releases, `riff function create` would return immediately after creating the build resources, without waiting for the build to succeed or fail.

- `--wait` or `-w` waits until the build status is known.
- `--verbose` or `-v` is the same as wait, but also relays the logs from each build step to the CLI output.

For example if you have not [initialized](/docs/getting-started-with-knative-riff-on-minikube/#initialize-the-namespace) the default namespace, creating a function with `--wait` will produce an error message.

```
riff function create node square \
  --git-repo https://github.com/trisberg/node-fun-square.git \
  --artifact square.js \
  --image $DOCKER_ID/node-fun-square:v1 \
  --wait
```
```
Error: function creation failed: RevisionMissing: Configuration "square" does not have any ready Revision.; Revision creation failed with message: "Internal error occurred: admission webhook \"webhook.build.knative.dev\" denied the request: mutation failed: serviceaccounts \"riff-build\" not found".
```

Or, if the specified artifact does not exist, `--verbose` will help you figure this out.

```
riff function create node square \
  --git-repo https://github.com/trisberg/node-fun-square.git \
  --artifact squarexxx.js \
  --image $DOCKER_ID/node-fun-square \
  --verbose
```
```
...
default/square-00001-c2k97[build-step-build-and-push]: time="2018-08-29T16:34:13Z" level=error msg="lstat /workspace/squarexxx.js: no such file or directory"
Error: function creation failed: RevisionMissing: Configuration "square" does not have any ready Revision.; Revision "square-00001" failed with message: "build step \"build-step-build-and-push\" exited with code 1 (image: \"docker-pullable://gcr.io/kaniko-project/executor@sha256:501056bf52f3a96f151ccbeb028715330d5d5aa6647e7572ce6c6c55f91ab374\"); for logs run: kubectl -n default logs square-00001-c2k97 -c build-step-build-and-push".
```

## function chaining over channels

[Knative/eventing](https://github.com/knative/eventing) now includes support for subscriptions to [send function responses](https://github.com/knative/eventing/pull/325) to another channel. This feature can be used through the riff CLI by specifying the output channel with `--output` or `-o` when creating a subscription.

### 1. create a simple hello function
Start with 2 files in a directory.

#### hello.js  
```js
module.exports = x => {
  var out = 'hello ' + x
  console.log(out)
  return out
}
```

#### Dockerfile  
```dockerfile
FROM projectriff/node-function-invoker:0.0.8
ENV FUNCTION_URI /functions/hello.js
ADD hello.js ${FUNCTION_URI}
```

Now build the function into a container image, and use it create a Knative Service. The `dev.local` prefix tells Knative to use the image from the local docker daemon instead of pulling an image from a remote container registry.
```sh
docker build -t dev.local/hello:v1 .
riff service create hello --image dev.local/hello:v1
```
> To make this work in a hosted environment like GKE, change the names of the images to prefix them with your own registry, and push the images there before calling riff service create.

Using a tool like kail makes it easy to watch the function container log in a separate terminal window.
```sh
kail -d hello-00001-deployment -c user-container
```

When you invoke hello, kail relays the container log.
```sh
riff service invoke hello -- -HContent-Type:text/plain '-w\n' -d hello
```

#### kail output
```
...[user-container]: hello hello
```

### 2. create a square function
Follow the same pattern to create a square function.

#### square.js  
```js
module.exports = x => {
  var out = x**2
  console.log('%s**2 = %s', x, out)
  return out
}
```

#### Dockerfile  
```dockerfile
FROM projectriff/node-function-invoker:0.0.8
ENV FUNCTION_URI /functions/square.js
ADD square.js ${FUNCTION_URI}
```

Build the image and create the function
```sh
docker build -t dev.local/square:v1 .
riff service create square --image dev.local/square:v1
```

Invoking square with a number should return the number squared.
```sh
riff service invoke square -- -HContent-Type:text/plain '-w\n' -d 7
```
```sh
curl...
49
```

### 3. create a function for generating random numbers
This function is a little more complex. To help keep this blog post short, we have published a _random_ function on [dockerhub](https://hub.docker.com/r/jldec/random/tags/). The source can be found on [GitHub](https://github.com/jldec/random).

Create the function using the image from dockerhub.
```sh
riff service create random --image jldec/random:v0.0.1
```

Invoke the function to send posts to square.
```sh
riff service invoke random -- -H 'Content-Type:application/json' -d '{"url":"http://square.default.svc.cluster.local"}'
```

Tailing the log of the square function should show repeated squaring
```sh
kail -d square-00001-deployment -c user-container
```
```
...[user-container]: 638**2 = 407044
...[user-container]: 774**2 = 599076
...[user-container]: 366**2 = 133956
...[user-container]: 944**2 = 891136
...[user-container]: 437**2 = 190969
...
```

### 3. wire everything together

First create 2 channels
```sh
riff channel create numbers --cluster-bus stub
riff channel create squares --cluster-bus stub
```

Then create two subscriptions.
```sh
riff service subscribe square --input numbers --output squares
riff service subscribe hello --input squares
```

Finally configure the random function to post to the `numbers` channel.
```sh
riff service invoke random -- -H 'Content-Type:application/json' -d '{"url":"http://numbers-channel.default.svc.cluster.local"}'
```
```
kail -d random-00001-deployment -c user-container
```
```
...[user-container]: posting to http://numbers-channel.default.svc.cluster.local 1/s
...[user-container]: posted 7 to http://numbers-channel.default.svc.cluster.local 202
...[user-container]: posted 457 to http://numbers-channel.default.svc.cluster.local 202
...[user-container]: posted 541 to http://numbers-channel.default.svc.cluster.local 202
...[user-container]: posted 831 to http://numbers-channel.default.svc.cluster.local 202
...[user-container]: posted 199 to http://numbers-channel.default.svc.cluster.local 202
...[user-container]: posted 806 to http://numbers-channel.default.svc.cluster.local 202
```

Tailing the hello function should show the output of both functions chained together.
```sh
kail -d hello-00001-deployment -c user-container
```
```
...[user-container]: hello 49
...[user-container]: hello 208849
...[user-container]: hello 292681
...[user-container]: hello 690561
...[user-container]: hello 39601
...[user-container]: hello 649636
```
