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
- /docs/getting-started-on-docker-ce-edge-for-windows/
categories:
- getting-started
---

# Getting started on Docker for Mac

The following will help you get started running a riff function with Knative on Docker Community Edition for Mac.

### TL;DR
1. install the latest release of docker for mac
2. configure the cluster and enable kubernetes
4. install Knative using the riff CLI
5. create a function
6. invoke the function

### install docker

Kubernetes and the kubectl CLI are now included with [Docker Community Edition for Mac](https://store.docker.com/editions/community/docker-ce-desktop-mac). We recommend downloading the latest stable version.

![download Docker edge for mac](/images/docker-for-mac-download.png)

### configure the VM
Once Docker is installed and running, use the Preferences feature in the Docker menu to open advanced settings and configure your VM with 8GB of memory. Click on Apply & Restart.
![configure Docker VM](/images/docker-for-mac-vm-config.png)

### enable Kubernetes
Now enable Kubernetes, and wait for the cluster to start.
![enable Kubernetes](/images/docker-for-mac-kubernetes.png)

If you previously had minikube or GKE configured, switch your kubectl context to "docker-for-desktop".

![set context to docker-for-desktop](/images/docker-for-mac-context.png)

## install the riff CLI

The [riff CLI](https://github.com/projectriff/riff/) is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Once installed, check that the riff CLI version is 0.1.3 or later.

```sh
riff version
```
```
Version
  riff cli: 0.1.3 (a216005db0d50056c41b45fdc3384b09ad24381d)
```

At this point it is useful to monitor your cluster using a utility like `watch`. To install on a Mac

```sh
brew install watch
```

Watch pods in a separate terminal.

```sh
watch -n 1 kubectl get pod --all-namespaces
```

## install Knative using the riff CLI

Install Knative, watching the pods until everything is running (this could take a couple of minutes). The `--node-port` option replaces LoadBalancer type services with NodePort.

```sh
riff system install --node-port
```

You should see pods running in namespaces istio-system, knative-build, knative-serving, and knative-eventing as well as kube-system when the system is fully operational. 

```sh
NAMESPACE          NAME                                          READY     STATUS      RESTARTS   AGE
docker             compose-7447646cf5-x5fpz                      1/1       Running     0          2m
docker             compose-api-6fbc44c575-wj7ks                  1/1       Running     0          2m
istio-system       istio-citadel-84fb7985bf-jhr4g                1/1       Running     0          1m
istio-system       istio-cleanup-secrets-dqsrc                   0/1       Completed   0          1m
istio-system       istio-egressgateway-bd9fb967d-xwsd7           1/1       Running     0          1m
istio-system       istio-galley-655c4f9ccd-c9nv5                 1/1       Running     0          1m
istio-system       istio-ingressgateway-688865c5f7-zbflv         1/1       Running     0          1m
istio-system       istio-pilot-6cd69dc444-vh4b4                  2/2       Running     0          1m
istio-system       istio-policy-6b9f4697d-dhztf                  2/2       Running     0          1m
istio-system       istio-sidecar-injector-8975849b4-7l5v4        1/1       Running     0          1m
istio-system       istio-statsd-prom-bridge-7f44bb5ddb-7pxtw     1/1       Running     0          1m
istio-system       istio-telemetry-6b5579595f-gwvk2              2/2       Running     0          1m
istio-system       knative-ingressgateway-77b757d468-gwgt7       1/1       Running     0          21s
knative-build      build-controller-fcbf489cf-pn4xq              1/1       Running     0          22s
knative-build      build-webhook-7b4c9f7859-ws68j                1/1       Running     0          22s
knative-eventing   eventing-controller-796dff6c45-h69l9          1/1       Running     0          20s
knative-eventing   stub-clusterbus-dispatcher-5d5f6676b8-bxwhb   2/2       Running     0          17s
knative-eventing   webhook-77c768d6bd-s6t6k                      1/1       Running     0          20s
knative-serving    activator-c9f797bcc-7mvgw                     2/2       Running     0          21s
knative-serving    autoscaler-6c84dffc9c-vf9fq                   2/2       Running     0          21s
knative-serving    controller-86595ccbc8-jlvrr                   1/1       Running     0          21s
knative-serving    webhook-5c75665c54-42ndf                      1/1       Running     0          21s
kube-system        etcd-docker-for-desktop                       1/1       Running     0          1m
kube-system        kube-apiserver-docker-for-desktop             1/1       Running     0          1m
kube-system        kube-controller-manager-docker-for-desktop    1/1       Running     0          1m
kube-system        kube-dns-86f4d74b45-frdz7                     3/3       Running     0          2m
kube-system        kube-proxy-vcsnv                              1/1       Running     0          2m
kube-system        kube-scheduler-docker-for-desktop             1/1       Running     0          1m
```

### initialize the namespace and provide credentials for pushing images to DockerHub

Use the riff CLI to initialize your namespace (if you plan on using a namespace other than `default` then substitute the name you want to use). This will create a serviceaccount and a secret with the provided credentials and install a buildtemplate. Replace the ??? with your docker username.

```sh
export DOCKER_ID=???
```

```sh
riff namespace init default --dockerhub $DOCKER_ID
```

You will be prompted to provide the password.

## create a function

This step will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to your dockerhub repo.

```sh
riff function create node square \
  --git-repo https://github.com/projectriff-samples/node-square  \
  --artifact package.json \
  --image $DOCKER_ID/square \
  --wait
```

If you're still watching pods, you should see something like the following

```sh
NAMESPACE          NAME                 READY     STATUS      RESTARTS   AGE
default            square-00001-6qkjg   0/1       Init:3/4    0          11s
```

The 4 "Init" containers may take a while to complete the first time a function is built, but eventually that pod should show a status of completed, and a new square deployment pod should be running 3/3 containers.

```sh
NAMESPACE          NAME                                          READY     STATUS      RESTARTS   AGE
default            square-00001-6qkjg                            0/1       Completed   0          55s
default            square-00001-deployment-5f68cff465-dxfcj      3/3       Running     0          32s
```

## invoke the function

```sh

riff service invoke square --text -- -w '\n' -d 8
```

#### result
```
curl http://192.168.64.6:32380/ -H 'Host: square.default.example.com' -H 'Content-Type: text/plain' -w '\n' -d 8
64
```

## delete the function

```sh
riff service delete square
```

## uninstalling and reinstalling istio
One caveat with Docker for Mac is that it handles Kubernetes NodePorts differently from minikube. If you need to upgrade Knative and Istio, we recommend resetting the Kubernetes cluster first, and then reinstalling Knative with Istio from scratch. Uninstalling and reinstalling without resetting Kubernetes can result in the knative-ingress becoming unreachable.

![reset Kubernetes using Preferences/Reset](/images/docker-for-mac-reset-kubernetes.png)

