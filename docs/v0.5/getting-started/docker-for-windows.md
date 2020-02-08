---
id: docker-for-windows
title: Getting Started on Docker for Windows
sidebar_label: Docker for Windows
---

The following will help you get started running a riff function with Knative on Docker Community Edition for Windows.

## Install Docker

v0.5 of riff requires Kubernetes v1.15 or later. Docker Desktop requires [Hyper-V](https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/quick-start/enable-hyper-v#enable-the-hyper-v-role-through-settings) on Windows 10 Pro.

Download the latest _stable_ release from [Docker](https://docs.docker.com/docker-for-windows/install/). Kubernetes and the kubectl CLI are included.

![download Docker for Windows](/img/docker-for-windows-download.png)

### resize the VM

Once Docker is installed and running, open Settings by right-clicking the Docker tray icon and configure your VM with 5GB of memory and 4 CPUs in the Advanced settings tab. Click on Apply.

![configure Docker VM](/img/docker-vm-config-windows.png)

### allow sharing of the C: drive

In the Shared Drives settings, enable sharing for the C drive, and enter your Windows password when prompted. This will be used for persistent volume claims to provide cache storage during function builds.

![configure Docker VM](/img/docker-windows-shared-drives.png)

### enable Kubernetes

Enable Kubernetes in the Kubernetes tab, click on Apply, and wait for the installation to complete and the cluster to start. If there is no Kubernetes tab, you may need to [switch to Linux containers](https://docs.docker.com/docker-for-windows/#switch-between-windows-and-linux-containers) first.

![enable Kubernetes](/img/docker-kubernetes-windows.png)

Confirm that your kubectl context is pointing to "docker-desktop".

```powershell
kubectl config current-context
```

If you previously had a different cluster configured, switch your kubectl context to "docker-desktop" using a PowerShell or command window.

```powershell
kubectl config use-context docker-desktop
```

### monitor your cluster

At this point it is useful to monitor your Kubernetes cluster. If you have [git bash](https://gitforwindows.org/) installed, create a bash script called `watch`, with the following content.

```powershell
#!/bin/bash
ARGS="${@}"
clear;
while(true); do
  OUTPUT=`$ARGS`
  clear
  echo -e "${OUTPUT[@]}"
  sleep 1
done
```

Start by watching all namespaces to confirm that Kubernetes is running.

```powershell
watch kubectl get pod --all-namespaces
```

```
NAMESPACE     NAME                                     READY   STATUS    RESTARTS   AGE
docker        compose-6c67d745f6-gcjcl                 1/1     Running   0          19s
docker        compose-api-57ff65b8c7-sz7g4             1/1     Running   0          19s
kube-system   coredns-fb8b8dccf-5t7bx                  1/1     Running   1          90s
kube-system   coredns-fb8b8dccf-ltlwf                  1/1     Running   1          90s
kube-system   etcd-docker-desktop                      1/1     Running   0          23s
kube-system   kube-apiserver-docker-desktop            1/1     Running   0          39s
kube-system   kube-controller-manager-docker-desktop   1/1     Running   0          20s
kube-system   kube-proxy-6q844                         1/1     Running   0          89s
kube-system   kube-scheduler-docker-desktop            1/1     Running   0          32s
```

## Install kapp

[kapp](https://get-kapp.io/) is a simple deployment tool for Kubernetes. The riff runtime and its dependencies are provided as standard Kubernetes yaml files, that can be installed with kapp.

Download a recent binary for your platform from [github](https://github.com/k14s/kapp/releases).
Move it into a directory on your path, and make it executable.
Complete kapp installation instructions can be found [here](https://k14s.io/#install-from-github-release)

Validate the installation.

```powershell
kapp version
```

```
Client Version: 0.18.0

Succeeded
```

## Install ytt

[ytt](https://get-ytt.io/) is a tool for templating yaml. It can be used to apply changes to the distributed Kubernetes yamls files used to install riff.

Download a recent binary for your platform from [github](https://github.com/k14s/ytt/releases).
Move it into a directory on your path, and make it executable.
Complete ytt installation instructions can be found [here](https://k14s.io/#install-from-github-release)

Validate the installation.

```powershell
ytt version
```

```
Version: 0.23.0
```

## Install the riff CLI

A recent snapshot build of the riff [CLI for Windows](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.5.0/riff-windows-amd64.zip) can be downloaded from our [GCS].

Alternatively, clone the [riff CLI repo](https://github.com/projectriff/cli/), and run `make build install`. This will require a recent [go build environment](https://golang.org/doc/install#install).

Check that the riff CLI version is 0.5.0.

```powershell
riff --version
```

```
riff version 0.5.0 (f96cf2f5ca6fddfaf4716c0045f5f142da2d3828)
```

## Install riff Using kapp

riff can be installed with optional runtimes. The riff build system is always installed, and is required by each runtime.

> NOTE: If you have riff v0.4.0 installed then you must first uninstall that version. See [instructions](../../v0.4/getting-started/docker-for-windows.md#uninstalling) in the v0.4.0 documentation.

Create a namespace for kapp to store configuration:

```powershell
kubectl create ns apps
```

### install riff Build

To install riff build and it's dependencies:

```powershell
kapp deploy -n apps -a cert-manager -f https://storage.googleapis.com/projectriff/release/0.5.0/cert-manager.yaml
```

```powershell
kapp deploy -n apps -a kpack -f https://storage.googleapis.com/projectriff/release/0.5.0/kpack.yaml
```

```powershell
kapp deploy -n apps -a riff-builders -f https://storage.googleapis.com/projectriff/release/0.5.0/riff-builders.yaml
```

```powershell
kapp deploy -n apps -a riff-build -f https://storage.googleapis.com/projectriff/release/0.5.0/riff-build.yaml
```

### install Contour ingress controller

The Contour ingress controller can be used by both Knative and Core runtimes.

```powershell
# ytt is used to convert the ingress service to NodePort because Docker for Widows does not support `LoadBalancer` services.
ytt -f https://storage.googleapis.com/projectriff/release/0.5.0/contour.yaml -f https://storage.googleapis.com/projectriff/charts/overlays/service-nodeport.yaml --file-mark contour.yaml:type=yaml-plain | kapp deploy -n apps -a contour -f - -y
```

### install riff Knative Runtime

To install riff Knative Runtime and it's dependencies:

```powershell
kapp deploy -n apps -a knative -f https://storage.googleapis.com/projectriff/release/0.5.0/knative.yaml
```

```powershell
kapp deploy -n apps -a riff-knative-runtime -f https://storage.googleapis.com/projectriff/release/0.5.0/riff-knative-runtime.yaml
```

### verify riff installation

Resources may be missing if the corresponding runtime was not installed.

```powershell
riff doctor
```

```
NAMESPACE     STATUS
default       ok
riff-system   ok

RESOURCE                                     NAMESPACE     NAME       READ      WRITE
configmaps                                   riff-system   builders   allowed   n/a
configmaps                                   default       *          allowed   allowed
secrets                                      default       *          allowed   allowed
pods                                         default       *          allowed   n/a
pods/log                                     default       *          allowed   n/a
applications.build.projectriff.io            default       *          allowed   allowed
containers.build.projectriff.io              default       *          allowed   allowed
functions.build.projectriff.io               default       *          allowed   allowed
deployers.core.projectriff.io                default       *          missing   missing
processors.streaming.projectriff.io          default       *          missing   missing
streams.streaming.projectriff.io             default       *          missing   missing
inmemoryproviders.streaming.projectriff.io   default       *          missing   missing
kafkaproviders.streaming.projectriff.io      default       *          missing   missing
pulsarproviders.streaming.projectriff.io     default       *          missing   missing
adapters.knative.projectriff.io              default       *          allowed   allowed
deployers.knative.projectriff.io             default       *          allowed   allowed
```

### apply build credentials

Use the riff CLI to apply credentials to a container registry (if you plan on using a namespace other than `default` add the `--namespace` flag). Replace the ??? with your docker username.

```powershell
riff credential apply my-creds --set-default-image-prefix --docker-hub ???
```

You will be prompted to provide the password.

> On Windows, a known issue prevents the password prompt from working in git bash. Use the Windows PowerShell or Command terminal instead.

## Create a function from a GitHub repo

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

> Due to differences between Windows and Linux file permissions, local builds are not supported on Windows. We suggest building from a git repository as a workaround.

## Create a Knative deployer

The [Knative Runtime](../runtimes/knative.md) is only available on clusters with Knative installed. Knative deployers run riff workloads using Knative resources which provide auto-scaling (including scale-to-zero) based on HTTP request traffic, and routing.

```powershell
riff knative deployer create knative-square --function-ref square --ingress-policy External --tail
```

After the deployer is created, you can see the hostname by listing deployers.

```powershell
riff knative deployer list
```

```
NAME             TYPE       REF      HOST                                 STATUS   AGE
knative-square   function   square   knative-square.default.example.com   Ready    28s
```

### invoke the function

Knative configures HTTP routes on the ingress controller. Requests are routed by hostname.

Look up the nodePort for the ingress gateway; you should see a port value like `30086`.

```powershell
$INGRESS_PORT = kubectl get svc envoy-external --namespace projectcontour `
  --output 'jsonpath={.spec.ports[?(@.port==80)].nodePort}'

$INGRESS_PORT
```

Invoke the function by POSTing to the ingress gateway on the nodePort, passing hostname and content-type as headers.

```powershell
curl http://localhost:$INGRESS_PORT/ `
  -H 'Host: knative-square.default.example.com' `
  -H 'Content-Type: application/json' `
  -d 7
```

```
49
```

The command above uses OSS `curl` which can be installed from an Admin PowerShell using `choco install curl` (assumes [Chocolatey](https://chocolatey.org/)).
Remove the built-in PowerShell `curl` alias with `Remove-item alias:curl`.

## Delete the function and deployer

```powershell
riff knative deployer delete knative-square
riff function delete square
```

## Uninstalling riff

You can reset the Kubernetes cluster (this will remove all state including riff).

![reset Kubernetes](/img/docker-kubernetes-reset-windows.png)

Alternatively, you can use the following commands to uninstall riff:

### remove any riff resources

```powershell
kubectl delete riff --all-namespaces --all
```

### remove riff Streaming Runtime

```powershell
kapp delete -n apps -a riff-streaming-runtime
```

```powershell
kapp delete -n apps -a keda
```

### remove riff Core Runtime (if installed)

```powershell
kapp delete -n apps -a riff-core-runtime
```

### remove riff Knative Runtime (if installed)

```powershell
kubectl delete knative --all-namespaces --all
```

```powershell
kapp delete -n apps -a riff-knative-runtime
```

```powershell
kapp delete -n apps -a knative
```

### remove Contour

```powershell
kapp delete -n apps -a contour
```

### remove riff Build

```powershell
kapp delete -n apps -a riff-build
```

```powershell
kapp delete -n apps -a riff-builders
```

```powershell
kapp delete -n apps -a kpack
```

```powershell
kapp delete -n apps -a cert-manager
```
