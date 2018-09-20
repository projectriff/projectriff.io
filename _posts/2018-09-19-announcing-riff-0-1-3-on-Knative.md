---
layout: single
title: "Announcing riff v0.1.3 on Knative"
header:
  overlay_image: /images/cam-bridge.jpg
excerpt:
  With a riff buildpack for java, credential helpers, content-type shortcuts, and subscription commands
permalink: /blog/announcing-riff-0-1-3-on-knative/
---

We are pleased to announce the release of [riff v0.1.3](https://github.com/projectriff/riff/releases/tag/v0.1.3) on Knative. Thank you riff and Knative contributors.

The riff CLI can be downloaded from our [releases page](https://github.com/projectriff/riff/releases/tag/v0.1.3) on GitHub. Please follow one of the [getting started](/docs) guides, to create a new cluster on GKE or minikube. This release includes new manifests for the latest Knative and Istio.

#### uninstall older Knative
```sh
riff system uninstall --istio --force
```

#### install on minikube (for GKE omit `--node-port`)
```sh
riff system install --manifest stable --node-port
```

## credential helpers
Initializing a namespace with your push credentials is easier now. 

#### point to your [GCR key](/docs/getting-started-with-knative-riff-on-gke/#create-a-kubernetes-secret-for-pushing-images-to-gcr)
```sh
riff namespace init default --gcr <path-to-json-file>
```

#### or `export DOCKER_ID=<your-id>` and enter password when prompted
```sh
riff namespace init default --dockerhub $DOCKER_ID
```

## riff buildpack for java
This release supports building java functions from source, either locally or on-cluster. Both variants use a new riff buildpack for java.

All you need in your directory is the java code with a maven pom, and the name of the handler class in a file called `riff.toml`. The example below uses a sample [java-hello](https://github.com/projectriff-samples/java-hello) function available on GitHub.

#### build from code in a directory and push to local docker
```sh
riff function create java hello \
  --local-path . \
  --image dev.local/java-hello:v1
```
Builds using a --local-path run directly on your machine, not inside the Kubernetes cluster. The `dev.local` prefix, sends the image to your local docker daemon.


#### build from code on GitHub and push to DockerHub 
```sh
riff function create java hello \
    --git-repo https://github.com/projectriff-samples/java-hello.git \
    --image $DOCKER_ID/java-hello:v1 \
    --verbose
```
Using `--verbose` shows the progress of the build as it's happening in the cluster. For GCR, replace `$DOCKER_ID` with your `gcr.io/$GCP_PROJECT`. 


## simpler riff service invoke 
For text or json, you can now use `--text` or `--json`. You no longer have to specify the `Content-Type` as a curl header.

#### invoke the hello function with text input
```sh
riff service invoke hello --text -- -w '\n' -d world
```

## riff subscription commands
Subscriptions now have their own separate CLI commands. The corresponding options on `riff function` and `riff service` have been removed.

#### create
```
Usage:
  riff subscription create SUBSCRIPTION_NAME  [flags]

Examples:
  riff subscription create --channel tweets --subscriber tweets-logger
  riff subscription create my-subscription --channel tweets --subscriber tweets-logger
  riff subscription create --channel tweets --subscriber tweets-logger --reply-to logged-tweets

Flags:
  -c, --channel string      the input channel of the subscription
  -h, --help                help for create
  -n, --namespace string    the namespace of the subscription
  -r, --reply-to string     the optional output channel of the subscription
  -s, --subscriber string   the subscriber of the subscription
```

#### delete
```
Usage:
  riff subscription delete SUBSCRIPTION_NAME  [flags]

Examples:
  riff subscription delete my-subscription --namespace joseph-ns

Flags:
  -h, --help               help for delete
  -n, --namespace string   the namespace of the subscription
```

