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
2. install kafka and riff using two helm charts
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
Once minikube is running you can open a browser-based dashboard with `minikube dashboard`.

### configure docker to build containers in minikube
This is only reqired once per terminal session. See [here](https://kubernetes.io/docs/getting-started-guides/minikube/#reusing-the-docker-daemon) for more details.
```
eval $(minikube docker-env)
```
Use `docker ps` to see the containers running in minikube.

### install helm
[Helm](https://docs.helm.sh/using_helm/#installing-helm) is used to package and install resources for Kubernetes. Helm packages are called charts. After [installing](https://docs.helm.sh/using_helm/#installing-helm) the helm CLI, point helm to the riff-charts repo.
```
helm repo add riffrepo https://riff-charts.storage.googleapis.com
helm repo update
```

### install kafka and riff
Use `helm init` to install the helm server (aka "tiller") in minikube, then, after waiting a minute, install kafka on the `riff-system` namespace, and then riff with service type `NodePort`.
```
helm init
kubectl create namespace riff-system
helm install --name transport --namespace riff-system riffrepo/kafka
helm install riffrepo/riff --name demo  --version 0.0.4 --set rbac.create=false --set httpGateway.service.type=NodePort
```

### monitor your minikube
At this point it is useful to monitor your minikube using a utility like `watch` to refresh a separate terminal window every one or two seconds. After a minute or so you should see all the deployments `AVAILABLE` in minikube.
```
brew install watch
watch -n 1 kubectl get functions,topics,pods,services,deploy
```

```
Every 1.0s: kubectl get functions,topics,pods,services,deploy

NAME                                                READY     STATUS    RESTARTS   AGE
po/demo-riff-function-controller-6975dbdc7d-ccgxq   1/1       Running   0          5m
po/demo-riff-http-gateway-64fc56bd96-kk45j          1/1       Running   3          5m
po/demo-riff-kafka-c7f456685-jj9t9                  1/1       Running   2          5m
po/demo-riff-topic-controller-58694bb5bf-njspv      1/1       Running   0          5m
po/demo-riff-zookeeper-6fd5c5bd54-lmqk9             1/1       Running   0          5m

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
svc/demo-riff-function-controller   ClusterIP   10.96.60.96     <none>        80/TCP         5m
svc/demo-riff-http-gateway          NodePort    10.98.119.212   <none>        80:30462/TCP   5m
svc/demo-riff-kafka                 ClusterIP   10.99.22.48     <none>        9092/TCP       5m
svc/demo-riff-zookeeper             ClusterIP   10.98.103.213   <none>        2181/TCP       5m
svc/kubernetes                      ClusterIP   10.96.0.1       <none>        443/TCP        6m

NAME                                   DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/demo-riff-function-controller   1         1         1            1           5m
deploy/demo-riff-http-gateway          1         1         1            1           5m
deploy/demo-riff-kafka                 1         1         1            1           5m
deploy/demo-riff-topic-controller      1         1         1            1           5m
deploy/demo-riff-zookeeper             1         1         1            1           5m
```

On slower network connections it may take longer to stabilize the system after pulling down all the images. Instead of waiting you can try to "purge" the riff components (without deleting the images from the cache) and then reinstall the chart as with the same command as before.

```
helm delete --purge demo
helm install riffrepo/riff --name demo --set httpGateway.service.type=NodePort
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

### apply the yaml to kubernetes
```
kubectl apply -f square.yaml
```

### trigger the function
```
export GATEWAY=`minikube service --url demo-riff-http-gateway`
export HEADER="Content-Type: text/plain"
curl $GATEWAY/requests/numbers -H "$HEADER" -w "\n" -d 10
```
If `10` is the input to the square function, the response should be `100`.