import UIKit
import Capacitor

@objc(MyBridgeViewController)
class MyBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(WidgetDataPlugin())
        // 아이폰 가장자리 스와이프로 뒤로가기/앞으로가기 제스처 활성화
        webView?.allowsBackForwardNavigationGestures = true
        applyZoomSettings()
        // 웹페이지 자체 로딩/렌더링이 끝난 뒤에도 다시 한번 강제 적용
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.applyZoomSettings()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) { [weak self] in
            self?.applyZoomSettings()
        }
    }

    private func applyZoomSettings() {
        webView?.scrollView.pinchGestureRecognizer?.isEnabled = true
        webView?.scrollView.bouncesZoom = true
        webView?.scrollView.minimumZoomScale = 1.0
        webView?.scrollView.maximumZoomScale = 5.0
    }
}
