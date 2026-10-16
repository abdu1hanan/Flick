"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Config plugin that injects all native Android customizations needed by ReelCounter.
 *
 * Handles:
 * 1. AndroidManifest permissions & component declarations
 * 2. Add Room, DataStore, Lifecycle, Coroutines, and kapt to app/build.gradle
 * 3. Register ReelCounterPackage in MainApplication
 * 4. Copy native resource files (xml, layout, drawable) and Kotlin files into android/
 *
 * All changes are applied via the plugin so `expo prebuild --clean` is safe.
 */
const withReelCounter = (config) => {
    // Step 1: Inject manifest entries
    config = (0, config_plugins_1.withAndroidManifest)(config, (mod) => {
        const manifest = mod.modResults;
        const app = manifest.manifest.application?.[0];
        if (!app)
            return mod;
        // ---- SERVICES ----
        if (!app.service)
            app.service = [];
        // AccessibilityService
        const hasService = app.service.some((s) => s.$?.['android:name'] === '.ReelAccessibilityService');
        if (!hasService) {
            app.service.push({
                $: {
                    'android:name': '.ReelAccessibilityService',
                    'android:exported': 'true',
                    'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
                    'android:label': '@string/accessibility_service_label',
                },
                'intent-filter': [
                    {
                        action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }],
                    },
                ],
                'meta-data': [
                    {
                        $: {
                            'android:name': 'android.accessibilityservice',
                            'android:resource': '@xml/accessibility_service_config',
                        },
                    },
                ],
            });
        }
        // ---- RECEIVERS ----
        if (!app.receiver)
            app.receiver = [];
        // ReelWidget
        const hasWidget = app.receiver.some((r) => r.$?.['android:name'] === '.ReelWidget');
        if (!hasWidget) {
            app.receiver.push({
                $: {
                    'android:name': '.ReelWidget',
                    'android:exported': 'true',
                },
                'intent-filter': [
                    {
                        action: [
                            { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
                            { $: { 'android:name': 'android.intent.action.DATE_CHANGED' } },
                            { $: { 'android:name': 'android.intent.action.TIME_SET' } },
                        ],
                    },
                ],
                'meta-data': [
                    {
                        $: {
                            'android:name': 'android.appwidget.provider',
                            'android:resource': '@xml/widget_info',
                        },
                    },
                ],
            });
        }
        // BootReceiver
        const hasBoot = app.receiver.some((r) => r.$?.['android:name'] === '.BootReceiver');
        if (!hasBoot) {
            app.receiver.push({
                $: {
                    'android:name': '.BootReceiver',
                    'android:exported': 'true',
                },
                'intent-filter': [
                    {
                        action: [{ $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } }],
                    },
                ],
            });
        }
        return mod;
    });
    // Step 2: Configure app/build.gradle
    config = (0, config_plugins_1.withAppBuildGradle)(config, (mod) => {
        let contents = mod.modResults.contents;
        // Ensure minSdk is at least 26
        if (contents.includes('minSdkVersion rootProject.ext.minSdkVersion')) {
            contents = contents.replace('minSdkVersion rootProject.ext.minSdkVersion', 'minSdkVersion Math.max(26, (rootProject.ext.minSdkVersion ?: 24) as int)');
        }
        // Add required dependencies (pure Android SQLiteOpenHelper is used, no Room or kapt needed)
        const customDependencies = `
    // Flick / ReelCounter dependencies
    implementation "androidx.appcompat:appcompat:1.7.0"
    implementation "androidx.datastore:datastore-preferences:1.1.1"
    implementation "org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0"
    implementation "androidx.lifecycle:lifecycle-service:2.8.2"
`;
        if (!contents.includes('androidx.datastore:datastore-preferences')) {
            contents = contents.replace('dependencies {', `dependencies {${customDependencies}`);
        }
        mod.modResults.contents = contents;
        return mod;
    });
    // Step 3: Register ReelCounterPackage in MainApplication
    config = (0, config_plugins_1.withMainApplication)(config, (mod) => {
        let contents = mod.modResults.contents;
        if (!contents.includes('add(ReelCounterPackage())')) {
            if (contents.includes('PackageList(this).packages.apply {')) {
                contents = contents.replace('PackageList(this).packages.apply {', 'PackageList(this).packages.apply {\n          add(ReelCounterPackage())');
            }
        }
        mod.modResults.contents = contents;
        return mod;
    });
    // Step 4: Copy native resource files and Kotlin source code
    config = (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        (mod) => {
            const projectRoot = mod.modRequest.projectRoot;
            const androidResDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
            const nativeAssetsDir = path.join(projectRoot, 'assets', 'native');
            // XML resources
            const xmlSrc = path.join(nativeAssetsDir, 'xml');
            const xmlDst = path.join(androidResDir, 'xml');
            copyDir(xmlSrc, xmlDst);
            // Layout resources
            const layoutSrc = path.join(nativeAssetsDir, 'layout');
            const layoutDst = path.join(androidResDir, 'layout');
            copyDir(layoutSrc, layoutDst);
            // Drawable resources
            const drawableSrc = path.join(nativeAssetsDir, 'drawable');
            const drawableDst = path.join(androidResDir, 'drawable');
            copyDir(drawableSrc, drawableDst);
            // Kotlin source files — copy to app's java directory
            const kotlinSrcDir = path.join(projectRoot, 'modules', 'reelcounter-native', 'android', 'src', 'main', 'java', 'com', 'reelcounter', 'flick');
            const kotlinDstDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'java', 'com', 'reelcounter', 'flick');
            copyDir(kotlinSrcDir, kotlinDstDir);
            // Ensure strings.xml has required entries
            ensureStringsEntries(androidResDir);
            // Ensure proguard rules for Room & Flick
            ensureProguardRules(projectRoot);
            return mod;
        },
    ]);
    return config;
};
function ensureProguardRules(projectRoot) {
    const proguardPath = path.join(projectRoot, 'android', 'app', 'proguard-rules.pro');
    if (!fs.existsSync(proguardPath))
        return;
    let content = fs.readFileSync(proguardPath, 'utf8');
    if (!content.includes('com.reelcounter.flick')) {
        content += `\n# Flick classes
-keep class com.reelcounter.flick.** { *; }
-dontwarn com.reelcounter.flick.**
`;
        fs.writeFileSync(proguardPath, content, 'utf8');
    }
}
function copyDir(src, dst) {
    if (!fs.existsSync(src))
        return;
    fs.mkdirSync(dst, { recursive: true });
    for (const file of fs.readdirSync(src)) {
        const srcFile = path.join(src, file);
        const dstFile = path.join(dst, file);
        if (fs.statSync(srcFile).isDirectory()) {
            copyDir(srcFile, dstFile);
        }
        else {
            fs.copyFileSync(srcFile, dstFile);
        }
    }
}
function ensureStringsEntries(resDir) {
    const stringsPath = path.join(resDir, 'values', 'strings.xml');
    if (!fs.existsSync(stringsPath))
        return;
    let content = fs.readFileSync(stringsPath, 'utf8');
    const entries = {
        accessibility_service_label: 'Flick Reel Counter',
        accessibility_service_description: 'Counts Instagram Reels you watch. No content is read or stored.',
        widget_description: 'Shows your daily Instagram Reels count.',
    };
    for (const [name, value] of Object.entries(entries)) {
        if (!content.includes(`name="${name}"`)) {
            content = content.replace('</resources>', `    <string name="${name}">${value}</string>\n</resources>`);
        }
    }
    fs.writeFileSync(stringsPath, content, 'utf8');
}
exports.default = withReelCounter;
