---
id: kind
title: Getting started on kind
sidebar_label: kind
---

The following will help you get started running a riff function with Knative on [kind](https://kind.sigs.k8s.io/), a tool for running local Kubernetes clusters using Docker container “nodes”. 

### Prerequisites
These instructions assume that you are running recent versions of [go](https://golang.org/) and [docker](https://docs.docker.com/install/).
You will also need a version of the kubectl CLI at least as recent as the kind node (v1.15.3).

To install from released builds, see the [kind Quick Start](https://kind.sigs.k8s.io/docs/user/quick-start).

### Resize the VM and disable built-in Kubernetes

If you are running Docker on macOS or Windows, use the Preferences feature in the Docker menu to open Advanced settings and configure your VM with at least 5GB of memory and 4 CPUs. Also, make sure that you don't have Kubernetes enabled. Click on Apply & Restart.

### Install kind

```sh
GO111MODULE="on" go get sigs.k8s.io/kind@v0.5.1 && kind create cluster
```

This will download dependencies and build the kind CLI.

### Create a cluster

```sh
kind create cluster
```
```
Creating cluster "kind" ...
 ✓ Ensuring node image (kindest/node:v1.15.3) 🖼 
 ✓ Preparing nodes 📦 
 ✓ Creating kubeadm config 📜 
 ✓ Starting control-plane 🕹️ 
 ✓ Installing CNI 🔌 
 ✓ Installing StorageClass 💾 
Cluster creation complete. You can now use the cluster with:

export KUBECONFIG="$(kind get kubeconfig-path --name="kind")"
kubectl cluster-info
```

### Configure kubectl

```sh
export KUBECONFIG="$(kind get kubeconfig-path --name="kind")"
kubectl cluster-info
```
```
Kubernetes master is running at https://127.0.0.1:56252
KubeDNS is running at https://127.0.0.1:56252/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

Confirm that your kubectl context is pointing to the kind cluster  

```sh
kubectl config current-context
```
```
kubernetes-admin@kind
```

### Monitor your cluster

At this point it is useful to monitor your cluster using a utility like `watch`. To install on a Mac

```sh
brew install watch
```

Watch pods in a separate terminal.

```sh
watch -n 1 kubectl get pod --all-namespaces
```

## Install Helm

[Helm](https://helm.sh) is a popular package manager for Kubernetes. The riff runtime and its dependencies are provided as Helm charts.

Download a recent release of the [Helm v2 CLI](https://github.com/helm/helm/releases/) for your platform.
(Download version 2.13 or later, Helm v3 is currently pre-release and has not been tested for compatibility with riff).
Unzip and copy the Helm CLI executable to a directory on your path.

Initialize the Helm Tiller server in your cluster.
```sh
kubectl create serviceaccount tiller -n kube-system
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount kube-system:tiller
helm init --wait --service-account tiller
```

Validate the installation.
```sh
helm version
```
```
Client: &version.Version{SemVer:"v2.16.1", GitCommit:"bbdfe5e7803a12bbdf97e94cd847859890cf4050", GitTreeState:"clean"}
Server: &version.Version{SemVer:"v2.16.1", GitCommit:"bbdfe5e7803a12bbdf97e94cd847859890cf4050", GitTreeState:"clean"}
```

> NOTE: Please see the [Helm documentation](https://helm.sh/docs/using_helm/#securing-your-helm-installation) for additional Helm security configuration.

## Build the riff CLI

Clone the [riff CLI repo](https://github.com/projectriff/cli/), and run `make build install`. This will also require a recent [go](https://golang.org/doc/install#install) build environment.

Check that the riff CLI version is 0.5.0-snapshot.
```sh
riff --version
```
```
riff version 0.5.0-snapshot (bc2a320058560d08b5b4681240ca1a02d4599017)
```

## Install riff using Helm

Load the projectriff charts

```sh
helm repo add projectriff https://projectriff.storage.googleapis.com/charts/releases
helm repo update
```

riff can be installed with optional runtimes. The riff build system is always installed, and is required by each runtime.

If using the Knative runtime, first install Istio:

```sh
helm install projectriff/istio --name istio --namespace istio-system --set gateways.istio-ingressgateway.type=NodePort --wait --devel
```

Install riff with both the Core and Knative runtimes. To omit or include other runtimes, edit the relevant lines below.

```sh
helm install projectriff/riff --name riff \
  --set tags.core-runtime=true \
  --set tags.knative-runtime=true \
  --set tags.streaming-runtime=false \
  --wait --devel
```

> NOTE: After installing the Streaming runtime, configure Kafka with a [KafkaProvider](/docs/v0.5/runtimes/streaming#kafkaprovider).

Verify the riff install. Resources may be missing if the corresponding runtime was not installed.

```sh
riff doctor
```

```
NAMESPACE     STATUS
riff-system   ok

RESOURCE                              READ      WRITE
configmaps                            allowed   allowed
secrets                               allowed   allowed
pods                                  allowed   n/a
pods/log                              allowed   n/a
applications.build.projectriff.io     allowed   allowed
containers.build.projectriff.io       allowed   allowed
functions.build.projectriff.io        allowed   allowed
deployers.core.projectriff.io         allowed   allowed
processors.streaming.projectriff.io   allowed   allowed
streams.streaming.projectriff.io      allowed   allowed
adapters.knative.projectriff.io       allowed   allowed
deployers.knative.projectriff.io      allowed   allowed
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

The [Knative Runtime](../runtimes/knative.md) is only available on clusters with Istio and Knative installed. Knative deployers run riff workloads using Knative resources which provide auto-scaling (including scale-to-zero) based on HTTP request traffic, and routing.

```sh
riff knative deployer create knative-square --function-ref square --tail
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

Knative configures HTTP routes on the istio-ingressgateway. Requests are routed by hostname.

Look up the IP address for the kind node; you should see an address like `172.17.0.3`.

```sh
KIND_NODE_IP=$(kubectl get node -o jsonpath='{$.items[0].status.addresses[?(@.type=="InternalIP")].address}')
echo $KIND_NODE_IP
```

Look up the nodePort for the ingressgateway; you should see a port value like `30195`.

```sh
INGRESS_PORT=$(kubectl get svc istio-ingressgateway --namespace istio-system --output 'jsonpath={.spec.ports[?(@.port==80)].nodePort}')
echo $INGRESS_PORT
```

Invoke the function by POSTing to the ingressgateway, passing the hostname and content-type as headers.

```sh
curl http://$KIND_NODE_IP:$INGRESS_PORT/ -w '\n' \
-H 'Host: knative-square.default.example.com' \
-H 'Content-Type: application/json' \
-d 7
```
```
49
```

## Create a Core deployer

The [Core runtime](../runtimes/core.md) deploys riff workloads as "vanilla" Kubernetes deployments and services.

```sh
riff core deployer create k8s-square --function-ref square --tail
```

After the deployer is created, you can see the service name by listing deployers.

```sh
riff core deployers list
```
```
NAME         TYPE       REF      SERVICE               STATUS   AGE
k8s-square   function   square   k8s-square-deployer   Ready    16s
```

### invoke the function

In a separate terminal, start port-forwarding to the ClusterIP service created by the deployer.

```sh
kubectl port-forward service/k8s-square-deployer 8080:80
```
```
Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
```

Make a POST request to invoke the function using the port assigned above.

```sh
curl http://localhost:8080/ -w '\n' \
-H 'Content-Type: application/json' \
-d 8
```
```
64
```

> NOTE: unlike Knative, the Core runtime will not scale deployments down to zero.

## Cleanup

```sh
riff knative deployer delete knative-square
riff core deployer delete k8s-square
riff function delete square
```
