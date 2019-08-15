---
id: gke
title: Getting started on GKE
sidebar_label: GKE
---

The following will help you get started running a riff function with Knative on GKE.

## TL;DR

1. select a Project, install and configure gcloud, kubectl, and helm
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
[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. If you don't already have kubectl on your machine, you can use gcloud to install it.

```sh
gcloud components install kubectl
```

### configure gcloud

Create an environment variable, replacing ??? with your project ID (not to be confused with your project name; use `gcloud projects list` to find your project ID). 

```sh
GCP_PROJECT_ID=???
```

Check your default project.

```sh
gcloud config list
```

If necessary change the default project.

```sh
gcloud config set project $GCP_PROJECT_ID
```

List the available compute zones and also regions with quotas.

```sh
gcloud compute zones list
gcloud compute regions list
```

Choose a zone, preferably in a region with higher CPU quota.

```sh
export GCP_ZONE=us-central1-b
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
  --machine-type=n1-standard-2 \
  --enable-autoscaling --min-nodes=1 --max-nodes=3 \
  --enable-autorepair \
  --scopes=service-control,service-management,compute-rw,storage-ro,cloud-platform,logging-write,monitoring-write,pubsub,datastore \
  --num-nodes=3 \
  --zone=$GCP_ZONE
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

## install the riff CLI

The [riff CLI](https://github.com/projectriff/riff/) is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Once installed, check that the riff CLI version is 0.4.0 or later.

```sh
riff --version
```
```
riff version 0.4.0-snapshot (2c4a47d0872283b629ea478916c43d831e75ea1f)
```

At this point it is useful to monitor your cluster using a utility like `watch`. To install on a Mac

```sh
brew install watch
```

Watch pods in a separate terminal.

```sh
watch -n 1 kubectl get pod --all-namespaces
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
helm install projectriff/istio --name istio --namespace istio-system --wait
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

### apply build credentials

Use the riff CLI to apply credentials to a container registry (if you plan on using a namespace other than `default` add the `--namespace` flag).

```sh
riff credential apply my-creds --gcr gcr-storage-admin.json --set-default-image-prefix
```

## create a function

This step will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to GCR. The function resource represents a build plan that will report the latest built image.

```sh
riff function create square \
  --git-repo https://github.com/projectriff-samples/node-square \
  --artifact square.js \
  --tail
```

After the function is created, you can get the built image by listing functions.

```sh
riff function list
```

```
NAME     LATEST IMAGE                                                                                         ARTIFACT    HANDLER   INVOKER   STATUS   AGE
square   gcr.io/$GCP_PROJECT/square@sha256:ac089ca183368aa831597f94a2dbb462a157ccf7bbe0f3868294e15a24308f68   square.js   <empty>   <empty>   Ready    1m13s
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
