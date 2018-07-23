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
A project is required to consume any Google Cloud services, including GKE clusters. When you log into the [console](https://console.cloud.google.com/) you can select or create a project from the dropdown at the top. Note the name of the project.

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
# replace ??? below with your project name 
export GCP_PROJECT=???
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

Enable the necessary APIs for gcloud
```sh
gcloud services enable \
  cloudapis.googleapis.com \
  container.googleapis.com \
  containerregistry.googleapis.com
```

## create a GKE cluster
Choose a new unique lowercase cluster name and create the cluster. For this demo, three `n1-standard-4` type nodes should be sufficient.
```sh
# replace ??? below with your own cluster name
export CLUSTER_NAME=???

gcloud container clusters create $CLUSTER_NAME \
  --cluster-version=latest \
  --machine-type=n1-standard-4 \
  --enable-autoscaling --min-nodes=1 --max-nodes=3 \
  --enable-autorepair \
  --scopes=service-control,service-management,compute-rw,storage-ro,cloud-platform,logging-write,monitoring-write,pubsub,datastore \
  --num-nodes=3

gcloud container clusters list
```

For additional details see [Knative Install on Google Kubernetes Engine](https://github.com/knative/docs/blob/master/install/Knative-with-GKE.md) docs.

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
Install Knative, watching the pods until everything is running (this could take a couple of minutes).

```sh
riff system install
```

You should see pods running in namespaces istio-system, knative-build, knative-serving, and knative-eventing as well as kube-system when the system is fully operational. There should be a couple of pods in the istio-system that have a "Completed" status. If there are pods with an "Error" status, as long as there is one pod with the same prefix with a "Completed" status, then everything should be fine.

## create a Kubernetes secret for pushing images to GCR
Since we're running on GKE, configuring a secret is only required for the build to push images to the Google Container Registry (GCR). Knative will be able to pull images to run them in the cluster as long as the registry is using the same project.

create a [GCP Service Account](https://cloud.google.com/iam/docs/creating-managing-service-accounts) in the GCP console or using the gcloud CLI
```sh
gcloud iam service-accounts create push-image
```

Grant the service account a "storage.admin" role using the [IAM manager](https://cloud.google.com/iam/docs/granting-roles-to-service-accounts) or using gcloud.

```sh
gcloud projects add-iam-policy-binding $GCP_PROJECT \
    --member serviceAccount:push-image@$GCP_PROJECT.iam.gserviceaccount.com \
    --role roles/storage.admin
```
> Note the use of the $GCP_PROJECT environment variable, set earlier.

Create a json file with a new [authentication key](https://cloud.google.com/container-registry/docs/advanced-authentication#json_key_file) for the service account.
```sh
gcloud iam service-accounts keys create \
  --iam-account "push-image@$GCP_PROJECT.iam.gserviceaccount.com" \
  gcr-storage-admin.json
```

Edit the content below replacing the password value (indented) at the end with the content from `gcr-storage-admin.json` (preserving at least 4 space indentation) and save the result to another file called `gcr-storage-admin.yaml`. 
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
  # The content of the json key file should replace the password below, including braces and preserving indentation.
  password: |
    {
    "type": "service_account",
    "project_id": "cf-spring-funkytown",
    "private_key_id": "xxx",
    "private_key": "-----BEGIN fake PRIVATE KEY-----\n
       xxx
       fake credential
       xxx
    \n-----END fake PRIVATE KEY-----\n",
    "client_email": "push-image@project.iam.gserviceaccount.com",
    "client_id": "xxx",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://accounts.google.com/o/oauth2/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/push-image%40projet.iam.gserviceaccount.com"
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
```sh
riff function create node square \
  --git-repo https://github.com/trisberg/node-fun-square.git \
  --artifact square.js \
  --image gcr.io/$GCP_PROJECT/node-fun-square
```

If you're still watching pods, you should see something like the following
```sh
NAMESPACE          NAME                                                      READY     STATUS      RESTARTS   AGE
default            square-00001-jk9vj                                        0/1       Init:0/4    0          24s
```

The 4 "Init" containers may take a while to complete the first time a function is built, but eventually that pod should show a status of completed, and a new square deployment pod should be running 3/3 containers.
```sh
NAMESPACE          NAME                                                      READY     STATUS      RESTARTS   AGE
default            square-00001-deployment-679bffb58c-cpzz8                  3/3       Running     0          4m
default            square-00001-jk9vj                                        0/1       Completed   0          5m
```

## invoke the function
Find the IP address for the `knative-ingressgateway`:
```sh
export SERVICE_IP=`kubectl get svc knative-ingressgateway -n istio-system -o jsonpath="{.status.loadBalancer.ingress[*].ip}"`
echo $SERVICE_IP
```

Then invoke the function.
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


