---
id: java
title: Java Function Invoker
sidebar_label: Java
---

Java functions are invoked using a [Java Function Invoker](https://github.com/projectriff/java-function-invoker) that is provided by riff when you build the function.

The _Java Function Invoker_ is a Spring Boot application which locates your function based on configuration settings, and invoke the function for each request.

The riff function support for the Java language relies on function code being written using interfaces like `Function<T,R>`, `Supplier<T>`, or `Consumer<T>` from the `java.util.function` package in the Java SE platform.

The implementation can be provided as a plain Java class or as part of a Spring Boot app.

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

### building the plain Java function

Just as for Spring Boot based functions you can build your plain Java function either from local source or from source committed to a GitHub repository. Here we will only show the build from the GitHub repo:

```
riff function create hello --handler functions.Hello --git-repo https://github.com/projectriff-samples/java-hello.git
```

The `--handler` option is the fully qualified name of the class that provides the function implementation.

## Creating a Spring Boot based function

Begin by creating a new project using [Spring Initializr](start.spring.io).  You can select either `Maven Project` or `Gradle Project` as the project type but the language must be `Java`. Pick a name for your project and any dependencies that your function requires. The final step is to download the generated zip file and extracting the contents.

### adding functions

You can now add a `@Bean` providing the function implementation. It can either be added as a separate `@Configuration` source file or for simple functions just add it to the main application file. Here we add the `uppercase` function to the main `@SpringBootApplication` source file:

```java
package com.example.upper;

import java.util.function.Function;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class UppercaseApplication {

	@Bean
	public Function<String, String> uppercase() {
		return s -> s.toUpperCase();
	}

	public static void main(String[] args) {
		SpringApplication.run(UppercaseApplication.class, args);
	}

}
```

### building the Spring Boot based function

You can build your function either from local source or from source committed to a GitHub repository.

> NOTE: The `--local-path` builds option is disabled on Windows.

For local build use:

```
riff function create uppercase --local-path . --handler uppercase
```

When building from a GitHub repo use something like (replace the `--git-repo` argument with your own repository URL):

```
riff function create uppercase --handler uppercase --git-repo https://github.com/projectriff-samples/java-boot-uppercase.git
```

The `--handler` option is the name of the `@Bean` that was used for the function. If your application only has a single function bean then you can omit this option.

> NOTE: If you haven't specified a default image prefix when setting the credentials then you need to provide an _&#8209;&#8209;image_ option for the function create command.

### running a Spring Boot based function locally

If you would like to run your Spring Boot based function locally you can include web support when creating the project with Spring Initializr. Add the _Function_ dependency plus either _Spring Web Starter_ or _Spring Reactive Web_.

You can now run your function application locally using:

```
mvn spring-boot:run
```

Once the app starts up, open another terminal and invoke the function using `curl`:

```
curl localhost:8080 -H 'Content-Type: text/plain' -w '\n' -d hello
```

If your application contains multiple functions you need to provide the bean name as the path. You could use this to invoke a `lower` function:

```
curl localhost:8080/lower -H 'Content-Type: text/plain' -w '\n' -d hello
```

## Deploying a function

Please see the runtime documentation for how to deploy and invoke the function.

- [Core runtime](../runtimes/core.md)
- [Knative runtime](../runtimes/knative.md)

## Cleanup

When done with the function, delete the function resource to stop creating new builds. 

> NOTE: Images built by the function continue to exist in the container registry and may continue to be consumed by a runtime.

```sh
riff function delete hello
```

```
Deleted function "hello"
```
