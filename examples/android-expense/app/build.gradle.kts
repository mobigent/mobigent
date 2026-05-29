plugins {
    id("com.android.application")
    kotlin("android")
}

android {
    namespace = "io.mobigent.example"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.mobigent.example"
        minSdk = 23
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.10"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        jvmToolchain(17)
    }
}

dependencies {
    implementation(project(":mobigent-android"))
}
