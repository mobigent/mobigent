# Native SDK Publishing

The repository publishes release artifacts from GitHub Actions when a SemVer tag is pushed.

Current release channels:

- GitHub Release tarballs for `@mobigent/core`, `@mobigent/providers`, `@mobigent/react-native`, and `@mobigent/gateway`
- GitHub Packages for the same npm packages under the `@mobigent` scope
- Swift Package Manager through Git tags

npmjs.com publishing is enabled in the release workflow when the repository has an `NPM_TOKEN` secret.

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

Current release path:

1. Validate the Android library and example from CI.
2. Ship source and release artifacts through the public Git tag.
3. Keep the local project dependency path documented until Maven Central credentials are configured.

Maven Central publishing still needs signing keys and Central Portal credentials. That can be added without changing the SDK code or gateway protocol.

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
