---
id: minikube
title: Getting started on Minikube
sidebar_label: Minikube
---

The following will help you get started running a riff function on Minikube.

## Install Minikube

v0.5 of riff requires Kubernetes v1.15 or later.

[Minikube](https://kubernetes.io/docs/tutorials/hello-minikube/) is a Kubernetes environment which runs in a single virtual machine. See the [Getting Started](https://minikube.sigs.k8s.io/docs/start/) page for installation information.

Minikube uses a hypervisor driver that varies by operating system. Some drivers are provided with Minikube while others requires an extra installation step. See the [Driver](https://minikube.sigs.k8s.io/docs/reference/drivers/) page for details.

For macOS we recommend using Hyperkit as the vm-driver and for Linux we suggest using the KVM (kvm2) driver. You can select what driver to use as default using the `minikube config set vm-driver` command. Newer versions of Minikube seem to default to usig the `hyperkit` driver for MacOS and it is provided with Minikube, so no extra install needed. The `kvm2` driver for Linux does require an extra install step.

## Install Docker

Installing [Docker Community Edition](https://store.docker.com/search?type=edition&offering=community) is the easiest way get started with Docker. Since Minikube includes its own Docker daemon, you actually only need the `docker` CLI to run `docker login` for `--local-path` function builds. This means that if you want to, you can shut down the Docker Desktop app and depend on the Minikube Docker daemon by running `eval $(minikube docker-env)`.

## Install kubectl

[kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. It is used to manage minikube as well as hosted Kubernetes clusters.

## Create a Minikube cluster

```sh
minikube config set memory 5192
minikube config set cpus 4

minikube start
```

Confirm that your kubectl context is pointing to the new cluster:

```sh
kubectl config current-context
```

### monitor your cluster

At this point it is useful to monitor your cluster using a utility like `watch`. To install on a Mac:

```sh
brew install watch
```

Watch pods in a separate terminal.

```sh
watch -n 1 kubectl get pod --all-namespaces
```

## Install kapp

[kapp](https://get-kapp.io/) is a simple deployment tool for Kubernetes. The riff runtime and its dependencies are provided as standard Kubernetes yaml files, that can be installed with kapp.

You can install kapp using Homebrew on MacOS:

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
Client Version: 0.18.0

Succeeded
```

## Install ytt

[ytt](https://get-ytt.io/) is a tool for templating yaml. It can be used to apply changes to the distributed Kubernetes yamls files used to install riff.

You can install ytt using Homebrew on MacOS:

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
Version: 0.23.0
```

## Install the riff CLI

Recent snapshot builds of the riff CLI for [macOS](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.5.0/riff-darwin-amd64.tgz), [Windows](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.5.0/riff-windows-amd64.zip), or [Linux](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.5.0/riff-linux-amd64.tgz), can be downloaded from GCS.

Alternatively, clone the [riff CLI repo](https://github.com/projectriff/cli/), and run `make build install`. This will require a recent [go build environment](https://golang.org/doc/install#install). On macOS you can use `brew install go`.

Check that the riff CLI version is 0.5.0.

```sh
riff --version
```

```
riff version 0.5.0 (f96cf2f5ca6fddfaf4716c0045f5f142da2d3828)
```

## Install riff Using kapp

riff can be installed with optional runtimes. The riff build system is always installed, and is required by each runtime.

> NOTE: If you have riff v0.4.0 installed then you must first uninstall that version. See [instructions](../../v0.4/getting-started/minikube.md#uninstalling) in the v0.4.0 documentation.

Create a namespace for kapp to store configuration:

```
kubectl create ns apps
```

### install riff Build

To install riff build and it's dependencies:

```sh
kapp deploy -n apps -a cert-manager -f https://storage.googleapis.com/projectriff/release/0.5.0/cert-manager.yaml
```

```sh
kapp deploy -n apps -a kpack -f https://storage.googleapis.com/projectriff/release/0.5.0/kpack.yaml
```

```sh
kapp deploy -n apps -a riff-builders -f https://storage.googleapis.com/projectriff/release/0.5.0/riff-builders.yaml
```

```sh
kapp deploy -n apps -a riff-build -f https://storage.googleapis.com/projectriff/release/0.5.0/riff-build.yaml
```

### install Contour ingress controller

The Contour ingress controller can be used by both Knative and Core runtimes.

```sh
# ytt is used to convert the ingress service to NodePort because Minikube does not support `LoadBalancer` services.
ytt -f https://storage.googleapis.com/projectriff/release/0.5.0/contour.yaml -f https://storage.googleapis.com/projectriff/charts/overlays/service-nodeport.yaml --file-mark contour.yaml:type=yaml-plain | kapp deploy -n apps -a contour -f - -y
```

### install riff Knative Runtime

To optionally install riff Knative Runtime and it's dependencies:

```sh
kapp deploy -n apps -a knative -f https://storage.googleapis.com/projectriff/release/0.5.0/knative.yaml
```

```sh
kapp deploy -n apps -a riff-knative-runtime -f https://storage.googleapis.com/projectriff/release/0.5.0/riff-knative-runtime.yaml
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

RESOURCE                                     NAMESPACE     NAME       READ      WRITE
configmaps                                   riff-system   builders   allowed   n/a
configmaps                                   default       *          allowed   allowed
secrets                                      default       *          allowed   allowed
pods                                         default       *          allowed   n/a
pods/log                                     default       *          allowed   n/a
applications.build.projectriff.io            default       *          allowed   allowed
containers.build.projectriff.io              default       *          allowed   allowed
functions.build.projectriff.io               default       *          allowed   allowed
deployers.core.projectriff.io                default       *          missing   missing
processors.streaming.projectriff.io          default       *          missing   missing
streams.streaming.projectriff.io             default       *          missing   missing
inmemoryproviders.streaming.projectriff.io   default       *          missing   missing
kafkaproviders.streaming.projectriff.io      default       *          missing   missing
pulsarproviders.streaming.projectriff.io     default       *          missing   missing
adapters.knative.projectriff.io              default       *          allowed   allowed
deployers.knative.projectriff.io             default       *          allowed   allowed
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
NAME     LATEST IMAGE                                                                                           ARTIFACT    HANDLER   INVOKER   STATUS   AGE
square   index.docker.io/jldec/square@sha256:527053273ec98697dbdd88951f77edf82a9a46767125cd1e4348422fe5b8e09f   square.js   <empty>   <empty>   Ready    4m3s
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
knative-square   function   square   knative-square.default.example.com   Ready    19s
```

### invoke the function

Knative configures HTTP routes on the ingress controller. Requests are routed by hostname.

Look up the nodePort for the ingress gateway; you should see a port value like `30195`.

```sh
MINIKUBE_IP=$(minikube ip)
INGRESS_PORT=$(kubectl get svc envoy-external  --namespace projectcontour --output 'jsonpath={.spec.ports[?(@.port==80)].nodePort}')
echo $MINIKUBE_IP:$INGRESS_PORT
```

Invoke the function by POSTing to the ingress gateway, passing the hostname and content-type as headers.

```sh
curl http://$MINIKUBE_IP:$INGRESS_PORT/ -w '\n' \
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

You can delete your Minikube cluster and then recreate it (this will remove all state including riff).

```sh
minikube delete
minikube start --memory=4096 --cpus=4
```

Alternatively, you can use the following commands to uninstall riff:

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
