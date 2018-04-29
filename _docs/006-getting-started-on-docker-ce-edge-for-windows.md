---
title: "Getting started on Docker for Windows"
permalink: /docs/getting-started-on-docker-ce-edge-for-windows/
excerpt: "How to run **riff** on Docker CE Edge for Windows"
header:
  overlay_image: /images/docker-edge-for-windows.png
  overlay_filter: 0.4
  overlay_color: "#555"

---

### TL;DR
1. install the edge release of docker for windows
2. configure the cluster and enable kubernetes
3. monitor your riff cluster
4. install helm
5. install riff and kafka using a helm chart
6. create a sample function
7. publish an event to trigger the sample function
8. delete the sample function

### install docker edge
Kubernetes and the kubectl CLI are now included with [Edge releases](https://store.docker.com/editions/community/docker-ce-desktop-windows) of Docker Community Edition. Docker for Windows requires [Hyper-V](https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/about/) on Windows 10 Pro. See the Docker [install docs](https://docs.docker.com/docker-for-windows/install/) for details.

![download Docker edge for mac](/images/docker-edge-for-windows-download.png)

### configure the VM
Once Docker is installed and running, open Settings by right-clicking the Docker tray icon and configure your VM with 4GB of memory in the Advanced settings tab. Click on Apply.

![configure Docker VM](/images/docker-vm-config-windows.png)

### enable Kubernetes
Now go to the Kubernetes tab in Settings to enable Kubernetes, and wait for the cluster to start. If there is no Kubernetes tab, you may need to [switch to Linux containers](https://docs.docker.com/docker-for-windows/#switch-between-windows-and-linux-containers) first.

![enable Kubernetes](/images/docker-edge-kubernetes-windows.png)

If you previously had minikube or GKE configured, switch your kubectl context to "docker-for-desktop" in a powershell or command window.

```sh
 kubectl config use-context docker-for-desktop
```

### monitor your cluster
At this point it is useful to monitor your kubernetes cluster. These PowerShell functions call `kubectl get` every 2 seconds.

```powershell
function watchall { while(1){ kubectl get pod,deploy --all-namespaces; start-sleep -seconds 2; clear }}
function watchfunctions { while(1){ kubectl get function,topic,pod,deploy; start-sleep -seconds 2; clear }}
```
Start by watching all namespaces to confirm that Kubernetes is running.
```
watchall
```
If your cluster shows signs of being unhealthy, use the "Reset Kubernetes Cluster" feature in Docker.
![reset Kubernetes](/images/docker-edge-kubernetes-reset-windows.png)


### install helm
[Helm](https://docs.helm.sh/using_helm/#installing-helm) is used to package and install resources for Kubernetes. Helm packages are called charts. After downloading the [helm CLI zip](https://storage.googleapis.com/kubernetes-helm/helm-v2.9.0-windows-amd64.zip) and extracting helm.exe to a directory in your path, configure helm by setting projectriff to the URL for the riff-charts repo.
```sh
helm repo add projectriff https://riff-charts.storage.googleapis.com
```
Update the repo and search for riff to confirm that the latest riff release is available.
```sh
helm repo update
helm search -l riff
```

### start the helm server (tiller)
```sh
helm init
```

Watch kubectl for the tiller-deploy pod to start running.

### install riff and kafka
Install riff and kafka together on the same `riff-system` namespace, with the release name `projectriff`. Use a NodePort for the HTTP gateway.

```sh
helm install projectriff/riff --name projectriff --namespace riff-system --set kafka.create=true --set httpGateway.service.type=NodePort
```

Watch the pods in the riff-system namespace. You may need to wait a minute for the container images to be pulled, and for zookeeper to start. It is normal for the kafka broker and the other riff components to fail and re-start while waiting.

### install the current riff CLI tool

A zip with the riff [CLI for windows](https://github.com/projectriff/riff/releases/download/v0.0.6/riff-windows-amd64.zip) is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Extract riff.exe and add it to a directory in your path.

## install invokers
Starting in v0.0.6, riff invoker resources are installed separately.

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
watchfunctions
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
