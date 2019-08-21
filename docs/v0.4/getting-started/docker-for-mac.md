---
id: docker-for-mac
title: Getting started on Docker for Mac
sidebar_label: Docker for Mac
---

The following will help you get started running a riff function with Knative on Docker Community Edition for Mac.

## Install Docker

Kubernetes and the kubectl CLI are now included with [Docker Community Edition for Mac](https://store.docker.com/editions/community/docker-ce-desktop-mac).

![download Docker for mac](/img/docker-for-mac-download.png)

### resize the VM

Once Docker is installed and running, use the Preferences feature in the Docker menu to open Advanced settings and configure your VM with 4GB of memory and 4 CPUs. Click on Apply & Restart.
![configure Docker VM](/img/docker-for-mac-vm-config-4gb.png)

### enable Kubernetes

Now enable Kubernetes, and wait for the cluster to start.
![enable Kubernetes](/img/docker-for-mac-kubernetes.png)

Confirm that your kubectl context is pointing to `docker-desktop`

```sh
kubectl config current-context
```

## Install Helm

[Helm](https://helm.sh) is a popular package manager for Kubernetes. The riff runtime and its dependencies are provided as Helm charts.

Download and install the latest [Helm 2.x client CLI](https://helm.sh/docs/using_helm/#installing-helm) for your platform. (Helm 3 is currently in alpha and has not been tested for compatibility with riff)

After installing the Helm CLI, initialize the Helm Tiller in our cluster.

```sh
kubectl create serviceaccount tiller -n kube-system
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount kube-system:tiller
helm init --wait --service-account tiller
```

> NOTE: Please see the [Helm documentation](https://helm.sh/docs/using_helm/#securing-your-helm-installation) for additional Helm security configuration.

## Install the riff CLI

The [riff CLI](https://github.com/projectriff/cli/) is available to download from our GitHub [releases](https://github.com/projectriff/cli/releases) page. Once installed, check that the riff CLI version is 0.4.0 or later.

```sh
riff --version
```
```
riff version 0.4.0 (d1b042f4247d8eb01ee0b9e984926028a2844fe8)
```

At this point it is useful to monitor your cluster using a utility like `watch`. To install on a Mac

```sh
brew install watch
```

Watch pods in a separate terminal.

```sh
watch -n 1 kubectl get pod --all-namespaces
```

## Install riff using Helm

Load the projectriff charts

```ah
helm repo add projectriff https://projectriff.storage.googleapis.com/charts/releases
helm repo update
```

riff can be installed with or without Knative. The riff [Core runtime](../runtimes/core.md) is available in both environments, however, the riff [Knative Runtime](../runtimes/knative.md) is only available if Knative is installed.

To install riff with Knative and Istio:

```sh
helm install projectriff/istio --name istio --namespace istio-system --set gateways.istio-ingressgateway.type=NodePort --wait
helm install projectriff/riff --name riff --set knative.enabled=true
```

Alternatively, install riff without Knative or Istio:

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

Use the riff CLI to apply credentials for a container registry. If you plan on using a namespace other than `default` add the `--namespace` flag. Replace the ??? with your docker username.

```sh
DOCKER_ID=???
```

```sh
riff credential apply my-creds --docker-hub $DOCKER_ID --set-default-image-prefix
```

You will be prompted to provide the password.

## Create a function

This step will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to your Docker Hub repo.

```sh
riff function create square \
  --git-repo https://github.com/projectriff-samples/node-square  \
  --artifact square.js \
  --tail
```

After the function is created, you can see the built image by listing functions.

```sh
riff function list
```

```
NAME     LATEST IMAGE                                                                                                ARTIFACT    HANDLER   INVOKER   STATUS   AGE
square   index.docker.io/$DOCKER_ID/square@sha256:ac089ca183368aa831597f94a2dbb462a157ccf7bbe0f3868294e15a24308f68   square.js   <empty>   <empty>   Ready    1m13s
```

## Create a Knative deployer

The [Knative Runtime](../runtimes/knative.md) is only available on clusters with Istio and Knative installed. Knative deployers run riff workloads using Knative resources which provide auto-scaling (including scale-to-zero) based on HTTP request traffic, and routing.

```sh
riff knative deployer create knative-square --function-ref square --tail
```

After the deployer is created, you can see the hostname by listing deployers.

```sh
riff knative deployer list
```
```
NAME             TYPE       REF      HOST                                 STATUS   AGE
knative-square   function   square   knative-square.default.example.com   Ready    28s
```

### invoke the function

Knative configures HTTP routes on the istio-ingressgateway. Requests are routed by hostname.

Look up the nodePort for the ingressgateway; you should see a port value like `30195`.

```sh
INGRESS_PORT=$(kubectl get svc istio-ingressgateway --namespace istio-system --output 'jsonpath={.spec.ports[?(@.port==80)].nodePort}')
echo $INGRESS_PORT
```

Invoke the function by POSTing to the ingressgateway, passing the hostname and content-type as headers.

```sh
curl http://localhost:$INGRESS_PORT/ -w '\n' \
-H 'Host: knative-square.default.example.com' \
-H 'Content-Type: application/json' \
-d 7
```
```
49
```

## Create a Core deployer

The [Core runtime](../runtimes/core.md) is available on all riff clusters. It deploys riff workloads as "vanilla" Kubernetes deployments and services.

```sh
riff core deployer create k8s-square --function-ref square --tail
```

After the deployer is created, you can see the service name by listing deployers.

```sh
riff core deployers list
```
```
NAME         TYPE       REF      SERVICE               STATUS   AGE
k8s-square   function   square   k8s-square-deployer   Ready    16s
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
curl http://localhost:8080/ -w '\n' \
-H 'Content-Type: application/json' \
-d 8
```
```
64
```

> NOTE: unlike Knative, the Core runtime will not scale deployments down to zero.

## Cleanup

```sh
riff knative deployer delete knative-square
riff core deployer delete k8s-square
riff function delete square
```

## Uninstalling and reinstalling
If you need to upgrade riff, we recommend resetting the Kubernetes cluster first, and then reinstalling.

![reset Kubernetes using Preferences/Reset](/img/docker-for-mac-reset-kubernetes.png)
