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

## Install the Helm CLI

[Helm](https://helm.sh) is a popular package manager for Kubernetes. The riff runtime and its dependencies are provided as Helm charts.

Download the [Helm v2.13.1 CLI](https://github.com/helm/helm/releases/tag/v2.13.1) for your platform. (Helm 3 is currently in beta and has not been tested for compatibility with riff). Unzip and copy the Helm CLI executable to a directory on your path.

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
Client: &version.Version{SemVer:"v2.13.1", GitCommit:"618447cbf203d147601b4b9bd7f8c37a5d39fbb4", GitTreeState:"clean"}
Server: &version.Version{SemVer:"v2.13.1", GitCommit:"618447cbf203d147601b4b9bd7f8c37a5d39fbb4", GitTreeState:"clean"}
```

> Please see the [Helm documentation](https://helm.sh/docs/using_helm/#securing-your-helm-installation) for additional Helm security configuration.

## Build the riff CLI

Clone the [riff CLI repo](https://github.com/projectriff/cli/), and run `make build install`. This will require a recent [go build environment](https://golang.org/doc/install#install). On macOS you can use `brew install go`.

Check that the riff CLI version is 0.5.0-snapshot.
```sh
riff --version
```
```
riff version 0.5.0-snapshot (443fc9125dd6d8eecd1f7e1a13fa93b88fd4f972)
```

## Install riff using Helm

Load the projectriff charts

```sh
helm repo add projectriff https://projectriff.storage.googleapis.com/charts/releases
helm repo update
```

riff can be installed with optional runtimes. The riff build system is always installed, and is required by each runtime.

If using the Knative runtime, first install Istio:

```sh
helm install projectriff/istio --name istio --namespace istio-system --wait --devel
```

Install riff with both the Core and Knative runtimes. To omit or include other runtimes, edit the relevant lines below.

```sh
helm install projectriff/riff --name riff \
  --set tags.core-runtime=true \
  --set tags.knative-runtime=true \
  --set tags.streaming-runtime=false \
  --wait --devel
```

> NOTE: After installing the Streaming runtime, configure Kafka with a [KafkaProvider](/docs/v0.5/runtimes/streaming#kafkaprovider).

Verify the riff install. Resources may be missing if the corresponding runtime was not installed.

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

Look up the Loadbalancer IP for the ingressgateway; you should see a value like `35.205.114.86`.

```sh
INGRESS_IP=$(kubectl get svc istio-ingressgateway --namespace istio-system --output 'jsonpath={.status.loadBalancer.ingress[0].ip}')
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

## Create a Core deployer

The [Core runtime](../runtimes/core.md) deploys riff workloads as "vanilla" Kubernetes deployments and services.

```sh
riff core deployer create k8s-square --function-ref square --tail
```

After the deployer is created, you can see the service name by listing deployers.

```sh
riff core deployers list
```
```
NAME         TYPE       REF      SERVICE               STATUS   AGE
k8s-square   function   square   k8s-square-deployer   Ready    37s
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

Note that unlike Knative, the Core runtime will not scale deployments down to zero.

## Cleanup

```sh
riff knative deployer delete knative-square
riff core deployer delete k8s-square
riff function delete square
```