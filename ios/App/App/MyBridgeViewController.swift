import UIKit
import WebKit
import Capacitor

@objc(MyBridgeViewController)
class MyBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(WidgetDataPlugin())
        // 아이폰 가장자리 스와이프로 뒤로가기/앞으로가기 제스처 활성화
        webView?.allowsBackForwardNavigationGestures = true
        applyZoomSettings()
    }

    override open func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        super.webView(webView, didFinish: navigation)
        // 웹페이지 로딩이 끝날 때마다 확대 설정을 다시 강제 적용
        // (페이지 자체 viewport 처리로 인해 값이 초기화될 수 있어서 매 로딩 후 재적용)
        applyZoomSettings()
    }

    private func applyZoomSettings() {
        webView?.scrollView.pinchGestureRecognizer?.isEnabled = true
        webView?.scrollView.bouncesZoom = true
        webView?.scrollView.minimumZoomScale = 1.0
        webView?.scrollView.maximumZoomScale = 5.0
    }
}
