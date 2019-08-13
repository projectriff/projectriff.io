---
layout: doc
title: "Getting started on Docker for Windows"
short_title: on Docker for Windows
permalink: /docs/getting-started/docker-for-windows/
excerpt: "How to run Knative using **riff** on Docker Community Edition for Windows"
header:
  overlay_image: /images/docker-for-windows.png
  overlay_filter: 0.4
  overlay_color: "#555"
redirect_from:
- /docs/getting-started-on-docker-ce-edge-for-windows/
categories:
- getting-started
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

![download Docker for mac](/images/docker-for-windows-download.png)

### resize the VM
Once Docker is installed and running, open Settings by right-clicking the Docker tray icon and configure your VM with 4GB of memory and 4 CPUs in the Advanced settings tab. Click on Apply.

![configure Docker VM](/images/docker-vm-config-windows.png)

### allow sharing of the C: drive

In the Shared Drives settings, enable sharing for the C drive, and enter your Windows password when prompted. This will be used for persistent volume claims to provide cache storage during function builds.

![configure Docker VM](/images/docker-windows-shared-drives.png)

### enable Kubernetes
Enable Kubernetes in the Kubernetes tab, click on Apply, and wait for the installation to complete and the cluster to start. If there is no Kubernetes tab, you may need to [switch to Linux containers](https://docs.docker.com/docker-for-windows/#switch-between-windows-and-linux-containers) first.

![enable Kubernetes](/images/docker-kubernetes-windows.png)

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

```sh
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

### apply build credentials

Use the riff CLI to apply credentials to a container registry (if you plan on using a namespace other than `default` add the `--namespace` flag). Replace the ??? with your docker username.

```sh
DOCKER_ID=???
```

```sh
riff credential apply my-creds --docker-hub $DOCKER_ID
```

You will be prompted to provide the password.

## create a function from a GitHub repo

This riff command (formatted for PowerShell) will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to your dockerhub repo.

```powershell
riff function create square `
  --git-repo https://github.com/projectriff-samples/node-square `
  --artifact square.js `
  --verbose
```

## invoke the function
```powershell
riff service invoke square --json -- -w '\n' -d 8
```

#### result
```
curl http://localhost:31380/ -H 'Host: square.default.example.com' -H 'Content-Type: application/json' -w '\n' -d 8
64
```

## create a function from code in a local directory

You can use riff to build functions from source in a local directory, instead of first committing the code to a repo on GitHub.

For this to work with Docker Hub from Windows, a small workaround is required to support the multiple ways the Docker Hub registry can be referenced.

After being prompted for you docker credentials you should see 2 entries for docker.io:

```powershell
$dockerid = Read-Host "Please enter your Docker ID: "
$password = Read-Host -assecurestring "Please enter your password: "
echo $('{"ServerURL": "https://index.docker.io", "Username": "' +  $dockerid + '", "Secret": "' + [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)) + '"}') | docker-credential-wincred store
docker-credential-wincred list
```

#### result
```
{"https://index.docker.io":"YOUR_USERNAME","https://index.docker.io/v1/":"YOUR_USERNAME"}
```

### create the function

Using PowerShell in a new directory with a single file called `square.js`

#### square.js
```js
module.exports = (x) => `the square of ${x} is ${x**2}`
```

#### delete the old square function and create a new one
```powershell
riff service delete square

riff function create square `
  --local-path . `
  --artifact square.js `
  --verbose
```

#### invoke the function
```powershell
riff service invoke square --json -- -w '\n' -d 8
```

#### result
```
curl http://localhost:31380/ -H 'Host: square.default.example.com' -H 'Content-Type: application/json' -w '\n' -d 8
the square of 8 is 64
```

### Note
Due to differences between Windows and Linux file permissions, **Command invoker** functions which depend on file permissions will not work when built locally on Windows. We suggest building from a git repository as a workaround.

## uninstalling and reinstalling
If you need to upgrade or reinstall riff, we recommend resetting the Kubernetes cluster first. To do this, click `Reset Kubernetes Cluster...` in the Reset tab in Docker Settings.

![reset Kubernetes](/images/docker-kubernetes-reset-windows.png)
