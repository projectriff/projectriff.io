---
layout: doc
title: "Getting started on Docker for Mac"
short_title: on Docker for Mac
permalink: /docs/getting-started/docker-for-mac/
excerpt: "How to run Knative using **riff** on Docker Community Edition for Mac"
header:
  overlay_image: /images/docker-for-mac.png
  overlay_filter: 0.4
  overlay_color: "#555"
redirect_from:
- /docs/getting-started-on-docker-ce-edge-for-mac/
categories:
- getting-started
---

# Getting started on Docker for Mac

The following will help you get started running a riff function with Knative on Docker Community Edition for Mac.

### TL;DR

1. Install the latest release of Docker for Mac
1. Configure the cluster and enable Kubernetes
1. Install kubectl, helm and the riff CLIs
1. Install Knative using the riff CLI
1. Create a function
1. Invoke the function

### install Docker

Kubernetes and the kubectl CLI are now included with [Docker Community Edition for Mac](https://store.docker.com/editions/community/docker-ce-desktop-mac).

![download Docker for mac](/images/docker-for-mac-download.png)

### resize the VM

Once Docker is installed and running, use the Preferences feature in the Docker menu to open Advanced settings and configure your VM with 4GB of memory and 4 CPUs. Click on Apply & Restart.
![configure Docker VM](/images/docker-for-mac-vm-config-4gb.png)

### enable Kubernetes

Now enable Kubernetes, and wait for the cluster to start.
![enable Kubernetes](/images/docker-for-mac-kubernetes.png)

If you previously had Minikube or GKE configured, switch your kubectl context to "docker-desktop".

![set context to docker-for-desktop](/images/docker-for-mac-context.png)

## install the helm CLI

[Helm](https://helm.sh) is a popular package manager for Kubernetes. The riff runtime and its dependencies are provided as Helm charts.

Download and install the latest [Helm 2.x release](https://github.com/helm/helm/releases) for your platform. (Helm 3 is currently in alpha and has not been tested for compatibility with riff)

After installing the Helm CLI, we need to initialize the Helm Tiller in our cluster.

> NOTE: Please see the Helm documentation for how to [secure the connection to Tiller within your cluster](https://helm.sh/docs/using_helm/#securing-your-helm-installation).

```sh
kubectl create serviceaccount tiller -n kube-system
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount kube-system:tiller
helm init --wait --service-account tiller
```

## install the riff CLI

The [riff CLI](https://github.com/projectriff/riff/) is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Once installed, check that the riff CLI version is 0.4.0 or later.

```sh
riff --version
```
```
riff version 0.4.0-snapshot (2c4a47d0872283b629ea478916c43d831e75ea1f)
```

At this point it is useful to monitor your cluster using a utility like `watch`. To install on a Mac

```sh
brew install watch
```

Watch pods in a separate terminal.

```sh
watch -n 1 kubectl get pod --all-namespaces
```

## install riff using Helm

Load the projectriff charts

```ah
helm repo add projectriff https://projectriff.storage.googleapis.com/charts/releases
helm repo update
```

riff can be installed with or without Knative. The riff core runtime is available in both environments, however, the riff knative runtime is only available if
Knative is installed.

To install riff with Knative and Istio:

```sh
helm install projectriff/istio --name istio --namespace istio-system --set gateways.istio-ingressgateway.type=NodePort --wait
helm install projectriff/riff --name riff --set knative.enabled=true
```

Install riff without Knative or Istio:

```sh
helm install projectriff/riff --name riff
```

Verify the riff install. 

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

### initialize the namespace and provide credentials for pushing images to DockerHub

Use the riff CLI to initialize your namespace (if you plan on using a namespace other than `default` then substitute the name you want to use). This will create a serviceaccount and a secret with the provided credentials and install a buildtemplate. Replace the ??? with your docker username.

```sh
export DOCKER_ID=???
```

```sh
riff namespace init default --docker-hub $DOCKER_ID
```

You will be prompted to provide the password.

## create a function

This step will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to your dockerhub repo.

```sh
riff function create square \
  --git-repo https://github.com/projectriff-samples/node-square  \
  --artifact square.js \
  --verbose
```

If you're still watching pods, you should see something like the following

```sh
NAMESPACE       NAME                        READY   STATUS        RESTARTS   AGE
default         square-jhtmf-pod-23a291     0/1     Init:1/7      0          16s
```

The 7 "Init" containers may take a while to complete the first time a function is built, but eventually that pod should show a status of completed, and a new square deployment pod should be running 3/3 containers.

```sh
NAMESPACE       NAME                                            READY   STATUS      RESTARTS   AGE
default         square-jhtmf-pod-23a291                         0/1     Completed   0          101s
default         square-pb9nf-deployment-849689c559-jg87j        3/3     Running     0          44s
```

## invoke the function

```sh
riff service invoke square --json -- -w '\n' -d 8
```

#### result

```
curl http://localhost:31380/ -H 'Host: square.default.example.com' -H 'Content-Type: application/json' -w '\n' -d 8
64
```

## delete the function

```sh
riff service delete square
```

## uninstalling and reinstalling
If you need to upgrade riff, we recommend resetting the Kubernetes cluster first, and then reinstalling.

![reset Kubernetes using Preferences/Reset](/images/docker-for-mac-reset-kubernetes.png)

