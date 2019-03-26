---
layout: doc
title: "Getting started on Docker for Windows"
short_title: on Docker for Windows
permalink: /docs/getting-started/docker-for-windows/
excerpt: "How to run Knative using **riff** on Docker Community Edition for Windows"
header:
  overlay_image: /images/docker-for-windows-edge.png
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

1. Install the latest release of Docker for Windows (Edge)
2. Configure the cluster and enable Kubernetes
3. Install Knative using the riff CLI
4. Create a function
5. Invoke the function

### install docker edge
Kubernetes and the kubectl CLI are now included with [Docker Desktop for Windows](https://docs.docker.com/docker-for-windows/install/). Docker Desktop for Windows requires [Hyper-V](https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/quick-start/enable-hyper-v#enable-the-hyper-v-role-through-settings) on Windows 10 Pro. We recommend downloading the latest Edge version which comes with a more recent release of Kubernetes.

![download Docker edge for mac](/images/docker-edge-for-windows-download.png)

### configure the VM
Once Docker is installed and running, open Settings by right-clicking the Docker tray icon and configure your VM with 5GB of memory in the Advanced settings tab. Click on Apply.

![configure Docker VM](/images/docker-vm-config-windows.png)

### enable Kubernetes
Now go to the Kubernetes tab in Settings to enable Kubernetes, and wait for the cluster to start. If there is no Kubernetes tab, you may need to [switch to Linux containers](https://docs.docker.com/docker-for-windows/#switch-between-windows-and-linux-containers) first.

![enable Kubernetes](/images/docker-edge-kubernetes-windows.png)

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
docker        compose-7cf768cb84-4wrm8                 1/1     Running   0          3m38s
docker        compose-api-579965d67f-7cpsx             1/1     Running   0          3m38s
kube-system   coredns-86c58d9df4-9l2jh                 1/1     Running   0          4m44s
kube-system   coredns-86c58d9df4-c7sdq                 1/1     Running   0          4m44s
kube-system   etcd-docker-desktop                      1/1     Running   0          3m41s
kube-system   kube-apiserver-docker-desktop            1/1     Running   0          3m48s
kube-system   kube-controller-manager-docker-desktop   1/1     Running   0          3m39s
kube-system   kube-proxy-sp6nn                         1/1     Running   0          4m44s
kube-system   kube-scheduler-docker-desktop            1/1     Running   0          3m51s
```

### install the riff CLI
A zip with the riff CLI for Windows is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Extract riff.exe and add it to a directory in your path. Once installed, validate the version.

```powershell
riff version
```

```
Version
  riff cli: 0.3.0-snapshot (6cdd55bbc2281c63d00e028ed8e5bccfef17cd52)
```

## install Knative using the riff CLI

Install Knative, watching the pods until everything is running (this could take a couple of minutes). The `--node-port` option replaces LoadBalancer type services with NodePort.

```powershell
riff system install --node-port
```

You should see pods running in namespaces istio-system, knative-build, knative-serving, and knative-eventing as well as kube-system when the system is fully operational. 

```
NAMESPACE          NAME                                            READY   STATUS              RESTARTS   AGE
docker             compose-7cf768cb84-4wrm8                        1/1     Running             0          9m50s
docker             compose-api-579965d67f-7cpsx                    1/1     Running             0          9m50s
istio-system       cluster-local-gateway-547467ccf6-rlfd5          1/1     Running             0          3m8s
istio-system       istio-citadel-7d64db8bcf-xfjb9                  1/1     Running             0          3m19s
istio-system       istio-cleanup-secrets-kmphv                     0/1     Completed           0          3m32s
istio-system       istio-egressgateway-6ddf4c8bd6-t2zkn            1/1     Running             0          3m21s
istio-system       istio-galley-7dd996474-72jcg                    1/1     Running             0          3m21s
istio-system       istio-ingressgateway-84b89d647f-955l6           1/1     Running             0          3m21s
istio-system       istio-pilot-54b76645df-4kfk2                    2/2     Running             0          3m2s
istio-system       istio-policy-5c4d9ff96b-dsrf4                   2/2     Running             0          3m21s
istio-system       istio-sidecar-injector-6977b5cf5b-vgrcv         1/1     Running             0          3m16s
istio-system       istio-statsd-prom-bridge-b44b96d7b-7tmhd        1/1     Running             0          3m22s
istio-system       istio-telemetry-7676df547f-4h2jt                2/2     Running             0          3m21s
knative-build      build-controller-7b8987d675-bvsv4               1/1     Running             0          2m29s
knative-build      build-webhook-74795c8696-hm8f7                  1/1     Running             0          2m29s
knative-eventing   eventing-controller-864657d8d4-2fmbt            0/1     ContainerCreating   0          72s
knative-eventing   in-memory-channel-controller-f794cc9d8-j6d8s    0/1     ContainerCreating   0          72s
knative-eventing   in-memory-channel-dispatcher-8595c7f8d7-p72gc   0/2     Init:0/1            0          72s
knative-eventing   webhook-5d76776d55-rwsp8                        0/1     ContainerCreating   0          72s
knative-serving    activator-7c8b59d78-q845q                       2/2     Running             1          2m22s
knative-serving    autoscaler-666c9bfcc6-kpdmq                     2/2     Running             1          2m22s
knative-serving    controller-799cd5c6dc-wdtjh                     1/1     Running             0          2m21s
knative-serving    webhook-5b66fdf6b9-sbkvd                        1/1     Running             0          2m21s
kube-system        coredns-86c58d9df4-9l2jh                        1/1     Running             0          10m
kube-system        coredns-86c58d9df4-c7sdq                        1/1     Running             0          10m
kube-system        etcd-docker-desktop                             1/1     Running             0          9m53s
kube-system        kube-apiserver-docker-desktop                   1/1     Running             0          10m
kube-system        kube-controller-manager-docker-desktop          1/1     Running             1          9m51s
kube-system        kube-proxy-sp6nn                                1/1     Running             0          10m
kube-system        kube-scheduler-docker-desktop                   1/1     Running             1          10m
```

### initialize the namespace and provide credentials for pushing images to DockerHub

Use the riff CLI in Windows PowerShell to initialize your namespace (if you plan on using a namespace other than `default` then substitute the name you want to use).

This will create a serviceaccount and a secret with the provided credentials and install a buildtemplate. Replace the ??? with your docker username.

```powershell
$Env:DOCKER_ID='???'
```
```powershell
riff namespace init default --dockerhub $Env:DOCKER_ID
```

You will be prompted to provide the password.

```
Initializing namespace "default"

Enter password for user "???"
Creating secret "push-credentials" with basic authentication to server "https://index.docker.io/v1/" for user "???"
Creating serviceaccount "riff-build" using secret "push-credentials" in namespace "default"
Setting default image prefix to "docker.io/???" for namespace "default"

riff namespace init completed successfully
```

## create a function

This PowerShell command will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to your dockerhub repo.

```powershell
riff function create square `
  --git-repo https://github.com/projectriff-samples/node-square `
  --image $Env:DOCKER_ID/square `
  --artifact square.js `
  --verbose
```

## invoke the function

```powershell
riff service invoke square --json -- -w '\n' -d 8
```

## uninstalling and reinstalling
If you need to upgrade or reinstall riff, we recommend resetting the Kubernetes cluster first. To do this, click `Reset Kubernetes Cluster...` in the Reset tab in Docker Settings.

![reset Kubernetes](/images/docker-edge-kubernetes-reset-windows.png)
