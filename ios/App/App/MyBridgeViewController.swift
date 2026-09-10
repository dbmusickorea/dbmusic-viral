import UIKit
import WebKit
import Capacitor

@objc(MyBridgeViewController)
class MyBridgeViewController: CAPBridgeViewController {
    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration(for: instanceConfiguration)
        configuration.ignoresViewportScaleLimits = true
        return configuration
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(WidgetDataPlugin())
        webView?.allowsBackForwardNavigationGestures = true
        // 두 손가락 이상 터치(핀치 확대 포함)가 기본값으로 꺼져있을 가능성에 대비해 명시적으로 켜기
        webView?.isMultipleTouchEnabled = true
        webView?.scrollView.isMultipleTouchEnabled = true
    }
}
