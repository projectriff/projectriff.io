---
title: "Getting started on minikube"
permalink: /docs/getting-started/
excerpt: "Quick tutorial for running riff and building a function on minikube."
---

### TL;DR
1. install docker, kubectl, minikube, and helm
2. install riff using a helm chart
3. build one of the sample functions
4. apply the function and topic resource definitions to Kubernetes
5. send an event to the topic to trigger the function

### install docker
Installing [Docker Community Edition](https://www.docker.com/community-edition) is the easiest way get started with docker. Since minikube includes its own docker daemon, you actually only need the docker CLI to build function containers for riff. This means that if you want to, you can shut down the Docker (server) app, and turn off automatic startup of Docker on login.

### install kubectl
[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. It is used to manage minikube as well as hosted Kubernetes clusters. If you already have the Google Cloud Platform SDK, use: `gcloud components install kubectl`.

### install minikube
[Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is a Kubernetes environment which runs in a single virtual machine. See the [latest release](https://github.com/kubernetes/minikube/releases) for installation, and the [readme](https://github.com/kubernetes/minikube/blob/master/README.md) for more detailed information.

### start your minikube cluster
```
minikube start --memory=4096
```

### install helm
[Helm](https://docs.helm.sh/using_helm/#installing-helm) is used to package and install resources for Kubernetes. Helm packages are called charts. After installing the helm CLI, `helm init` will install the helm server (aka "tiller") in minikube. You will also need point helm to the repo with the latest riff helm charts.
```
helm repo add riffrepo https://riff-charts.storage.googleapis.com
helm repo update
```

### install riff
```
helm init
helm install riffrepo/riff --name demo --set httpGateway.service.type=NodePort
```

### clone the riff repo to access one of the samples
```
git clone git@github.com:projectriff/riff.git
cd riff/samples/node/square
```

### inspect the square.yaml

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
    image: projectriff/square:v0001
```

### configure docker to build containers in minikube
This is only reqired once per terminal session.
```
eval $(minikube docker-env)
```


### build the docker image in minikube
```
docker build -t projectriff/square:v0001 .
```

Make sure that the `-t tag` matches the container image tag in the yaml above

### apply the yaml to kubernetes
```
kubectl apply -f square.yaml
```

### trigger the function
```
GATEWAY=`minikube service --url demo-riff-http-gateway`
HEADER="Content-Type: text/plain"
curl $GATEWAY/requests/numbers -H "$HEADER" -w "\n" -d 10
```
