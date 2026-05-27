# Native SDK Publishing Plan

The native SDKs are package-ready in the repository, but public registry publishing is intentionally separate from the first implementation.

## iOS

Current state:

- Swift Package lives in `packages/ios`
- module name is `Mobigent`
- target is iOS 15+
- tests run with `swift test`

Recommended release path:

1. Keep `Package.swift` stable at `packages/ios`.
2. Tag repo releases with SemVer.
3. Add an iOS release note section for SDK compatibility.
4. Let Swift Package Manager consume the Git tag.

Local integration before tagging:

```swift
.package(path: "../mobigent/packages/ios")
```

Future tagged integration:

```swift
.package(url: "https://github.com/mobigent/mobigent", from: "0.1.0")
```

## Android

Current state:

- Gradle/Kotlin library lives in `packages/android`
- group is `io.mobigent`
- artifact id is `mobigent-android`
- target is Android API 23+
- JVM target is 17

Recommended release path:

1. Add signing keys and Maven Central credentials as GitHub secrets.
2. Publish `io.mobigent:mobigent-android` from CI.
3. Attach generated API docs and changelog to each release.
4. Keep the local project dependency path documented until the first public release is available.

Local integration before Maven Central:

```kotlin
include(":mobigent-android")
project(":mobigent-android").projectDir = file("../mobigent/packages/android")

dependencies {
  implementation(project(":mobigent-android"))
}
```

Future Maven Central integration:

```kotlin
dependencies {
  implementation("io.mobigent:mobigent-android:0.1.0")
}
```
