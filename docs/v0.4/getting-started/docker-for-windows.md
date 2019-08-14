---
id: docker-for-windows
title: Getting Started on Docker for Windows
sidebar_label: Docker for Windows
---

# Getting started on Docker for Windows

The following will help you get started running a riff function with Knative on Docker Community Edition for Windows.

### TL;DR

1. Install the latest release of Docker for Windows
1. Configure the cluster and enable Kubernetes
1. Install kubectl, helm and the riff CLIs
1. Install Knative using the riff CLI
1. Create a function
1. Invoke the function

### install docker
Kubernetes and the kubectl CLI are now included with [Docker Desktop for Windows](https://docs.docker.com/docker-for-windows/install/). Docker Desktop for Windows requires [Hyper-V](https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/quick-start/enable-hyper-v#enable-the-hyper-v-role-through-settings) on Windows 10 Pro.

![download Docker for mac](/img/docker-for-windows-download.png)

### resize the VM
Once Docker is installed and running, open Settings by right-clicking the Docker tray icon and configure your VM with 4GB of memory and 4 CPUs in the Advanced settings tab. Click on Apply.

![configure Docker VM](/img/docker-vm-config-windows.png)

### allow sharing of the C: drive

In the Shared Drives settings, enable sharing for the C drive, and enter your Windows password when prompted. This will be used for persistent volume claims to provide cache storage during function builds.

![configure Docker VM](/img/docker-windows-shared-drives.png)

### enable Kubernetes
Enable Kubernetes in the Kubernetes tab, click on Apply, and wait for the installation to complete and the cluster to start. If there is no Kubernetes tab, you may need to [switch to Linux containers](https://docs.docker.com/docker-for-windows/#switch-between-windows-and-linux-containers) first.

![enable Kubernetes](/img/docker-kubernetes-windows.png)

If you previously had minikube or GKE configured, switch your kubectl context to "docker-desktop" using a PowerShell or command window.

```sh
kubectl config use-context docker-desktop
```

### monitor your cluster
At this point it is useful to monitor your Kubernetes cluster. This PowerShell function will call `kubectl get` every 3 seconds.

```powershell
function watchpods { while(1){ kubectl get pod --all-namespaces; start-sleep -seconds 3; clear }}
```

Start by watching all namespaces to confirm that Kubernetes is running.

```
watchpods
```
```
NAMESPACE     NAME                                     READY   STATUS    RESTARTS   AGE
docker        compose-7cf768cb84-nhl49                 1/1     Running   0          97s
docker        compose-api-579965d67f-j7nzj             1/1     Running   0          97s
kube-system   coredns-86c58d9df4-bxmr9                 1/1     Running   0          2m41s
kube-system   coredns-86c58d9df4-wqldh                 1/1     Running   0          2m41s
kube-system   etcd-docker-desktop                      1/1     Running   0          116s
kube-system   kube-apiserver-docker-desktop            1/1     Running   0          97s
kube-system   kube-controller-manager-docker-desktop   1/1     Running   0          108s
kube-system   kube-proxy-7n5v8                         1/1     Running   0          2m41s
kube-system   kube-scheduler-docker-desktop            1/1     Running   0          102s
```

## install the helm CLI

[Helm](https://helm.sh) is a popular package manager for Kubernetes. The riff runtime and its dependencies are provided as Helm charts.

Download and install the latest [Helm 2.x release](https://github.com/helm/helm/releases) for your platform. (Helm 3 is currently in alpha and has not been tested for compatibility with riff)

After installing the Helm CLI, we need to initialize the Helm Tiller in our cluster.

> NOTE: Please see the Helm documentation for how to [secure the connection to Tiller within your cluster](https://helm.sh/docs/using_helm/#securing-your-helm-installation).

```powershell
kubectl create serviceaccount tiller -n kube-system
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount kube-system:tiller
helm init --wait --service-account tiller
```

### install the riff CLI
A zip with the riff CLI for Windows is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Extract riff.exe and add it to a directory in your path. Once installed, check that the riff CLI version is 0.4.0 or later.

```powershell
riff --version
```
```
riff version 0.4.0-snapshot (2c4a47d0872283b629ea478916c43d831e75ea1f)
```


## install riff using Helm

Load the projectriff charts

```powershell
helm repo add projectriff https://projectriff.storage.googleapis.com/charts/releases
helm repo update
```

riff can be installed with or without Knative. The riff core runtime is available in both environments, however, the riff knative runtime is only available if
Knative is installed.

To install riff with Knative and Istio:

```powershell
helm install projectriff/istio --name istio --namespace istio-system --set gateways.istio-ingressgateway.type=NodePort --wait
helm install projectriff/riff --name riff --set knative.enabled=true
```

Install riff without Knative or Istio:

```powershell
helm install projectriff/riff --name riff
```

Verify the riff install. 

```powershell
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

Use the riff CLI to apply credentials to a container registry (if you plan on using a namespace other than `default` add the `--namespace` flag). Replace the ??? with your docker username.

```powershell
DOCKER_ID=???
```

```powershell
riff credential apply my-creds --docker-hub $DOCKER_ID --set-default-image-prefix
```

You will be prompted to provide the password.

## create a function from a GitHub repo

This riff command (formatted for PowerShell) will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to your dockerhub repo.


```powershell
riff function create square `
  --git-repo https://github.com/projectriff-samples/node-square  `
  --artifact square.js `
  --tail
```

After the function is created, you can get the built image by listing functions.

```powershell
riff function list
```

```
NAME     LATEST IMAGE                                                                                                ARTIFACT    HANDLER   INVOKER   STATUS   AGE
square   index.docker.io/$DOCKER_ID/square@sha256:ac089ca183368aa831597f94a2dbb462a157ccf7bbe0f3868294e15a24308f68   square.js   <empty>   <empty>   Ready    1m13s
```

## create a deployer

Deployers take a built function and deploy it to a riff runtime. There are two runtimes: core and knative. The core runtime is always available, while the knatve runtime is only available on clusters with Istio and Knative installed.


### create a core deployer

```sh
riff core deployer create square --function-ref square --tail
```

After the deployer is created, you can get the service by listing deployers.

```sh
riff core deployer list
```

```
NAME     TYPE       REF      SERVICE           STATUS   AGE
square   function   square   square-deployer   Ready    10s
```


## delete the function and deployer

```sh
riff core deployer delete square
riff function delete square
```

### Note
Due to differences between Windows and Linux file permissions, local builds are not supported on Windows. We suggest building from a git repository as a workaround.

## uninstalling and reinstalling
If you need to upgrade or reinstall riff, we recommend resetting the Kubernetes cluster first. To do this, click `Reset Kubernetes Cluster...` in the Reset tab in Docker Settings.

![reset Kubernetes](/img/docker-kubernetes-reset-windows.png)
