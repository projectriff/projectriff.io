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

## install Knative using the riff CLI

Install Knative, watching the pods until everything is running (this could take a couple of minutes). The `--node-port` option replaces LoadBalancer type services with NodePort.

```sh
riff system install --node-port
```

You should see pods running in namespaces istio-system, knative-build, knative-serving, and knative-eventing as well as kube-system when the system is fully operational. 

```
NAMESPACE          NAME                                            READY   STATUS      RESTARTS   AGE
docker             compose-7cf768cb84-dm5ch                        1/1     Running     0          36m
docker             compose-api-579965d67f-m4hzk                    1/1     Running     0          36m
istio-system       cluster-local-gateway-547467ccf6-f7lnz          1/1     Running     0          2m7s
istio-system       istio-citadel-7d64db8bcf-9hg6r                  1/1     Running     0          2m8s
istio-system       istio-cleanup-secrets-kq74p                     0/1     Completed   0          2m17s
istio-system       istio-egressgateway-6ddf4c8bd6-hm298            1/1     Running     0          2m8s
istio-system       istio-galley-7dd996474-94nwm                    1/1     Running     0          2m9s
istio-system       istio-ingressgateway-84b89d647f-9lgpm           1/1     Running     0          2m8s
istio-system       istio-pilot-54b76645df-fb7fv                    2/2     Running     0          2m2s
istio-system       istio-policy-5c4d9ff96b-w6tpb                   2/2     Running     0          2m8s
istio-system       istio-sidecar-injector-6977b5cf5b-plf8x         1/1     Running     0          2m8s
istio-system       istio-statsd-prom-bridge-b44b96d7b-fzd4l        1/1     Running     0          2m9s
istio-system       istio-telemetry-7676df547f-hx7zh                2/2     Running     0          2m8s
knative-build      build-controller-7b8987d675-9ch5q               1/1     Running     0          81s
knative-build      build-webhook-74795c8696-sbg9g                  1/1     Running     0          81s
knative-eventing   eventing-controller-864657d8d4-l666c            1/1     Running     0          78s
knative-eventing   in-memory-channel-controller-f794cc9d8-f4hml    1/1     Running     0          77s
knative-eventing   in-memory-channel-dispatcher-8595c7f8d7-s7xc6   2/2     Running     1          77s
knative-eventing   webhook-5d76776d55-r7qzm                        1/1     Running     0          78s
knative-serving    activator-7c8b59d78-nf6qq                       2/2     Running     1          79s
knative-serving    autoscaler-666c9bfcc6-vwg49                     2/2     Running     1          79s
knative-serving    controller-799cd5c6dc-zj6lw                     1/1     Running     0          79s
knative-serving    webhook-5b66fdf6b9-xtcsn                        1/1     Running     0          79s
kube-system        coredns-86c58d9df4-ldzk2                        1/1     Running     0          37m
kube-system        coredns-86c58d9df4-psg2l                        1/1     Running     0          37m
kube-system        etcd-docker-desktop                             1/1     Running     0          36m
kube-system        kube-apiserver-docker-desktop                   1/1     Running     0          36m
kube-system        kube-controller-manager-docker-desktop          1/1     Running     0          36m
kube-system        kube-proxy-2gb2c                                1/1     Running     0          37m
kube-system        kube-scheduler-docker-desktop                   1/1     Running     0          36m
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

