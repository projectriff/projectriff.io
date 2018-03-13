---
title: "Getting started on minikube"
permalink: /docs/getting-started-on-minikube/
excerpt: "How to run **riff** on Minikube"
header:
  overlay_image: /images/minikube2.png
  overlay_filter: 0.4
  overlay_color: "#555"
redirect_from:
  - /docs/
---

### TL;DR
1. install docker, kubectl, minikube, and helm
2. monitor your riff cluster with watch and kubectl
3. install kafka using a helm chart
4. install riff using a helm chart
5. create a sample function
6. publish an event to trigger the sample function

### install docker
Installing [Docker Community Edition](https://www.docker.com/community-edition) is the easiest way get started with docker. Since minikube includes its own docker daemon, you actually only need the docker CLI to build function containers for riff. This means that if you want to, you can shut down the Docker (server) app, and turn off automatic startup of Docker on login.

### install kubectl
[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. It is used to manage minikube as well as hosted Kubernetes clusters. If you already have the Google Cloud Platform SDK, use: `gcloud components install kubectl`.

### install minikube
[Minikube](https://kubernetes.io/docs/tasks/tools/install-minikube/) is a Kubernetes environment which runs in a single virtual machine. See the [latest release](https://github.com/kubernetes/minikube/releases) for installation, and the [readme](https://github.com/kubernetes/minikube/blob/master/README.md) for more detailed information.

### start your minikube cluster
```sh
minikube start --memory=4096
```
Once minikube is running you can open a browser-based dashboard with `minikube dashboard`.

### configure docker to build containers in minikube
This is only reqired once per terminal session. See [here](https://kubernetes.io/docs/getting-started-guides/minikube/#reusing-the-docker-daemon) for more details.

```sh
eval $(minikube docker-env)
```

### monitor your minikube
At this point it is useful to monitor your minikube using a utility like `watch` to refresh the output of `kubectl get` in a separate terminal window every one or two seconds.
```
brew install watch
watch -n 1 kubectl get pods,deployments --all-namespaces
```

### install helm
[Helm](https://docs.helm.sh/using_helm/#installing-helm) is used to package and install resources for Kubernetes. Helm packages are called charts. After [installing](https://docs.helm.sh/using_helm/#installing-helm) the helm CLI, use `helm init` to install the helm server (aka "tiller") in minikube, and point helm to the riff-charts repo.
```sh
helm init
helm repo add projectriff https://riff-charts.storage.googleapis.com
helm repo update
```
Watch kubectl for tiller to start running.

### install kafka
Install kafka on the `riff-system` namespace, with the release name `transport`.

```sh
kubectl create namespace riff-system
helm install projectriff/kafka \
  --name transport \
  --namespace riff-system
```
Watch kubectl for kafka to start running. You may need to wait a minute for the container images to be pulled, and for zookeeper to start first.

### install riff
Install riff on the same `riff-system` namespace, with the release name `demo`. For minikube you can turn off RBAC, and use a NodePort for the HTTP gateway.

```sh
helm install projectriff/riff \
  --name demo \
  --namespace riff-system \
  --version 0.0.4 \
  --set rbac.create=false \
  --set httpGateway.service.type=NodePort
```
Watch the riff-system namespace with kubectl, and wait for the riff http-gateway, topic-controller, and function-controller to start running.

```
watch -n 1 kubectl get po,deploy --namespace riff-system
```

```
NAME                                                READY     STATUS    RESTARTS   AGE
po/demo-riff-function-controller-7d959dbf4f-p7pnz   1/1       Running   0          5m
po/demo-riff-http-gateway-666bb96d6c-hzmvn          1/1       Running   0          5m
po/demo-riff-topic-controller-dcf76d565-mw6th       1/1       Running   0          5m
po/transport-kafka-68b986865b-6tsbk                 1/1       Running   3          11m
po/transport-zookeeper-85fc6df85c-v6kxx             1/1       Running   0          11m

NAME                                   DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/demo-riff-function-controller   1         1         1            1           5m
deploy/demo-riff-http-gateway          1         1         1            1           5m
deploy/demo-riff-topic-controller      1         1         1            1           5m
deploy/transport-kafka                 1         1         1            1           11m
deploy/transport-zookeeper             1         1         1            1           11m
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

```docker
FROM projectriff/node-function-invoker:0.0.4
ENV FUNCTION_URI /functions/function.js
ADD square.js ${FUNCTION_URI}
```

### Docker build
Use the docker CLI to build the function container image.
Note the image name and tag: `projectriff/square:v0001`.
```bash
docker build -t projectriff/square:v0001 .
```

After performing the build you can run the following to validate that your image was built.
```bash
docker images | grep square
```


### function and topic resource definitions
Create a single `square.yaml` file for both resource definitions.
Use the same image name and tag as the docker build step above.

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

### watch for functions and topics in the default namespace

```
watch -n 1 kubectl get functions,topics,pods,deployments
```

### apply the yaml to kubernetes

```sh
kubectl apply -f square.yaml
```

### trigger the function

```sh
export GATEWAY=`minikube service --namespace riff-system --url demo-riff-http-gateway`
export HEADER="Content-Type: text/plain"
curl $GATEWAY/requests/numbers -H "$HEADER" -w "\n" -d 10
```
If `10` is the input to the square function, the response should be `100`.