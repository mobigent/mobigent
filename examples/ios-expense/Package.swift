// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "MobigentExpenseExample",
    platforms: [.iOS(.v15), .macOS(.v12)],
    dependencies: [
        .package(path: "../../packages/ios")
    ],
    targets: [
        .executableTarget(
            name: "MobigentExpenseExample",
            dependencies: [
                .product(name: "Mobigent", package: "ios")
            ]
        )
    ]
)
