---
layout: single
title: "Announcing riff v0.2.0"
header:
  overlay_image: /images/geese.jpg
excerpt:
  With buildpacks everywhere, smarter detection, and updated Knative support
permalink: /blog/announcing-riff-0-2-0/
---

We are happy to announce the release of [riff v0.2.0](https://github.com/projectriff/riff/releases/tag/v0.2.0). Thank you once again, all riff and Knative contributors.

The riff CLI can be downloaded from our [releases page](https://github.com/projectriff/riff/releases/tag/v0.2.0) on GitHub. Please follow one of the [getting started](/docs) guides, to create a new cluster on GKE or minikube.

### Buildpacks everywhere!
This release extends the use of buildpacks across all of our currently supported invokers: Java, JavaScript, and Command. 

Here is a map of the buildpack-related repos on Github.

![](/images/buildrepos.png)

- [riff builder](https://github.com/projectriff/riff-buildpack-group) creates the **projectriff/builder** container. 
- [riff buildpack](https://github.com/projectriff/riff-buildpack) contributes invokers for running functions
  - [Node invoker](https://github.com/projectriff/node-function-invoker) runs JavaScript functions 
  - [Java invoker](https://github.com/projectriff/java-function-invoker) runs Java functions
  - [Command invoker](https://github.com/projectriff/command-function-invoker) runs command functions
- [OpenJDK buildpack](https://github.com/cloudfoundry/openjdk-buildpack) contributes OpenJDK JREs and JDKs
- [NPM buildpack](https://github.com/cloudfoundry/npm-cnb) contributes npm tooling
- [NodeJS buildpack](https://github.com/cloudfoundry/nodejs-cnb) contributes node.js
- [Build System buildpack](https://github.com/cloudfoundry/build-system-buildpack) contributes Java builds

### `riff function create <name> ...`
 
Since buildpacks can do detection, we have removed the `invoker` parameter on `riff function create`.

* The presence of a `pom.xml` or `build.gradle` file will trigger compilation and building of an image for running a [Java function](https://github.com/projectriff/java-function-invoker).
* A `package.json` file or an `--artifact` flag pointing to a `.js` file will build the image for running a [JavaScript function](https://github.com/projectriff/node-function-invoker).
* An `--artifact` flag pointing to a file with execute permissions will generate an image for running a [Command function](https://github.com/projectriff/command-function-invoker).

To override the detection logic you can still use `--invoker <invokername>`.

For example let's say you have a directory containing just one file:

#### wordcount.js
```sh
#!/bin/bash

tr ' ' '\n' | sort | uniq -c | sort -n
```

Make the file executable.
```sh
chmod u+x wordcount.sh
```

Create a function called `wordcount`, providing the name of the image. E.g. with your DockerHub repo ID.
```sh
riff function create wordcount \
  --local-path . \
  --artifact wordcount.sh \
  --image $DOCKER_ID/wordcount:v1
```

When the function is running:
```sh
riff service invoke wordcount --text -- \
  -d 'yo yo yo version 0.2.0' \
  -w '\w'
```
```
      1 0.2.0
      1 version
      3 yo
```

### Extra!
Try running the following command to invoke your wordcount function on something a little more interesting. 
```sh
curl -s https://www.constitution.org/usdeclar.txt  \
 | riff service invoke wordcount --text -- -d @-
```

### Build from GitHub
For in-cluster builds using a GitHub repo, e.g. in a hosted riff environment, replace the `--local-path .` with `--git-repo <url>`.

```sh
riff function create wordcount \
  --git-repo https://github.com/projectriff-samples/command-wordcount \
  --artifact wordcount.sh \
  --image $DOCKER_ID/wordcount \
  --verbose 
```

### No more dev.local

Note that we have removed support for the special `dev.local` image name prefix for local builds. All image names need to be prefixed with a registry, and you'll need to configure your riff namespace with credentials to push images to that registry. A new `--no-secret` flag has been added to `riff namespace init` if your registry does not require authentication.

For more details please see the help for `riff namespace init -h` or refer to one of the [Getting Started Guides](/docs).