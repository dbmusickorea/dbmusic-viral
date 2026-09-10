import UIKit
import WebKit
import Capacitor

@objc(MyBridgeViewController)
class MyBridgeViewController: CAPBridgeViewController {
    // 웹뷰가 실제로 만들어지기 "전" 시점에 설정을 가로채는 Capacitor 공식 지원 지점
    override open func webViewConfiguration(for instanceConfiguration: InstanceConfiguration) -> WKWebViewConfiguration {
        let configuration = super.webViewConfiguration(for: instanceConfiguration)
        // 웹페이지의 viewport 설정(user-scalable 등)과 무관하게 항상 확대 가능하도록 강제
        configuration.ignoresViewportScaleLimits = true
        return configuration
    }

    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(WidgetDataPlugin())
        // 아이폰 가장자리 스와이프로 뒤로가기/앞으로가기 제스처 활성화
        webView?.allowsBackForwardNavigationGestures = true
        webView?.scrollView.pinchGestureRecognizer?.isEnabled = true
        webView?.scrollView.bouncesZoom = true
        webView?.scrollView.minimumZoomScale = 1.0
        webView?.scrollView.maximumZoomScale = 5.0
    }
}
