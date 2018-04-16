---
title: "Getting started on GKE"
permalink: /docs/getting-started-on-gke/
excerpt: "How to run **riff** on Google Kubernetes Engine"
header:
  overlay_image: /images/gke.png
  overlay_filter: 0.4
  overlay_color: "#555"
redirect_from:
  - /docs/
---

The following will help you get started on GKE with [RBAC](https://kubernetes.io/docs/admin/authorization/rbac/).  

### TL;DR
1. select a Project in the Google Cloud console, install gcloud and kubectl
2. create a GKE cluster
3. configure credentials to target the GKE cluster from kubectl
4. remove the CPU request limit for containers in the new cluster
5. install helm
6. install kafka and riff on the GKE cluster using a helm chart
7. install Docker and create a Docker ID
8. build one of the sample functions
9. apply the function and topic resource definitions to Kubernetes
10. send an event to the topic to trigger the function

> **NOTE**: The Kubernetes community is promoting the use of RBAC for all clusters.
Starting with with Kubernetes v1.8.x the default for GKE is to run with RBAC enabled.
The following instructions assume that your cluster is running with RBAC enabled.
It is still possible to install riff without RBAC roles by adding a `--set rbac.create=false` option when installing the riff chart.

### create a Google Cloud project
A project is required to consume any Google Cloud services, including GKE clusters. When you log into the [console](https://console.cloud.google.com/) you can select or create a project from the dropdown at the top.

### install gcloud
Follow the [quickstart instructions](https://cloud.google.com/sdk/docs/quickstarts) to install the [Google Cloud SDK](https://cloud.google.com/sdk/) which includes the `gcloud` CLI. You may need to add the `google-cloud-sdk/bin` directory to your path. Once installed, `gcloud init` will open a browser to start an oauth flow and configure gcloud to use your project.

```sh
gcloud init
```

### install kubectl
[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. It is used to manage minikube as well as hosted Kubernetes clusters like GKE. If you don't already have kubectl on your machine, you can use gcloud to install it.

```sh
gcloud components install kubectl
```

### create a GKE cluster
Look for [Kubernetes Engine](https://console.cloud.google.com/kubernetes/) in the console, and create a new cluster. Select a Cluster Version of 1.8+ or later with "Legacy Authorization" disabled to enable RBAC. The minimum configuration for riff on GKE is single node cluster with 2 vCPUs and 7.5GB memory.

![small GKE cluster in console](/images/gke-small-cluster.png)

### configure credentials to target the GKE cluster
Once the cluster has been created, you will see a `Connect` button in the console. Run the first command `gcloud container clusters get-credentials ...` to fetch the credentials and add a new context for kubectl. Your kubectl context will be switched to the new cluster.

```sh
kubectl config current-context
```

### remove CPU request limit
Remove the GKE default request of 0.1 CPU's per container which limits how many containers your cluster is allowed to schedule (effectively 10 per vCPU).

```sh
kubectl delete limitrange limits
```

### grant yourself cluster-admin permissions
This looks up your account name (usually your email address) and then creates a new cluster role binding, to make you a cluster-admin.

```sh
export GCP_USER=$(gcloud config get-value account | head -n 1)
kubectl create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=$GCP_USER
```

If you encounter "Error from server (Forbidden)...", ask your GKE project admin to grant you `container.clusterRoleBindings.create` permissions.

Alternatively, lookup the admin password for the cluster in the console, and then issue the following command, entering the admin password when prompted.

```sh
read -rsp "password: " APW && echo && kubectl --username=admin --password="$APW" create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=$GCP_USER
```

### monitor resources in your kubernetes cluster
At this point it is useful to monitor your kubernetes cluster using a utility like `watch` to refresh the output of `kubectl get` in a separate terminal window every one or two seconds.

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

### install riff
Install riff and kafka on the same `riff-system` namespace, with the release name `projectriff`.
The default is to install the RBAC roles and role-bindings.

```sh
helm install projectriff/riff \
  --name projectriff \
  --namespace riff-system \
  --set kafka.create=true
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
riff invokers apply -f https://github.com/projectriff/command-function-invoker/raw/v0.0.6/command-invoker.yaml
riff invokers apply -f https://github.com/projectriff/go-function-invoker/raw/v0.0.2/go-invoker.yaml
riff invokers apply -f https://github.com/projectriff/java-function-invoker/raw/v0.0.5-sr.1/java-invoker.yaml
riff invokers apply -f https://github.com/projectriff/node-function-invoker/raw/v0.0.6/node-invoker.yaml
riff invokers apply -f https://github.com/projectriff/python2-function-invoker/raw/v0.0.6/python2-invoker.yaml
riff invokers apply -f https://github.com/projectriff/python3-function-invoker/raw/v0.0.6/python3-invoker.yaml
```

## new function using node.js
The steps below will create a JavaScript function from scratch. The same files are also available in the `square` [sample](https://github.com/projectriff/riff/blob/master/samples/node/square/) on GitHub.

### write the function
Create `square.js` in an empty directory.

```js
module.exports = (x) => x ** 2
```

### install Docker and create a Docker ID
Installing [Docker Community Edition](https://www.docker.com/community-edition) is the easiest way get started with docker.
Visit https://hub.docker.com/ to create a new Docker ID. You will push your function container to a repo under this ID, so use your Docker ID credentals to login.

```
docker login
```

### create the function deployment and push to DockerHub
Run the following command from the same directory where the above function file is created:

```bash
riff create node --name square --input numbers --filepath .  --push
```
This command will initialize the function, creating a `Dockerfile` and YAML files `square-function.yaml` and `square-topics.yaml`
defining the Kubernetes resources for the function and topics respectively. It will also build the docker image, push it to DockerHub and then apply the Kubernetes function and topics resources to the cluster.


### watch for functions and topics
Use kubectl to watch the default namespace.

```sh
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

### to access the Kubernetes dashboard
Recent releases of the Kubernetes dashboard require a bearer token in order to login. The easiest way to do this, is to lookup the token associated with the `tiller` account created above and paste it into the login form.

```sh
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep tiller | awk '{print $1}')
```

For more details see the dashboard [wiki](https://github.com/kubernetes/dashboard/wiki/Access-control#introduction) and [issue #2474](https://github.com/kubernetes/dashboard/issues/2474).
