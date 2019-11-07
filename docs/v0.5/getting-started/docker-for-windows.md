---
id: docker-for-windows
title: Getting Started on Docker for Windows
sidebar_label: Docker for Windows
---

The following will help you get started running a riff function with Knative on Docker Community Edition for Windows.

## Install Docker
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

Confirm that your kubectl context is pointing to "docker-desktop".

```sh
kubectl config current-context
```

If you previously had a different cluster configured, switch your kubectl context to "docker-desktop" using a PowerShell or command window.

```sh
kubectl config use-context docker-desktop
```

### monitor your cluster
At this point it is useful to monitor your Kubernetes cluster. If you have [git bash](https://gitforwindows.org/) installed, create a bash script called `watch`, with the following content.

```sh
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

## Install the helm CLI

[Helm](https://helm.sh) is a popular package manager for Kubernetes. The riff runtime and its dependencies are provided as Helm charts.

Download a recent release of the [Helm v2 CLI](https://github.com/helm/helm/releases/) for your platform.
(Download version 2.13 or later, Helm v3 is currently in beta and has not been tested for compatibility with riff).
Unzip and copy the Helm CLI executable to a directory on your path.

Initialize the Helm Tiller server in your cluster.
```sh
kubectl create serviceaccount tiller -n kube-system
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount kube-system:tiller
helm init --wait --service-account tiller
```

Validate the installation.
```sh
helm version
```
```
Client: &version.Version{SemVer:"v2.16.0", GitCommit:"618447cbf203d147601b4b9bd7f8c37a5d39fbb4", GitTreeState:"clean"}
Server: &version.Version{SemVer:"v2.16.0", GitCommit:"618447cbf203d147601b4b9bd7f8c37a5d39fbb4", GitTreeState:"clean"}
```

> Please see the [Helm documentation](https://helm.sh/docs/using_helm/#securing-your-helm-installation) for additional Helm security configuration.

## Build the riff CLI

Clone the [riff CLI repo](https://github.com/projectriff/cli/), and run `make build install`. This will require a recent [go build environment](https://golang.org/doc/install#install).

Check that the riff CLI version is 0.5.0-snapshot.
```sh
riff --version
```
```
riff version 0.5.0-snapshot (443fc9125dd6d8eecd1f7e1a13fa93b88fd4f972)
```

Most riff CLI commands below are formatted for PowerShell which has a different way of interpreting colors. Disable riff CLI colors with the following command.

```powershell
Add-Content -Path $env:USERPROFILE\.riff.yaml -Value 'no-color: true'
```

## Install riff using Helm

Load the projectriff charts

```powershell
helm repo add projectriff https://projectriff.storage.googleapis.com/charts/releases
helm repo update
```

riff can be installed with optional runtimes. The riff build system is always installed, and is required by each runtime.

If using the Knative runtime, first install Istio:

```powershell
helm install projectriff/istio --name istio --namespace istio-system --set gateways.istio-ingressgateway.type=NodePort --wait --devel
```

Install riff with both the Core and Knative runtimes. To omit or include other runtimes, edit the relevant lines below.

```powershell
helm install projectriff/riff --name riff `
  --set tags.core-runtime=true `
  --set tags.knative-runtime=true `
  --set tags.streaming-runtime=false `
  --wait --devel
```

> NOTE: After installing the Streaming runtime, configure Kafka with a [KafkaProvider](/docs/v0.5/runtimes/streaming#kafkaprovider).

Verify the riff install. Resources may be missing if the corresponding runtime was not installed.

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

The [Knative Runtime](../runtimes/knative.md) is only available on clusters with Istio and Knative installed. Knative deployers run riff workloads using Knative resources which provide auto-scaling (including scale-to-zero) based on HTTP request traffic, and routing.

```powershell
riff knative deployer create knative-square --function-ref square --tail
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

Knative configures HTTP routes on the istio-ingressgateway. Requests are routed by hostname.

Look up the nodePort for the ingressgateway; you should see a port value like `30086`.

```powershell
$INGRESS_PORT = kubectl get svc istio-ingressgateway --namespace istio-system `
  --output 'jsonpath={.spec.ports[?(@.port==80)].nodePort}'

$INGRESS_PORT
```

Invoke the function by POSTing to the ingressgateway on the nodePort, passing hostname and content-type as headers.

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

### create a Core deployer

The Core Runtime runs riff workloads by creating Kubernetes built-in [deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) and [service](https://kubernetes.io/docs/concepts/services-networking/service/#service-resource) resources.

```sh
riff core deployer create k8s-square --function-ref square --tail
```

After the deployer is created, you can see the service name by listing deployers.

```sh
riff core deployer list
```

```
NAME         TYPE       REF      SERVICE               STATUS   AGE
k8s-square   function   square   k8s-square-deployer   Ready    21s
```

### invoke the function

In a separate terminal, start port-forwarding to the ClusterIP service created by the deployer.

```sh
kubectl port-forward service/k8s-square-deployer 8080:80
```
```
Forwarding from 127.0.0.1:8080 -> 8080
Forwarding from [::1]:8080 -> 8080
```

Make a POST request to invoke the function using the port assigned above.

```sh
curl http://localhost:8080/ `
-H 'Content-Type: application/json' `
-d 8
```
```
64
```

Note that unlike Knative, the Core runtime will not scale deployments down to zero.

## Delete the function and deployers

```sh
riff knative deployer delete knative-square
riff core deployer delete k8s-square
riff function delete square
```

## Uninstalling and reinstalling
If you need to upgrade or reinstall riff, we recommend resetting the Kubernetes cluster first. To do this, click `Reset Kubernetes Cluster...` in the Reset tab in Docker Settings.

![reset Kubernetes](/img/docker-kubernetes-reset-windows.png)
