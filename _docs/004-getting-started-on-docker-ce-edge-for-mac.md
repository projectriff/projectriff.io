---
title: "Getting started on Docker for Mac"
permalink: /docs/getting-started-on-docker-ce-edge-for-mac/
excerpt: "How to run **riff** on Docker CE Edge for Mac"
header:
  overlay_image: /images/docker-edge-for-mac.png
  overlay_filter: 0.2
  overlay_color: "#555"
redirect_from:
  - /docs/
---

### TL;DR
1. install the edge release of docker for mac
2. configure the cluster and enable kubernetes
3. monitor your riff cluster with watch and kubectl
4. install helm
5. install riff and kafka using a helm chart
6. create a sample function
7. publish an event to trigger the sample function
8. delete the sample function

### install docker edge
Kubernetes and the kubectl CLI are now included with [Edge releases](https://store.docker.com/editions/community/docker-ce-desktop-mac) of Docker Community Edition. A single shared docker daemon and image repository make it simpler to work with, performance is decent, and frequent updates help keep your setup fresh.

![download Docker edge for mac](/images/docker-edge-for-mac-download.png)

### configure the VM
Once Docker is installed and running, use the Preferences feature in the Docker menu to open advanced settings and configure your VM with 4GB of memory. Click on Apply and Restart.
![configure Docker VM](/images/docker-vm-config.png)

### enable Kubernetes
Now enable Kubernetes, and wait for the cluster to start.
![enable Kubernetes](/images/docker-edge-kubernetes.png)

If you previously had minikube or GKE configured, switch your kubectl context to "docker-for-desktop".

![set context to docker-for-desktop](/images/docker-edge-context.png)


### monitor your cluster
At this point it is useful to monitor your kubernetes cluster using a utility like `watch`.
```sh
brew install watch
```
This will refresh the output of `kubectl get` for all namespaces in a terminal window every second.
```sh
watch -n 1 kubectl get pods,deployments --all-namespaces
```
If your cluster shows signs of being unhealthy, use the "Reset Kubernetes Cluster" feature in Docker.
![reset Kubernetes](/images/docker-edge-kubernetes-reset.png)



### install helm
[Helm](https://docs.helm.sh/using_helm/#installing-helm) is used to package and install resources for Kubernetes. Helm packages are called charts. After [installing](https://docs.helm.sh/using_helm/#installing-helm) the helm CLI, point helm to the riff-charts repo.
```sh
helm repo add projectriff https://riff-charts.storage.googleapis.com
```
Update your helm repo and search for riff to confirm that the latest riff release is available.
```sh
helm repo update
helm search -l riff
```
```sh
NAME             	VERSION       	DESCRIPTION                                  
projectriff/riff 	0.0.7-snapshot	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.6         	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.6-snapshot	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.5         	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.5-snapshot	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.4         	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.4-snapshot	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.3         	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.3-rbac    	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.2         	riff is for functions - a FaaS for Kubernetes
projectriff/riff 	0.0.1         	riff is for functions - a FaaS for Kubernetes
projectriff/kafka	0.0.2         	kafka for riff                               
projectriff/kafka	0.0.1         	kafka for riff                               
```
> Note: "snapshot" releases reflect the latest (possibly unstable) CI build from master and will not be
  selected in a `helm install` unless the `--devel` flag is used. Using snapshots is not recommended
  unless you [build riff images](https://github.com/projectriff/riff/blob/master/README.adoc#-manual-build) yourself.

### start the helm server (tiller)
```sh
helm init
```
Watch kubectl for the tiller-deploy pod to start running.

### install riff and kafka
Install riff and kafka together on the same `riff-system` namespace, with the release name `projectriff`. Use a NodePort for the HTTP gateway.

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
