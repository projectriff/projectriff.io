---
title: "Getting started running on Minikube"
permalink: /docs/getting-started-with-knative-riff-on-minikube/
excerpt: "How to run Knative using **riff** on Minikube"
header:
  overlay_image: /images/minikube2.png
  overlay_filter: 0.4
  overlay_color: "#555"
redirect_from:
  - /docs/getting-started-on-minikube/
  - /docs/getting-started-on-docker-ce-edge-for-mac/
  - /docs/getting-started-on-docker-ce-edge-for-windows/
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
&& chmod +x docker-machine-driver-hyperkit \
&& sudo mv docker-machine-driver-hyperkit /usr/local/bin/ \
&& sudo chown root:wheel /usr/local/bin/docker-machine-driver-hyperkit \
&& sudo chmod u+s /usr/local/bin/docker-machine-driver-hyperkit
```

For Linux we suggest using the [kvm2](https://github.com/kubernetes/minikube/blob/master/docs/drivers.md#kvm2-driver) driver.

For additional details see the minikube [driver installation](https://github.com/kubernetes/minikube/blob/master/docs/drivers.md#hyperkit-driver) docs.


## create a Minikube cluster

```sh
minikube start --memory=8192 --cpus=4 \
--kubernetes-version=v1.10.5 \
--vm-driver=hyperkit \
--bootstrapper=kubeadm \
--extra-config=controller-manager.cluster-signing-cert-file="/var/lib/localkube/certs/ca.crt" \
--extra-config=controller-manager.cluster-signing-key-file="/var/lib/localkube/certs/ca.key" \
--extra-config=apiserver.admission-control="LimitRanger,NamespaceExists,NamespaceLifecycle,ResourceQuota,ServiceAccount,DefaultStorageClass,MutatingAdmissionWebhook"
```

To use the kvm2 driver for Linux specify `--vm-driver=kvm2`. Omitting the `--vm-driver` option will use the default driver.

Confirm that your kubectl context is pointing to the new cluster
```sh
kubectl config current-context
```

## install the riff CLI
The [riff CLI](https://github.com/projectriff/riff/tree/master/riff-cli) is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Once installed, check that the riff CLI version is 0.1.0 or later.

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

```
NAMESPACE          NAME                                       READY     STATUS      RESTARTS   AGE
default            square-00001-dg8t9                         0/1       Completed   0          1h
istio-system       istio-citadel-7bdc7775c7-q5sbs             1/1       Running     0          2h
istio-system       istio-cleanup-old-ca-q7m7s                 0/1       Completed   0          2h
istio-system       istio-egressgateway-795fc9b47-mnmfv        1/1       Running     0          2h
istio-system       istio-ingress-84659cf44c-9bs5t             1/1       Running     0          2h
istio-system       istio-ingressgateway-7d89dbf85f-bx52h      1/1       Running     0          2h
istio-system       istio-mixer-post-install-cc95r             0/1       Completed   0          2h
istio-system       istio-pilot-66f4dd866c-qtcgr               2/2       Running     0          2h
istio-system       istio-policy-76c8896799-wfv2n              2/2       Running     0          2h
istio-system       istio-sidecar-injector-645c89bc64-p48vc    1/1       Running     0          2h
istio-system       istio-statsd-prom-bridge-949999c4c-x6qf4   1/1       Running     0          2h
istio-system       istio-telemetry-6554768879-zbfg4           2/2       Running     0          2h
istio-system       knative-ingressgateway-5f5dc4b4cd-96jb7    1/1       Running     0          2h
knative-build      build-controller-5cb4f5cb67-8l9z4          1/1       Running     0          2h
knative-build      build-webhook-6b4c65546b-lxhsv             1/1       Running     0          2h
knative-eventing   controller-manager-7747d66d85-l7f6d        2/2       Running     2          2h
knative-eventing   eventing-controller-6cd984f789-vldfp       1/1       Running     0          2h
knative-eventing   eventing-webhook-7dfd9cfbd9-76sdx          1/1       Running     0          2h
knative-eventing   stub-clusterbus-866c95f68d-22cgp           2/2       Running     0          2h
knative-serving    activator-7f5b67b69c-h56wb                 2/2       Running     0          2h
knative-serving    controller-868ff6d485-qkgxp                1/1       Running     0          2h
knative-serving    webhook-6d9976c74f-t6nz6                   1/1       Running     0          2h
kube-system        etcd-minikube                              1/1       Running     0          2h
kube-system        kube-addon-manager-minikube                1/1       Running     0          2h
kube-system        kube-apiserver-minikube                    1/1       Running     2          2h
kube-system        kube-controller-manager-minikube           1/1       Running     0          2h
kube-system        kube-dns-86f4d74b45-5rlft                  3/3       Running     0          2h
kube-system        kube-proxy-9lsb5                           1/1       Running     0          2h
kube-system        kube-scheduler-minikube                    1/1       Running     0          2h
kube-system        kubernetes-dashboard-5498ccf677-rcj2f      1/1       Running     0          2h
kube-system        storage-provisioner                        1/1       Running     0          2h
```
There should be a couple of pods in the istio-system that have a "Completed" status. If there are pods with an "Error" status, as long as there is one pod with the same prefix with a "Completed" status, then everything should be fine.

## create a Kubernetes secret for pushing images to DockerHub
This step requires base64-encoded credentials for [DockerHub](https://hub.docker.com/). Run the following twice, replacing ??? with your docker username and password.

```
echo -n '???' | base64
```

Create a file called `dockerhub-push-credentials.yaml` using the yaml below, and inserting the two base64 values from above. 
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: push-credentials
  annotations:
    build.knative.dev/docker-0: https://index.docker.io/v1/
type: kubernetes.io/basic-auth
data:
  username: BASE64-USERNAME
  password: BASE64-PASSWORD
```

Apply the yaml to Kubernetes
```sh
kubectl apply -f dockerhub-push-credentials.yaml
```

### initialize the namespace
Use the riff CLI to initialize your namespace (if you plan on using a namespace other than `default` then substitute the name you want to use). This will create a serviceaccount that uses your specified secret, install a buildtemplate and label the namespace for automatic Istio sidecar injection.
```sh
riff namespace init default --secret push-credentials
```
## create a function
This step will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to your dockerhub repo. Replace the ??? with your docker username.

```sh
export DOCKER_ID=???
```
```sh
riff function create node square \
  --git-repo https://github.com/trisberg/node-fun-square.git \
  --artifact square.js \
  --image $DOCKER_ID/node-fun-square
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
export MINIKUBE_IP=$(minikube ip)
```
```sh
curl \
     -w '\n' \
     -H 'Host: square.default.example.com' \
     -H 'Content-Type: text/plain' \
     http://$MINIKUBE_IP:32380 \
     -d 10
```
For the input data of 10 above, the function should return 100

## delete the function
```
riff service delete square
```


