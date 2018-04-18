---
title: "Getting started on minikube"
permalink: /docs/getting-started-on-minikube/
excerpt: "How to run **riff** on Minikube"
header:
  overlay_image: /images/minikube2.png
  overlay_filter: 0.4
  overlay_color: "#555"
redirect_from:
  - /docs/
---

### TL;DR
1. install docker, kubectl, minikube, and helm
2. monitor your riff cluster with watch and kubectl
3. install riff and kafka using a helm chart
4. create a sample function
5. publish an event to trigger the sample function
6. delete the sample function

> **NOTE**: The Kubernetes community is promoting the use of RBAC for all clusters.
Starting with with Minikube v0.26.0 the default for Minikube is to use the kubeadm bootstrapper which enables RBAC.
The older localkube bootstrapper is now deprecated.
The following instructions assume that your cluster is running with RBAC enabled.
It is still possible to install riff without RBAC roles by adding a `--set rbac.create=false` option when installing the riff chart.

### install docker
Installing [Docker Community Edition](https://www.docker.com/community-edition) is the easiest way get started with docker. Since minikube includes its own docker daemon, you actually only need the docker CLI to build function containers for riff. This means that if you want to, you can shut down the Docker (server) app, and turn off automatic startup of Docker on login.

### install kubectl
[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. It is used to manage minikube as well as hosted Kubernetes clusters. If you already have the Google Cloud Platform SDK, use: `gcloud components install kubectl`.

### install minikube
[Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is a Kubernetes environment which runs in a single virtual machine. See the [latest release](https://github.com/kubernetes/minikube/releases) for installation, and the [readme](https://github.com/kubernetes/minikube/blob/master/README.md) for more detailed information.

### start your minikube cluster

```sh
minikube start --memory=4096 --bootstrapper=kubeadm
```

Once minikube is running you can open a browser-based dashboard with `minikube dashboard`.

### configure docker to build containers in minikube
This is only reqired once per terminal session. See [here](https://kubernetes.io/docs/getting-started-guides/minikube/#reusing-the-docker-daemon) for more details.

```sh
eval $(minikube docker-env)
```

### monitor your minikube
At this point it is useful to monitor your minikube using a utility like `watch` to refresh the output of `kubectl get` in a separate terminal window every one or two seconds.
```sh
brew install watch
watch -n 1 kubectl get pods,deployments --all-namespaces
```

### install helm
[Helm](https://docs.helm.sh/using_helm/#installing-helm) is used to package and install resources for Kubernetes. Helm packages are called charts. After [installing](https://docs.helm.sh/using_helm/#installing-helm) the helm CLI, point helm to the riff-charts repo.

```sh
helm repo add projectriff https://riff-charts.storage.googleapis.com
helm repo update
```

### start the helm server (tiller) with RBAC

The Helm project describes the [Best Practices for Securing Helm and Tiller](https://docs.helm.sh/using_helm/#best-practices-for-securing-helm-and-tiller) in their documentation. This can be fairly involved and for less critical development clusters it is easier to configure the Helm tiller server to run with cluster-admin privileges using a service account in the `kube-system` namespace.

The following commands will install the Helm tiller server to run with cluster-admin privileges.

```sh
kubectl -n kube-system create serviceaccount tiller
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
helm init --service-account=tiller
```

Watch kubectl for tiller to start running.

### install riff and kafka
Install riff and kafka together on the same `riff-system` namespace, with the release name `projectriff`. For minikube you should use a NodePort for the HTTP gateway.

```sh
helm install projectriff/riff \
  --name projectriff \
  --namespace riff-system \
  --set kafka.create=true \
  --set httpGateway.service.type=NodePort
```

Watch the riff-system namespace with kubectl. You may need to wait a minute for the container images to be pulled, and for zookeeper to start. It is normal for the kafka broker and the other riff components to fail and re-start while waiting.

```sh
watch -n 1 kubectl get po,deploy --namespace riff-system
```

```
NAME                                                       READY     STATUS    RESTARTS   AGE
po/projectriff-riff-function-controller-7d959dbf4f-p7pnz   1/1       Running   0          5m
po/projectriff-riff-http-gateway-666bb96d6c-hzmvn          1/1       Running   0          5m
po/projectriff-riff-topic-controller-dcf76d565-mw6th       1/1       Running   0          5m
po/projectriff-kafka-68b986865b-6tsbk                      1/1       Running   3          11m
po/projectriff-zookeeper-85fc6df85c-v6kxx                  1/1       Running   0          11m

NAME                                          DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/projectriff-riff-function-controller   1         1         1            1           5m
deploy/projectriff-riff-http-gateway          1         1         1            1           5m
deploy/projectriff-riff-topic-controller      1         1         1            1           5m
deploy/projectriff-kafka                      1         1         1            1           11m
deploy/projectriff-zookeeper                  1         1         1            1           11m
```

### install the current riff CLI tool

The [riff CLI](https://github.com/projectriff/riff/tree/master/riff-cli) is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page.

## install invokers
Starting in v0.0.6, riff invoker resources are installed separately from riff.

```bash
{% assign invokers = site.invokers | sort: 'name' -%}
{% include invokers.txt invokers=invokers -%}
```

## new function using node.js
The steps below will create a JavaScript function from scratch. The same files are also available in the `square` [sample](https://github.com/projectriff/riff/blob/master/samples/node/square/) on GitHub.

### write the function source
Create `square.js` in an empty directory.
```js
module.exports = (x) => x ** 2
```

### create the function deployment
Run the following command from the same directory where the above function file is created:

```bash
riff create node --name square --input numbers --filepath .
```
This command will initialize the function, creating a `Dockerfile` and YAML files `square-function.yaml` and `square-topics.yaml`
defining the Kubernetes resources for the function and topics respectively. It will also build the docker image and apply the Kubernetes function and topics resources to the cluster.

### watch for functions and topics in the default namespace

```
watch -n 1 kubectl get functions,topics,pods,deployments
```

### trigger the function
```bash
riff publish --input numbers --data 10 --reply
```
If `10` is the input to the square function, the response should be `100`.
You can also abbreviate parameters as follows:

```bash
riff publish -i numbers -d 10 -r
```

### delete the function and topic

```bash
riff delete --name square --all
```
