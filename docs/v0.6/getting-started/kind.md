---
id: kind
title: Getting started on kind
sidebar_label: kind
---

The following will help you get started running a riff function with Knative on [kind](https://kind.sigs.k8s.io/), a tool for running local Kubernetes clusters using Docker container “nodes”.

To get started with streaming or with the core runtime, follow these steps first, and then continue with the [Streaming](../runtimes/streaming) or [Core](../runtimes/core) runtime docs. Runtimes can be used separately or together.

### Prerequisites

These instructions assume that you are running recent versions of [docker](https://docs.docker.com/install/) and [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/).

### Install

Install kind using one of the methods in the [kind Quick Start](https://kind.sigs.k8s.io/docs/user/quick-start) docs.

### Resize the VM

If you are running Docker on macOS or Windows, use the Preferences feature in the Docker menu to open Advanced settings and configure your VM with at least 5GB of memory and 4 CPUs. Click on Apply & Restart.

### kind-config.yaml

Create a `kind-config.yaml` file for your kind cluster with extra port mappings as described in the [kind Ingress](https://kind.sigs.k8s.io/docs/user/ingress/#create-cluster) docs.

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
        authorization-mode: "AlwaysAllow"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
```

### Create a cluster

Use the `kind-config.yaml` to create a cluster. This will download the required images, run the components, and set your kubectl context to `kind-kind`.

```sh
kind create cluster --config=kind-config.yaml
```
```
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.17.0) 🖼 
 ✓ Preparing nodes 📦  
 ✓ Writing configuration 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
Set kubectl context to "kind-kind"
```

### Monitor your cluster

At this point it is useful to monitor your cluster using a utility like `watch`. To install on a Mac

```sh
brew install watch
```

Watch pods in a separate terminal, and make sure all the services are running.

```sh
watch -n 1 kubectl get pod --all-namespaces
```
```
NAMESPACE            NAME                                         READY   STATUS    RESTARTS   AGE
kube-system          coredns-6955765f44-8gprj                     1/1     Running   0          75s
kube-system          coredns-6955765f44-mmddv                     1/1     Running   0          75s
kube-system          etcd-kind-control-plane                      1/1     Running   0          90s
kube-system          kindnet-4wjrg                                1/1     Running   0          75s
kube-system          kube-apiserver-kind-control-plane            1/1     Running   0          90s
kube-system          kube-controller-manager-kind-control-plane   1/1     Running   0          90s
kube-system          kube-proxy-ltb8c                             1/1     Running   0          75s
kube-system          kube-scheduler-kind-control-plane            1/1     Running   0          90s
local-path-storage   local-path-provisioner-7745554f7f-hmpx4      1/1     Running   0          75s
```

## Install kapp

[kapp](https://get-kapp.io/) is a simple deployment tool for Kubernetes. The riff runtime and its dependencies are provided as standard Kubernetes yaml files, that can be installed with kapp.

You install kapp using Homebrew on MacOS:

```sh
brew tap k14s/tap
brew install kapp
```

Alternatively, Download a recent binary for your platform from [github](https://github.com/k14s/kapp/releases).
Move it into a directory on your path, and make it executable.
Complete kapp installation instructions can be found [here](https://k14s.io/#install-from-github-release)

Validate the installation.

```sh
kapp version
```

```
Client Version: 0.24.0

Succeeded
```

## Install ytt

[ytt](https://get-ytt.io/) is a tool for templating yaml. It can be used to apply changes to the distributed Kubernetes yamls files used to install riff.

You install ytt using Homebrew on MacOS:

```sh
brew tap k14s/tap
brew install ytt
```

Alternatively, Download a recent binary for your platform from [github](https://github.com/k14s/ytt/releases).
Move it into a directory on your path, and make it executable.
Complete ytt installation instructions can be found [here](https://k14s.io/#install-from-github-release)

Validate the installation.

```sh
ytt version
```

```
Version: 0.27.1
```

## Install a snapshot build of the riff CLI

Recent snapshot builds of the riff CLI for [macOS](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.6.0-snapshot/riff-darwin-amd64.tgz), [Windows](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.6.0-snapshot/riff-windows-amd64.zip), or [Linux](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.6.0-snapshot/riff-linux-amd64.tgz), can be downloaded from GCS.

Alternatively, clone the [riff CLI repo](https://github.com/projectriff/cli/), and run `make build install`. This will require a recent [go build environment](https://golang.org/doc/install#install). On macOS you can use `brew install go`.

Check that the riff CLI version is 0.6.0-snapshot.

```sh
riff --version
```

```
riff version 0.6.0-snapshot (9e28d51979dcff085ea6e219de5933ff5f0fc93c)
```

## Install riff Using kapp

riff can be installed with optional runtimes. The riff build system is always installed, and is required by each runtime.

> NOTE: If you have riff v0.4.0 installed then you must first uninstall that version. See [instructions](../../v0.4/getting-started/docker-for-mac.md#uninstalling) in the v0.4.0 documentation.

Create a namespace for kapp to store configuration:

```sh
kubectl create ns apps
```

### install riff Build

To install riff build and it's dependencies:

```sh
kapp deploy -n apps -a cert-manager -f https://storage.googleapis.com/projectriff/release/0.6.0-snapshot/cert-manager.yaml
```

```sh
kapp deploy -n apps -a kpack -f https://storage.googleapis.com/projectriff/release/0.6.0-snapshot/kpack.yaml
```

```sh
kapp deploy -n apps -a riff-builders -f https://storage.googleapis.com/projectriff/release/0.6.0-snapshot/riff-builders.yaml
```

```sh
kapp deploy -n apps -a riff-build -f https://storage.googleapis.com/projectriff/release/0.6.0-snapshot/riff-build.yaml
```

### install Contour ingress controller

The Contour ingress controller can be used by both Knative and Core runtimes.

`ytt` is used to convert the ingress service to NodePort because kind does not support `LoadBalancer` services. An additional change to the configuration enables on `hostPort` networking for the `envoy` DaemonSet in the `contour-external` namespace.

Create a file called `contour-hostport.yaml` with the following content:

```yaml
#@ load("@ytt:overlay", "overlay")
#@overlay/match by=overlay.subset({"metadata":{"name":"envoy", "namespace": "contour-external"}})
---
spec:
  template:
    spec:
      containers:
      #@overlay/match by=overlay.subset({"name":"envoy"})
      - ports:
        #@overlay/match by=overlay.subset({"name":"http"})
        -
          #@overlay/match missing_ok=True
          hostPort: 80
        #@overlay/match by=overlay.subset({"name":"https"})
        -
          #@overlay/match missing_ok=True
          hostPort: 443
```

Run `ytt` to apply the 2 overlays (one is downloaded, one uses `contour-hostport.yaml`) and pipe the output to deploy Contour using `kapp`.

```sh
ytt -f https://storage.googleapis.com/projectriff/release/0.6.0-snapshot/contour.yaml \
  --file-mark contour.yaml:type=yaml-plain \
  -f https://storage.googleapis.com/projectriff/charts/overlays/service-nodeport.yaml \
  -f contour-hostport.yaml \
  | kapp deploy -n apps -a contour -f - -y
```

### install riff Knative Runtime

To install riff Knative Runtime and it's dependencies:

```sh
kapp deploy -n apps -a knative -f https://storage.googleapis.com/projectriff/release/0.6.0-snapshot/knative.yaml
```

```sh
kapp deploy -n apps -a riff-knative-runtime -f https://storage.googleapis.com/projectriff/release/0.6.0-snapshot/riff-knative-runtime.yaml
```

### verify riff installation

Resources may be missing if the corresponding runtime was not installed.

```sh
riff doctor
```

```
NAMESPACE     STATUS
default       ok
riff-system   ok

RESOURCE                                    NAMESPACE     NAME       READ      WRITE
configmaps                                  riff-system   builders   allowed   n/a
configmaps                                  default       *          allowed   allowed
secrets                                     default       *          allowed   allowed
pods                                        default       *          allowed   n/a
pods/log                                    default       *          allowed   n/a
applications.build.projectriff.io           default       *          allowed   allowed
containers.build.projectriff.io             default       *          allowed   allowed
functions.build.projectriff.io              default       *          allowed   allowed
deployers.core.projectriff.io               default       *          allowed   allowed
processors.streaming.projectriff.io         default       *          missing   missing
streams.streaming.projectriff.io            default       *          missing   missing
inmemorygateways.streaming.projectriff.io   default       *          missing   missing
kafkagateways.streaming.projectriff.io      default       *          missing   missing
pulsargateways.streaming.projectriff.io     default       *          missing   missing
adapters.knative.projectriff.io             default       *          allowed   allowed
deployers.knative.projectriff.io            default       *          allowed   allowed
```

### apply build credentials

Use the riff CLI to apply credentials for a container registry. If you plan on using a namespace other than `default` add the `--namespace` flag. Replace the ??? with your docker username.

```sh
DOCKER_ID=???
```

```sh
riff credential apply my-creds --docker-hub $DOCKER_ID --set-default-image-prefix
```

You will be prompted to provide the password.

## Create a function

This step will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to your Docker Hub repo.

```sh
riff function create square \
  --git-repo https://github.com/projectriff-samples/node-square  \
  --artifact square.js \
  --tail
```

After the function is created, you can see the built image by listing functions.

```sh
riff function list
```

```
NAME     LATEST IMAGE                                                                                                ARTIFACT    HANDLER   INVOKER   STATUS   AGE
square   index.docker.io/$DOCKER_ID/square@sha256:ac089ca183368aa831597f94a2dbb462a157ccf7bbe0f3868294e15a24308f68   square.js   <empty>   <empty>   Ready    1m13s
```

## Create a Knative deployer

The [Knative Runtime](../runtimes/knative.md) is only available on clusters with Knative installed. Knative deployers run riff workloads using Knative resources which provide auto-scaling (including scale-to-zero) based on HTTP request traffic, and routing.

```sh
riff knative deployer create knative-square --function-ref square --ingress-policy External --tail
```

After the deployer is created, you can see the hostname by listing deployers.

```sh
riff knative deployer list
```

```
NAME             TYPE       REF      HOST                                 STATUS   AGE
knative-square   function   square   knative-square.default.example.com   Ready    28s
```

### invoke the function

Knative uses HTTP routes via the ingress controller. Requests are routed by hostname.
The ingress gateway should be running on localhost port 80. Invoke the function passing the hostname and content-type as headers.

```sh
curl http://localhost/ -w '\n' \
  -H 'Host: knative-square.default.example.com' \
  -H 'Content-Type: application/json' \
  -d 7
```

```
49
```

## Delete the function and deployer

```sh
riff knative deployer delete knative-square
riff function delete square
```

## Uninstalling riff

You can use the following commands to uninstall riff. Alternatively you can delete the whole cluster with `kind delete cluster`.

### remove any riff resources

```sh
kubectl delete riff --all-namespaces --all
```

### remove riff Streaming Runtime

```sh
kapp delete -n apps -a riff-streaming-runtime
```

```sh
kapp delete -n apps -a keda
```

### remove riff Core Runtime (if installed)

```sh
kapp delete -n apps -a riff-core-runtime
```

### remove riff Knative Runtime (if installed)

```sh
kubectl delete knative --all-namespaces --all
```

```sh
kapp delete -n apps -a riff-knative-runtime
```

```sh
kapp delete -n apps -a knative
```

### remove Contour

```sh
kapp delete -n apps -a contour
```

### remove riff Build

```sh
kapp delete -n apps -a riff-build
```

```sh
kapp delete -n apps -a riff-builders
```

```sh
kapp delete -n apps -a kpack
```

```sh
kapp delete -n apps -a cert-manager
```
