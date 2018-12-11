---
layout: doc
title: "Getting started running on Minikube"
short_title: on Minikube
permalink: /docs/getting-started/minikube/
excerpt: "How to run Knative using **riff** on Minikube"
header:
  overlay_image: /images/minikube2.png
  overlay_filter: 0.4
  overlay_color: "#555"
redirect_from:
- /docs/getting-started-on-minikube/
- /docs/getting-started-with-knative-riff-on-minikube/
categories:
- getting-started
---

# Getting started on Minikube

The following will help you get started running a riff function with Knative on Minikube.

## TL;DR

1. install docker, kubectl, and minikube
2. install the latest riff CLI
3. create a minikube cluster for Knative
4. install Knative using the riff CLI
5. create a function
6. invoke the function

### install docker

Installing [Docker Community Edition](https://store.docker.com/search?type=edition&offering=community) is the easiest way get started with docker. Since minikube includes its own docker daemon, you actually only need the docker CLI to build function containers for riff. This means that if you want to, you can shut down the Docker (server) app, and turn off automatic startup of Docker on login.

### install kubectl

[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. It is used to manage minikube as well as hosted Kubernetes clusters. If you already have the Google Cloud Platform SDK, use: `gcloud components install kubectl`.

### install minikube

[Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is a Kubernetes environment which runs in a single virtual machine. See the [latest release](https://github.com/kubernetes/minikube/releases) for installation, and the [readme](https://github.com/kubernetes/minikube/blob/master/README.md) for more detailed information.

For macOS we recommend using Hyperkit as the vm driver. To install Hyperkit, first install [Docker Desktop (Mac)](https://store.docker.com/editions/community/docker-ce-desktop-mac), then run:

```sh
curl -LO https://storage.googleapis.com/minikube/releases/latest/docker-machine-driver-hyperkit \
&& sudo install -o root -g wheel -m 4755 docker-machine-driver-hyperkit /usr/local/bin/
```

For Linux we suggest using the [kvm2](https://github.com/kubernetes/minikube/blob/master/docs/drivers.md#kvm2-driver) driver.

For additional details see the minikube [driver installation](https://github.com/kubernetes/minikube/blob/master/docs/drivers.md#hyperkit-driver) docs.

## create a Minikube cluster

```sh
minikube start --memory=8192 --cpus=4 \
--kubernetes-version=v1.13.0 \
--vm-driver=hyperkit \
--bootstrapper=kubeadm \
--extra-config=apiserver.enable-admission-plugins="LimitRanger,NamespaceExists,NamespaceLifecycle,ResourceQuota,ServiceAccount,DefaultStorageClass,MutatingAdmissionWebhook"
```

To use the kvm2 driver for Linux specify `--vm-driver=kvm2`. Omitting the `--vm-driver` option will use the default driver.

Confirm that your kubectl context is pointing to the new cluster

```sh
kubectl config current-context
```

## install the riff CLI

The [riff CLI](https://github.com/projectriff/riff/) is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Once installed, check that the riff CLI version is 0.2.0 or later.

```sh
riff version
```
```
Version
  riff cli: 0.2.0 (1ae190ff3c7edf4b375ee935f746ebfd1d8eaf5c)
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
istio-system       istio-citadel-7d64db8bcf-bfn5p                1/1       Running     0          4m
istio-system       istio-cleanup-secrets-2bpg4                   0/1       Completed   0          4m
istio-system       istio-egressgateway-6ddf4c8bd6-kf562          1/1       Running     0          4m
istio-system       istio-galley-7dd996474-mchgb                  1/1       Running     0          4m
istio-system       istio-ingressgateway-84b89d647f-l5jjv         1/1       Running     0          4m
istio-system       istio-pilot-86bb4fcbbd-b4jwz                  2/2       Running     0          4m
istio-system       istio-policy-5c4d9ff96b-xcltw                 2/2       Running     0          4m
istio-system       istio-sidecar-injector-6977b5cf5b-kpmdf       1/1       Running     0          4m
istio-system       istio-statsd-prom-bridge-b44b96d7b-nd5bv      1/1       Running     0          4m
istio-system       istio-telemetry-7676df547f-d76z6              2/2       Running     0          4m
istio-system       knative-ingressgateway-75644679c7-2dkm6       1/1       Running     0          2m
knative-build      build-controller-5bdf899f56-79lpr             1/1       Running     0          2m
knative-build      build-webhook-5cc5698f5d-zjh84                1/1       Running     0          2m
knative-eventing   eventing-controller-5557745944-rs9gx          1/1       Running     0          2m
knative-eventing   stub-clusterbus-dispatcher-55779cb455-kfmtj   2/2       Running     0          1m
knative-eventing   webhook-6f486f9cb-wp96h                       1/1       Running     0          2m
knative-serving    activator-c47879875-7llg5                     2/2       Running     0          2m
knative-serving    activator-c47879875-7rz7n                     2/2       Running     0          2m
knative-serving    activator-c47879875-mgds4                     2/2       Running     0          2m
knative-serving    autoscaler-5fc89645cd-7mmvj                   2/2       Running     0          2m
knative-serving    controller-64cfb4859f-bvz7n                   1/1       Running     0          2m
knative-serving    webhook-74dff4f764-xjq6z                      1/1       Running     0          2m
kube-system        coredns-869f847d58-hcdnm                      1/1       Running     0          6m
kube-system        etcd-minikube                                 1/1       Running     0          5m
kube-system        kube-addon-manager-minikube                   1/1       Running     0          5m
kube-system        kube-apiserver-minikube                       1/1       Running     0          5m
kube-system        kube-controller-manager-minikube              1/1       Running     0          5m
kube-system        kube-proxy-bfvt6                              1/1       Running     0          6m
kube-system        kube-scheduler-minikube                       1/1       Running     0          5m
kube-system        kubernetes-dashboard-fb9d74ff-g96gz           1/1       Running     0          6m
kube-system        storage-provisioner                           1/1       Running     0          6m
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
riff function create square \
  --git-repo https://github.com/projectriff-samples/node-square  \
  --image $DOCKER_ID/square:v2 \
  --verbose
```

If you're still watching pods, you should see something like the following

```sh
NAMESPACE    NAME                  READY     STATUS      RESTARTS   AGE
default      square-00001-jk9vj    0/1       Init:0/4    0          24s
```

The 4 "Init" containers may take a while to complete the first time a function is built, but eventually that pod should show a status of completed, and a new square deployment pod should be running 3/3 containers.

```sh
NAMESPACE   NAME                                       READY     STATUS      RESTARTS   AGE
default     square-00001-deployment-679bffb58c-cpzz8   3/3       Running     0          4m
default     square-00001-jk9vj                         0/1       Completed   0          5m
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
