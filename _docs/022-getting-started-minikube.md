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

Installing [Docker Community Edition](https://www.docker.com/community-edition) is the easiest way get started with docker. Since minikube includes its own docker daemon, you actually only need the docker CLI to build function containers for riff. This means that if you want to, you can shut down the Docker (server) app, and turn off automatic startup of Docker on login.

### install kubectl

[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. It is used to manage minikube as well as hosted Kubernetes clusters. If you already have the Google Cloud Platform SDK, use: `gcloud components install kubectl`.

### install minikube

[Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is a Kubernetes environment which runs in a single virtual machine. See the [latest release](https://github.com/kubernetes/minikube/releases) for installation, and the [readme](https://github.com/kubernetes/minikube/blob/master/README.md) for more detailed information.

For macOS we recommend using hyperkit as the vm driver. To install Hyperkit

```sh
curl -LO https://storage.googleapis.com/minikube/releases/latest/docker-machine-driver-hyperkit \
&& sudo install -o root -g wheel -m 4755 docker-machine-driver-hyperkit /usr/local/bin/
```

For Linux we suggest using the [kvm2](https://github.com/kubernetes/minikube/blob/master/docs/drivers.md#kvm2-driver) driver.

For additional details see the minikube [driver installation](https://github.com/kubernetes/minikube/blob/master/docs/drivers.md#hyperkit-driver) docs.

## create a Minikube cluster

```sh
minikube start --memory=8192 --cpus=4 \
--kubernetes-version=v1.12.2 \
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
NAMESPACE          NAME                                         READY     STATUS      RESTARTS   AGE
istio-system       istio-citadel-84fb7985bf-dmc58               1/1       Running     0          12m
istio-system       istio-cleanup-secrets-bnjb9                  0/1       Completed   0          12m
istio-system       istio-egressgateway-bd9fb967d-dr5mp          1/1       Running     1          12m
istio-system       istio-galley-655c4f9ccd-4hr8w                1/1       Running     0          12m
istio-system       istio-ingressgateway-688865c5f7-z9n2d        1/1       Running     1          12m
istio-system       istio-pilot-6cd69dc444-bv9cc                 2/2       Running     0          12m
istio-system       istio-policy-6b9f4697d-hxkqd                 2/2       Running     0          12m
istio-system       istio-sidecar-injector-8975849b4-8mtts       1/1       Running     0          12m
istio-system       istio-statsd-prom-bridge-7f44bb5ddb-r9c8t    1/1       Running     0          12m
istio-system       istio-telemetry-6b5579595f-tdnln             2/2       Running     0          12m
istio-system       knative-ingressgateway-77b757d468-wzh6b      1/1       Running     0          3m
knative-build      build-controller-56f555c8b9-cfrnr            1/1       Running     0          3m
knative-build      build-webhook-868b65dd9-8xddg                1/1       Running     0          3m
knative-eventing   eventing-controller-596c6bc4fd-rshsj         1/1       Running     0          3m
knative-eventing   stub-clusterbus-dispatcher-7b86b64cd-mnssd   2/2       Running     0          56s
knative-eventing   webhook-796b574465-bdv7m                     1/1       Running     0          3m
knative-serving    activator-7ffbdb4f46-lzsrj                   2/2       Running     0          3m
knative-serving    autoscaler-f55c76f7c-pmr2x                   2/2       Running     0          3m
knative-serving    controller-8647f984bf-9vc82                  1/1       Running     0          3m
knative-serving    webhook-896c797cd-lfsfc                      1/1       Running     0          3m
kube-system        etcd-minikube                                1/1       Running     0          12m
kube-system        kube-addon-manager-minikube                  1/1       Running     0          13m
kube-system        kube-apiserver-minikube                      1/1       Running     3          4m
kube-system        kube-controller-manager-minikube             1/1       Running     0          12m
kube-system        kube-dns-86f4d74b45-wxmcd                    3/3       Running     0          13m
kube-system        kube-proxy-mhxdt                             1/1       Running     0          13m
kube-system        kube-scheduler-minikube                      1/1       Running     0          12m
kube-system        kubernetes-dashboard-5498ccf677-bpz7s        1/1       Running     0          13m
kube-system        storage-provisioner                          1/1       Running     0          13m
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
