// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "Mobigent",
    platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(name: "Mobigent", targets: ["Mobigent"])
    ],
    targets: [
        .target(name: "Mobigent"),
        .testTarget(name: "MobigentTests", dependencies: ["Mobigent"])
    ]
)
