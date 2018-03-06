---
title: "Running riff on GKE with RBAC"
permalink: /docs/running-on-gke-with-rbac/
excerpt: "How to run **riff** with Role-Based Access Control"
header:
  overlay_image: /images/gke.png
  overlay_filter: 0.4
  overlay_color: "#555"
---


## Getting started on GKE with [RBAC](https://kubernetes.io/docs/admin/authorization/rbac/)

### TL;DR
1. select a Project in the Google Cloud console, install gcloud and kubectl
2. create a GKE cluster with Kubernetes v1.8.x or v1.9.x  (defaults to RBAC)
3. configure credentials to target the GKE cluster from kubectl
4. remove the CPU request limit for containers in the new cluster
5. grant yourself cluster-admin permissions
6. install helm and start the helm server (tiller) with RBAC
7. install riff with RBAC

The remaining steps are the same as [getting started on GKE](../getting-started-on-gke/).

### create a Google Cloud project
A project is required to consume any Google Cloud services, including GKE clusters. When you log into the [console](https://console.cloud.google.com/) you can select or create a project from the dropdown at the top.

### install gcloud
Follow the [quickstart instructions](https://cloud.google.com/sdk/docs/quickstarts) to install the [Google Cloud SDK](https://cloud.google.com/sdk/) which includes the `gcloud` CLI. You may need to add the `google-cloud-sdk/bin` directory to your path. Once installed, authorize and configure gcloud for your account.

```sh
gcloud init
```

### install kubectl
[Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) is the Kubernetes CLI. It is used to manage minikube as well as hosted Kubernetes clusters like GKE. If you don't already have kubectl on your machine, you can use gcloud to install it.

```
gcloud components install kubectl
```

### create a GKE cluster
Look for [Kubernetes Engine](https://console.cloud.google.com/kubernetes/) in the console, and create a new cluster. Select a Cluster Version of 1.8+ or later in the console to enable RBAC. The minimum configuration for riff on GKE is single node cluster with 2 vCPUs and 7.5GB memory.


### configure credentials to target the GKE cluster
Once the cluster has been created, you will see a `Connect` button in the console. Run the first command `gcloud container clusters get-credentials ...` to fetch the credentials and add a new context for kubectl. Your kubectl context will be switched to the new cluster.

```
kubectl config current-context
```

### remove CPU request limit
Remove the GKE default request of 0.1 CPU's per container which limits how many containers your cluster is allowed to schedule (effectively 10 per vCPU).

```
kubectl delete limitrange limits
```

### grant yourself cluster-admin permissions
This looks up your account name (usually your email address) and then creates a new cluster role binding, to make you a cluster-admin.

```
export GCP_USER=$(gcloud config get-value account | head -n 1)
kubectl create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=$GCP_USER
```

If you encounter "Error from server (Forbidden)...", ask your GKE project admin to grant you `container.clusterRoleBindings.create` permissions.

Alternatively, lookup the admin password for the cluster in the console, and then issue the following command, entering the admin password when prompted.
```
read -rsp "password: " APW && echo && kubectl --username=admin --password="$APW" create clusterrolebinding cluster-admin-binding --clusterrole=cluster-admin --user=$GCP_USER
```

### start the helm server (tiller) with RBAC
Using helm with RBAC requires that the helm server also runs with cluster-admin privileges using a service account in the `kube-system` namespace.

The following commands come from the Helm getting started doc in the [riff repo](https://github.com/projectriff/riff/blob/master/Getting-Started.adoc#install-helm) on GitHub.

```
kubectl -n kube-system create serviceaccount tiller
kubectl create clusterrolebinding tiller --clusterrole cluster-admin --serviceaccount=kube-system:tiller
helm init --service-account=tiller
```

### install riff with RBAC
Install the kafka helm chart using the name "transport", and riff 0.0.4 with whatever name you prefer.

``` 
kubectl create namespace riff-system
helm install --name transport --namespace riff-system riffrepo/kafka
helm install riffrepo/riff --version 0.0.4 --name demo
```

At this point everything else should work the same as [getting started on GKE](../getting-started-on-gke/) without RBAC.

### to access the Kubernetes dashboard
Recent releases of the Kubernetes dashboard require a bearer token in order to login. The easiest way to do this, is to lookup the token associated with the `tiller` account created above and paste it into the login form.

```
kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep tiller | awk '{print $1}')
```

For more details see the dashboard [wiki](https://github.com/kubernetes/dashboard/wiki/Access-control#introduction) and [issue #2474](https://github.com/kubernetes/dashboard/issues/2474).
