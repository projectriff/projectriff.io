---
title: "Getting started on GKE"
permalink: /docs/getting-started-with-knative-riff-on-gke/
excerpt: "How to run Knative using **riff** on Google Kubernetes Engine"
header:
  overlay_image: /images/gke.png
  overlay_filter: 0.4
  overlay_color: "#555"
redirect_from:
  - /docs/
  - /docs/getting-started-on-gke/
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

Create an environment variable, replacing ??? with your project name. 
```
export GCP_PROJECT=???
```

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
Check your default project, region, and zone.

```sh
gcloud config list
```

If necessary change the default project.
```sh
gcloud config set project $GCP_PROJECT
```

To list the available compute regions and zones:
```sh
gcloud compute zones list
```

To change the default region and zone:
```sh
gcloud config set compute/region us-east4
gcloud config set compute/zone us-east4-c
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
  --num-nodes=3
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
The [riff CLI](https://github.com/projectriff/riff/) is available to download from our GitHub [releases](https://github.com/projectriff/riff/releases) page. Once installed, check that the riff CLI version is 0.1.0 or later.
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
Install Knative, watching the pods until everything is running (this could take a couple of minutes).

```sh
riff system install
```

You should see pods running in namespaces istio-system, knative-build, knative-serving, and knative-eventing as well as kube-system when the system is fully operational. 
```
NAMESPACE          NAME                                                      READY     STATUS      RESTARTS   AGE
istio-system       istio-citadel-7bdc7775c7-h69hk                            1/1       Running     0          1m
istio-system       istio-cleanup-old-ca-vgw8p                                0/1       Completed   0          1m
istio-system       istio-egressgateway-795fc9b47-7bqpk                       1/1       Running     0          1m
istio-system       istio-ingress-84659cf44c-b6krf                            1/1       Running     0          1m
istio-system       istio-ingressgateway-7d89dbf85f-jllcx                     1/1       Running     0          1m
istio-system       istio-mixer-post-install-4747p                            0/1       Completed   0          1m
istio-system       istio-pilot-66f4dd866c-njqr4                              2/2       Running     0          1m
istio-system       istio-policy-76c8896799-jfpsw                             2/2       Running     0          1m
istio-system       istio-sidecar-injector-645c89bc64-4rrmt                   1/1       Running     0          1m
istio-system       istio-statsd-prom-bridge-949999c4c-z4njr                  1/1       Running     0          1m
istio-system       istio-telemetry-6554768879-pnksq                          2/2       Running     0          1m
istio-system       knative-ingressgateway-5f5dc4b4cd-q4r7k                   1/1       Running     0          1m
knative-build      build-controller-5cb4f5cb67-dxdkv                         1/1       Running     0          1m
knative-build      build-webhook-6b4c65546b-khpcb                            1/1       Running     0          1m
knative-eventing   controller-manager-7747d66d85-8s2q2                       2/2       Running     3          1m
knative-eventing   eventing-controller-6cd984f789-gffnz                      1/1       Running     0          1m
knative-eventing   eventing-webhook-7dfd9cfbd9-c8q5r                         1/1       Running     0          1m
knative-eventing   stub-clusterbus-866c95f68d-v57fz                          2/2       Running     0          1m
knative-serving    activator-7f5b67b69c-f46r9                                2/2       Running     0          1m
knative-serving    controller-868ff6d485-2brtz                               1/1       Running     0          1m
knative-serving    webhook-6d9976c74f-v82bk                                  1/1       Running     0          1m
kube-system        event-exporter-v0.2.1-5f5b89fcc8-s4r7g                    2/2       Running     0          3m
kube-system        fluentd-gcp-scaler-7c5db745fc-n65pg                       1/1       Running     0          3m
kube-system        fluentd-gcp-v3.0.0-7v7xl                                  2/2       Running     0          2m
kube-system        fluentd-gcp-v3.0.0-m4d65                                  2/2       Running     0          31s
kube-system        fluentd-gcp-v3.0.0-v9fnb                                  2/2       Running     0          1m
kube-system        heapster-v1.5.3-5b796bcfb4-grnv9                          3/3       Running     0          3m
kube-system        kube-dns-788979dc8f-bxzcc                                 4/4       Running     0          3m
kube-system        kube-dns-788979dc8f-m65jp                                 4/4       Running     0          3m
kube-system        kube-dns-autoscaler-79b4b844b9-2kq85                      1/1       Running     0          3m
kube-system        kube-proxy-gke-jldec-knative-default-pool-9782642d-1kfh   1/1       Running     0          3m
kube-system        kube-proxy-gke-jldec-knative-default-pool-9782642d-66rf   1/1       Running     0          3m
kube-system        kube-proxy-gke-jldec-knative-default-pool-9782642d-vpvn   1/1       Running     0          3m
kube-system        l7-default-backend-5d5b9874d5-l45wm                       1/1       Running     0          3m
kube-system        metrics-server-v0.2.1-7486f5bd67-znw5s                    2/2       Running     0          3m
```
There should be a couple of pods in the istio-system that have a "Completed" status. If there are pods with an "Error" status, as long as there is one pod with the same prefix with a "Completed" status, then everything should be fine.

## create a Kubernetes secret for pushing images to GCR
Create a [GCP Service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts) in the GCP console or using the gcloud CLI
```sh
gcloud iam service-accounts create push-image
```

Grant the service account a "storage.admin" role using the [IAM manager](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts) or using gcloud.

```sh
gcloud projects add-iam-policy-binding $GCP_PROJECT \
    --member serviceAccount:push-image@$GCP_PROJECT.iam.gserviceaccount.com \
    --role roles/storage.admin
```

Create a json file with a new [authentication key](https://cloud.google.com/container-registry/docs/advanced-authentication#json_key_file) for the service account.
```sh
gcloud iam service-accounts keys create \
  --iam-account "push-image@$GCP_PROJECT.iam.gserviceaccount.com" \
  gcr-storage-admin.json
```

Edit the content below replacing the entire password value (in red) with the content from `gcr-storage-admin.json`, preserving the 4-space indentation. Save the result to another file called `gcr-storage-admin.yaml`. 
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: push-credentials
  annotations:
    build.knative.dev/docker-0: https://gcr.io
type: kubernetes.io/basic-auth
stringData:
  username: _json_key
  password: |
    {
    "type": "service_account",
    "project_id": "my_project",
    ...
    }
```

apply the secret to Kubernetes
```sh
kubectl apply -f gcr-storage-admin.yaml
```

### initialize the namespace
Use the riff CLI to initialize your namespace (if you plan on using a namespace other than `default` then substitute the name you want to use). This will create a serviceaccount that uses your specified secret, install a buildtemplate and label the namespace for automatic Istio sidecar injection.
```sh
riff namespace init default --secret push-credentials
```
## create a function
This step will pull the source code for a function from a GitHub repo, build a container image based on the node function invoker, and push the resulting image to GCR. Replace the ??? with your GCP project name.
```sh
riff function create node square \
  --git-repo https://github.com/trisberg/node-fun-square.git \
  --artifact square.js \
  --image gcr.io/$GCP_PROJECT/node-fun-square
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
Record the IP address for the `knative-ingressgateway`:
```sh
export SERVICE_IP=`kubectl get svc knative-ingressgateway -n istio-system -o jsonpath="{.status.loadBalancer.ingress[*].ip}"`
echo $SERVICE_IP
```

Use curl to invoke the function.
```sh
curl \
     -w '\n' \
     -H 'Host: square.default.example.com' \
     -H 'Content-Type: text/plain' \
     http://$SERVICE_IP \
     -d 10
```
For the input data of 10 above, the function should return 100

## delete the function
```
riff service delete square
```
