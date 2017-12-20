---
title: "Getting started on GKE"
permalink: /docs/getting-started-on-gke/
excerpt: "Quick tutorial for running riff and building a function on Google Kubernetes Engine."
redirect_from:
  - /docs/
---

### TL;DR
1. select or create a Project in the Google Cloud console
2. install the gcloud CLI and kubectl
3. create a GKE cluster
4. configure credentials to target the GKE cluster from kubectl
5. install helm
6. install riff on the GKE cluster using a helm chart
7. install Docker and create a Docker ID
8. build one of the sample functions
9. apply the function and topic resource definitions to Kubernetes
10. send an event to the topic to trigger the function

### create a Google Cloud project
A project is required to consume any Google Cloud services, including GKE clusters. When you log into the [console](https://console.cloud.google.com/) you can select or create a project from the dropdown at the top.

![google cloud console](/images/gcp-project.png)

### install gcloud
Follow the [quickstart instructions](https://cloud.google.com/sdk/docs/quickstarts) to install the [Google Cloud SDK](https://cloud.google.com/sdk/) which includes the `gcloud` CLI. You may need to add the `google-cloud-sdk/bin` directory to your path. Once installed, `gcloud init` will open a browser to start an oauth flow and configure gcloud to use your project. Afterwards your browser will end up on this [helpful page](https://cloud.google.com/sdk/auth_success).

```
gcloud init
gcloud container clusters list # will show all the clusters in your project
```

### install kubectl
[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. It is used to manage minikube as well as hosted Kubernetes clusters like GKE. If you don't already have kubectl on your machine, you can use gcloud to install it.

```
gcloud components install kubectl
```

### create a GKE cluster
Look for [Kubernetes Engine](https://console.cloud.google.com/kubernetes/) in the console, and create a new cluster. The minimum configuration for riff on GKE is single node cluster with 2 vCPUs and 7.5GB memory. Using the default 1.7x version of Kubernetes without RBAC will simplify the configuration.

![small GKE cluster in console](/images/gke-small-cluster.png)

### configure credentials to target the GKE cluster
Once the cluster has been created, you will see a `Connect` button in the console. Run the first command `gcloud container clusters get-credentials ...` to fetch the credentials and add a new context for kubectl. Your kubectl context will be switched to the new cluster.

```
kubectl config current-context
```

### (optional) remove CPU request limit
Remove the GKE default request of 0.1 CPU's per container which limits how many containers your cluster is allowed to schedule (effectively 10 per vCPU).

```
kc delete limitrange limits
```

### install helm
[Helm](https://docs.helm.sh/using_helm/#installing-helm) is used to package and install resources for Kubernetes. Helm packages are called charts. After [installing](https://docs.helm.sh/using_helm/#installing-helm) the helm CLI, point helm to the riff-charts repo.

```
helm repo add riffrepo https://riff-charts.storage.googleapis.com
helm repo update
```

### install riff on GKE
Use `helm init` to install the helm server (aka "tiller") in your GKE cluster, then install riff.

```
helm init
helm install riffrepo/riff --name demo
```

### monitor your cluster
At this point it is useful to monitor your cluster using a utility like `watch` to refresh a separate terminal window which is running `kubectl get` every one or two seconds.

```
brew install watch
watch -n 1 kubectl get functions,topics,pods,services,deploy
```

### install Docker and create a Docker ID
Installing [Docker Community Edition](https://www.docker.com/community-edition) is the easiest way get started with docker.
Visit https://hub.docker.com/ to create a new Docker ID. You will push your function container to a repo under this ID, so use your Docker ID credentals to login.

```
docker login
```

## new function using node.js
The steps below will create a JavaScript function from scratch. The same files are also available in the `square` [sample](https://github.com/projectriff/riff/blob/master/samples/node/square/) on GitHub.

### write the function
Create `square.js` in an empty directory.

```js
module.exports = (x) => x ** 2
```

### Dockerfile
Create a new file called `Dockerfile` in the same directory.
This container will be built on the `node-function-invoker` base image.

```
FROM projectriff/node-function-invoker:0.0.2
ENV FUNCTION_URI /functions/function.js
ADD square.js ${FUNCTION_URI}
```

### Docker build
Use the docker CLI to build the function container image. Prefix the image name by replacing `<your-Docker-ID>` below with your own Docker ID.  
_Don't forget the `.` at the end of the `docker build...` command to indicate that you are building with the Dockerfile in the current directory._

```bash
docker build -t <your-Docker-ID>/square:v0001 .
```

After performing the build push the image to your own Docker Hub repo.

```bash
docker push <your-Docker-ID>/square:v0001
```

### function and topic resource definitions
Create a single `square.yaml` file for both resource definitions.
Use the same image name and tag as the Docker build step above (with your own Docker ID prefix).

```yaml
apiVersion: projectriff.io/v1
kind: Topic
metadata:
  name: numbers
---

apiVersion: projectriff.io/v1
kind: Function
metadata:
  name: square
spec:
  protocol: http
  input: numbers
  container:
    image: <your-Docker-ID>/square:v0001
```

### apply the yaml to kubernetes

```
kubectl apply -f square.yaml
```

### trigger the function
```
GATEWAY=`kubectl get service -l component=http-gateway -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}'`
HEADER="Content-Type: text/plain"
curl $GATEWAY/requests/numbers -H "$HEADER" -w "\n" -d 10
```
