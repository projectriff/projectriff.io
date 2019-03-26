---
layout: doc
title: "Getting started on GKE"
short_title: on GKE
permalink: /docs/getting-started/gke/
excerpt: "How to run Knative using **riff** on Google Kubernetes Engine"
header:
  overlay_image: /images/gke.png
  overlay_filter: 0.4
  overlay_color: "#555"
redirect_from:
- /docs/getting-started-on-gke/
- /docs/getting-started-with-knative-riff-on-gke/
categories:
- getting-started
---

# Getting started on GKE

The following will help you get started running a riff function with Knative on GKE.

## TL;DR

1. select a Project, install and configure gcloud and kubectl
1. create a GKE cluster for Knative
1. install the latest riff CLI
1. install Knative using the riff CLI
1. create a function
1. invoke the function


## create a Google Cloud project

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

### configure gcloud

Create an environment variable, replacing ??? with your project ID (not to be confused with your project name; use `gcloud projects list` to find your project ID). 

```sh
export GCP_PROJECT_ID=???
```

Check your default project.

```sh
gcloud config list
```

If necessary change the default project.

```sh
gcloud config set project $GCP_PROJECT_ID
```

List the available compute regions and CPU quotas in each.

```sh
gcloud compute regions list
```

Choose a default region with at least 36 CPUS available, and set that to your default.

```sh
gcloud config set compute/region us-east4
gcloud config list compute/
```

Enable the necessary APIs for gcloud. You also need to [enable billing](https://cloud.google.com/billing/docs/how-to/manage-billing-account) for your new project.

```sh
gcloud services enable \
  cloudapis.googleapis.com \
  container.googleapis.com \
  containerregistry.googleapis.com
```

## create a GKE cluster

Choose a new unique lowercase cluster name and create the cluster. For this demo, three nodes should be sufficient.

```sh
# replace ??? below with your own cluster name
export CLUSTER_NAME=???
```

```sh
gcloud container clusters create $CLUSTER_NAME \
  --cluster-version=latest \
  --machine-type=n1-standard-4 \
  --enable-autoscaling --min-nodes=1 --max-nodes=3 \
  --enable-autorepair \
  --scopes=service-control,service-management,compute-rw,storage-ro,cloud-platform,logging-write,monitoring-write,pubsub,datastore \
  --num-nodes=3 \
  --region=$(gcloud config get-value compute/region)
```

For additional details see [Knative Install on Google Kubernetes Engine](https://github.com/knative/docs/blob/master/install/Knative-with-GKE.md).

Confirm that your kubectl context is pointing to the new cluster

```sh
kubectl config current-context
```

To list contexts:

```sh
kubectl config get-contexts
```

You should also be able to find the cluster the [Kubernetes Engine](https://console.cloud.google.com/kubernetes/) console.

## grant yourself cluster-admin permissions

```sh
kubectl create clusterrolebinding cluster-admin-binding \
--clusterrole=cluster-admin \
--user=$(gcloud config get-value core/account)
```

## install the riff CLI

The [riff CLI](https://github.com/projectriff/riff/) is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Once installed, check that the riff CLI version is 0.2.0 or later.

```sh
riff version
```
```
Version
  riff cli: 0.2.0 (1ae190ff3c7edf4b375ee935f746ebfd1d8eaf5c)
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

Install Knative, watching the pods until everything is running (this could take a couple of minutes).

```sh
riff system install
```

You should see pods running in namespaces istio-system, knative-build, knative-serving, and knative-eventing as well as kube-system when the system is fully operational. 

```
NAMESPACE          NAME                                           READY     STATUS      RESTARTS   AGE
istio-system       istio-citadel-84fb7985bf-vsksm                 1/1       Running     0          1m
istio-system       istio-cleanup-secrets-gpxr2                    0/1       Completed   0          2m
istio-system       istio-egressgateway-bd9fb967d-46r6x            1/1       Running     0          2m
istio-system       istio-galley-655c4f9ccd-hhtz2                  1/1       Running     0          2m
istio-system       istio-ingressgateway-688865c5f7-gxwxc          1/1       Running     0          2m
istio-system       istio-pilot-6cd69dc444-m8x52                   2/2       Running     0          2m
istio-system       istio-policy-6b9f4697d-m4rjs                   2/2       Running     0          2m
istio-system       istio-sidecar-injector-8975849b4-hjxwb         1/1       Running     0          1m
istio-system       istio-statsd-prom-bridge-7f44bb5ddb-lt5mp      1/1       Running     0          2m
istio-system       istio-telemetry-6b5579595f-n8r7t               2/2       Running     0          2m
istio-system       knative-ingressgateway-77b757d468-627ck        1/1       Running     0          47s
knative-build      build-controller-56f555c8b9-hgk4k              1/1       Running     0          53s
knative-build      build-webhook-868b65dd9-f89t8                  1/1       Running     0          53s
knative-eventing   eventing-controller-596c6bc4fd-2zz9x           1/1       Running     0          24s
knative-eventing   stub-clusterbus-dispatcher-7b86b64cd-l72ng     2/2       Running     0          19s
knative-eventing   webhook-796b574465-ctb9t                       1/1       Running     0          23s
knative-serving    activator-7ffbdb4f46-69q7f                     2/2       Running     0          40s
knative-serving    autoscaler-f55c76f7c-tcvs4                     2/2       Running     0          39s
knative-serving    controller-8647f984bf-fztw4                    1/1       Running     0          35s
knative-serving    webhook-896c797cd-nq44h                        1/1       Running     0          35s
kube-system        event-exporter-v0.2.1-5f5b89fcc8-5h5zv         2/2       Running     0          19m
kube-system        fluentd-gcp-scaler-7c5db745fc-2jpbq            1/1       Running     0          19m
kube-system        fluentd-gcp-v3.1.0-8pxjg                       2/2       Running     0          19m
kube-system        fluentd-gcp-v3.1.0-k8k5d                       2/2       Running     0          19m
kube-system        fluentd-gcp-v3.1.0-kgncp                       2/2       Running     0          19m
kube-system        heapster-v1.5.3-7786f77d66-vhls9               3/3       Running     0          18m
kube-system        kube-dns-788979dc8f-hxgl8                      4/4       Running     0          19m
kube-system        kube-dns-788979dc8f-pv9mm                      4/4       Running     0          19m
kube-system        kube-dns-autoscaler-79b4b844b9-d6q5h           1/1       Running     0          19m
kube-system        kube-proxy-gke-jl-default-pool-19100274-173p   1/1       Running     0          19m
kube-system        kube-proxy-gke-jl-default-pool-19100274-26tk   1/1       Running     0          19m
kube-system        kube-proxy-gke-jl-default-pool-19100274-brwn   1/1       Running     0          19m
kube-system        l7-default-backend-5d5b9874d5-jp4v2            1/1       Running     0          19m
kube-system        metrics-server-v0.2.1-7486f5bd67-fw7vl         2/2       Running     0          18m
```

## create a Kubernetes secret for pushing images to GCR

Create a [GCP Service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts) in the GCP console or using the gcloud CLI

```sh
gcloud iam service-accounts create push-image
```

Grant the service account a "storage.admin" role using the [IAM manager](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts) or using gcloud.

```sh
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
    --member serviceAccount:push-image@$GCP_PROJECT_ID.iam.gserviceaccount.com \
    --role roles/storage.admin
```

Create a new [authentication key](https://cloud.google.com/container-registry/docs/advanced-authentication#json_key_file) for the service account and save it in `gcr-storage-admin.json`.

```sh
gcloud iam service-accounts keys create \
  --iam-account "push-image@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  gcr-storage-admin.json
```

### initialize the namespace

Use the riff CLI to initialize your namespace (if you plan on using a namespace other than `default` then substitute the name you want to use). This creates a serviceaccount that uses the secret saved above, installs a buildtemplate and labels the namespace for automatic Istio sidecar injection.

```sh
riff namespace init default --gcr gcr-storage-admin.json
```

## create a function

This step will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to GCR.

```sh
riff function create square \
  --git-repo https://github.com/projectriff-samples/node-square \
  --image gcr.io/$GCP_PROJECT_ID/square:v2 \
  --artifact square.js \
  --verbose
```

If you're still watching pods, you should see something like the following

```
NAMESPACE    NAME                  READY     STATUS      RESTARTS   AGE
default      square-00001-jk9vj    0/1       Init:0/4    0          24s
```

The 4 "Init" containers may take a while to complete the first time a function is built, but eventually that pod should show a status of completed, and a new square deployment pod should be running 3/3 containers.

```
NAMESPACE   NAME                                       READY     STATUS      RESTARTS   AGE
default     square-00001-deployment-679bffb58c-cpzz8   3/3       Running     0          4m
default     square-00001-jk9vj                         0/1       Completed   0          5m
```

## invoke the function

```sh
riff service invoke square --text -- -w '\n' -d 8
```

#### result

```
curl 35.236.212.232/ -H 'Host: square.default.example.com' -H 'Content-Type: text/plain' -w '\n' -d 8
64
```

## delete the function

```sh
riff service delete square
```
