---
id: java
title: Java Function Invoker
sidebar_label: Java
---

Java functions will be invoked using a [Java Function Invoker](https://github.com/projectriff/java-function-invoker) that is provided by riff when you build the function.

The _Java Function Invoker_ is a Spring Boot application which will locate your function based on configuration settings, and invoke the function for each request.

The riff function support for the Java language relies on function code being written using interfaces like `Function<T,R>`, `Supplier<T>`, or `Consumer<T>` from the `java.util.function` package in the Java SE platform.

The implementation can be provided as a plain Java class or as part of a Spring Boot app.

## Creating a Spring Boot based function

Begin by creating a new project using [Spring Initializr](start.spring.io).  You can select either `Maven Project` or `Gradle Project` as the project type but the language must be `Java`. Pick a name for your project and any dependencies that your function requires. The final step is to download the generated zip file and extracting the contents.

### Adding functions

You can now add a `@Bean` providing the function implementation. It can either be added as a separate `@Configuration` source file or for simple functions just add it to the main application file. Here we add the `upper` function to the main `@SpringBootApplication` source file:

```java
package com.example.upper;

import java.util.function.Function;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class UpperApplication {

	@Bean
	public Function<String, String> upper() {
		return String::toUpperCase;
	}

	public static void main(String[] args) {
		SpringApplication.run(UpperApplication.class, args);
	}

}
```

### Building the Spring Boot based function

You can build your function either from local source or from source committed to a GitHub repository. For local build use:

```bash
riff function create upper --local-path . --handler upper
```

When building from a GitHub repo use something like (replace the `<owner>` placeholder with your account):

```bash
riff function create upper --git-repo https://github.com/<owner>/upper.git --handler upper
```

The `--handler` option is the name of the `@Bean` that was used for the function. If your application only has a single function bean then you can omit this option.

> NOTE: If you haven't specified a default image prefix when setting the credentials then you need to provide an _&#8209;&#8209;image_ option for the function create command.

### Running a Spring Boot based function locally

If you would like to run your Spring Boot based function locally you can include web support when creating the project with Spring Initializr. Add the _Function_ dependency plus either _Spring Web Starter_ or _Spring Reactive Web_.

You can now run your function application locally using:

```bash
mvn spring-boot:run
```

Once the app starts up, open another terminal and invoke the function using `curl`:

```bash
curl localhost:8080 -H 'Content-Type: text/plain' -w '\n' -d hello
```

If your application contains multiple functions you need to provide the bean name as the path. You could use this to invoke a `lower` function:

```bash
curl localhost:8080/lower -H 'Content-Type: text/plain' -w '\n' -d hello
```

## Creating a plain Java function

You can create a function using plain Java code, without having to depend on Spring Boot for configuration. This requires some more work when setting things up. You need to create your own build scripts using either Maven or Gradle. There are no required dependencies but you can provide dependencies that your function requires. You can find an example here: https://github.com/projectriff-samples/java-hello

When creating plain Java function your function must implement the `java.util.function.Function` interface. Here is the function from the above mentioned sample:

```java
package functions;

import java.util.function.Function;

public class Hello implements Function<String, String> {

	public String apply(String name) {
		return "Hello " + name;
	}
}
```

### Building the plain Java function

Just as for Spring Boot based functions you can build your plain Java function either from local source or from source committed to a GitHub repository. Here we will only show the build from the GitHub repo:

```bash
riff function create hello --git-repo https://github.com/projectriff-samples/java-hello.git --handler functions.Hello
```

The `--handler` option is the fully qualified name of the class that provides the function implementation.

## Deploying and invoking the function

To deploy your function you need to select a runtime. The two options currently available are `core` and `knative` and we will select `core`for this example:

```bash
riff core deployer create upper --function-ref upper
```

This should create the resources needed for a deploying the function. You can invoke the function using `kubectl proxy` command to access the service that was created.

In a separate terminal issue:
```bash
kubectl port-forward svc/upper-deployer 8080:80
```

You can now invoke the function using the following `curl` command:

```bash
curl localhost:8080 -H 'Content-Type: text/plain' -w '\n' -d hello
```
