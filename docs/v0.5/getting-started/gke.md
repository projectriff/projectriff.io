---
id: gke
title: Getting started on GKE
sidebar_label: GKE
---

The following will help you get started running a riff function on GKE.

## Create a Google Cloud project

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

## Create a GKE cluster

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
  --scopes=cloud-platform \
  --num-nodes=3 \
  --zone=$GCP_ZONE
```

For additional details see [Knative Install on Google Kubernetes Engine](https://knative.dev/docs/install/knative-with-gke/).

Confirm that your kubectl context is pointing to the new cluster

```sh
kubectl config current-context
```

To list contexts:

```sh
kubectl config get-contexts
```

You should also be able to find the cluster the [Kubernetes Engine](https://console.cloud.google.com/kubernetes/) console.

### monitor your cluster

At this point it is useful to monitor your cluster using a utility like `watch`. To install on a Mac

```sh
brew install watch
```

Watch pods in a separate terminal.

```sh
watch -n 1 kubectl get pod --all-namespaces
```

### grant yourself cluster-admin permissions

```sh
kubectl create clusterrolebinding cluster-admin-binding \
--clusterrole=cluster-admin \
--user=$(gcloud config get-value core/account)
```

## Install kapp

[kapp](https://get-kapp.io/) is a simple deployment tool for Kubernetes. The riff runtime and its dependencies are provided as standard Kubernetes yaml files, that can be installed with kapp.

You can find install kapp using Homebrew on MacOS

```sh
brew tap k14s/tap
brew install kapp
```

Alternatively, Download a recent binary for your platform from [github](https://github.com/k14s/kapp/releases).
Move it into a directory on your path, and make it executable.
Complete kapp installation instructions can be found [here](https://k14s.io/#install-from-github-release)

Validate the installation.

```sh
kapp version
```

```
Client Version: 0.18.0

Succeeded
```

## Install a snapshot build of the riff CLI

Recent snapshot builds of the riff CLI for [macOS](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.5.0-snapshot/riff-darwin-amd64.tgz), [Windows](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.5.0-snapshot/riff-windows-amd64.zip), or [Linux](https://storage.cloud.google.com/projectriff/riff-cli/releases/v0.5.0-snapshot/riff-linux-amd64.tgz), can be downloaded from GCS.

Alternatively, clone the [riff CLI repo](https://github.com/projectriff/cli/), and run `make build install`. This will require a recent [go build environment](https://golang.org/doc/install#install). On macOS you can use `brew install go`.

Check that the riff CLI version is 0.5.0-snapshot.

```sh
riff --version
```

```
riff version 0.5.0-snapshot (443fc9125dd6d8eecd1f7e1a13fa93b88fd4f972)
```

## Install riff Using kapp

riff can be installed with optional runtimes. The riff build system is always installed, and is required by each runtime.

> NOTE: If you have riff v0.4.0 installed then you must first uninstall that version. See [instructions](../../v0.4/getting-started/gke.md#uninstalling) in the v0.4.0 documentation.

Create a namespace for kapp to store configuration:

```
kubectl create ns apps
```

### install riff Build

To install riff build and it's dependencies:

```sh
kapp deploy -n apps -a cert-manager -f https://storage.googleapis.com/projectriff/release/0.5.0-snapshot/cert-manager.yaml
```

```sh
kapp deploy -n apps -a kpack -f https://storage.googleapis.com/projectriff/release/0.5.0-snapshot/kpack.yaml
```

```sh
kapp deploy -n apps -a riff-builders -f https://storage.googleapis.com/projectriff/release/0.5.0-snapshot/riff-builders.yaml
```

```sh
kapp deploy -n apps -a riff-build -f https://storage.googleapis.com/projectriff/release/0.5.0-snapshot/riff-build.yaml
```

### install Contour ingress controller

The Contour ingress controller can be used by both Knative and Core runtimes.

```sh
kapp deploy -n apps -a contour -f https://storage.googleapis.com/projectriff/release/0.5.0-snapshot/contour.yaml
```

### install riff Knative Runtime

To optionally install riff Knative Runtime and it's dependencies:

```sh
kapp deploy -n apps -a knative -f https://storage.googleapis.com/projectriff/release/0.5.0-snapshot/knative.yaml
```

```sh
kapp deploy -n apps -a riff-knative-runtime -f https://storage.googleapis.com/projectriff/release/0.5.0-snapshot/riff-knative-runtime.yaml
```

### verify riff installation

Resources may be missing if the corresponding runtime was not installed.

```sh
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

### create a Kubernetes secret for pushing images to GCR

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

## Create a function

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

## Create a Knative deployer

The [Knative Runtime](../runtimes/knative.md) is only available on clusters with Istio and Knative installed. Knative deployers run riff workloads using Knative resources which provide auto-scaling (including scale-to-zero) based on HTTP request traffic, and routing.

```sh
riff knative deployer create knative-square --function-ref square --ingress-policy External --tail
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

Look up the Loadbalancer IP for the ingressgateway; you should see a value like `35.205.114.86`.

```sh
INGRESS_IP=$(kubectl get svc envoy-external --namespace projectcontour --output 'jsonpath={.status.loadBalancer.ingress[0].ip}')
echo $INGRESS_IP
```

Invoke the function by POSTing to the ingressgateway, passing the hostname and content-type as headers.

```sh
curl http://$INGRESS_IP/ -w '\n' \
-H 'Host: knative-square.default.example.com' \
-H 'Content-Type: application/json' \
-d 7
```

```
49
```

## Delete the function and deployer

```sh
riff knative deployer delete knative-square
riff function delete square
```

## Uninstalling riff

Use the following commands to uninstall riff:

### remove any riff resources

```sh
kubectl delete riff --all-namespaces --all
```

### remove riff Streaming Runtime

```sh
kapp delete -n apps -a riff-streaming-runtime
```

```sh
kapp delete -n apps -a keda
```

### remove riff Core Runtime (if installed)

```sh
kapp delete -n apps -a riff-core-runtime
```

### remove riff Knative Runtime (if installed)

```sh
kubectl delete knative --all-namespaces --all
```

```sh
kapp delete -n apps -a riff-knative-runtime
```

```sh
kapp delete -n apps -a knative
```

```sh
kapp delete -n apps -a istio
```

```sh
kubectl get customresourcedefinitions.apiextensions.k8s.io -oname | grep istio.io | xargs -L1 kubectl delete
```

### remove riff Build

```sh
kapp delete -n apps -a riff-build
```

```sh
kapp delete -n apps -a riff-builders
```

```sh
kapp delete -n apps -a kpack
```

```sh
kapp delete -n apps -a cert-manager
```
