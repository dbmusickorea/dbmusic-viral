import UIKit
import Capacitor

@objc(MyBridgeViewController)
class MyBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(WidgetDataPlugin())
        // 아이폰 가장자리 스와이프로 뒤로가기/앞으로가기 제스처 활성화
        webView?.allowsBackForwardNavigationGestures = true
        // 손가락 핀치 확대/축소 제스처 명시적으로 활성화 (기본값이 꺼져있는 경우 대비)
        webView?.scrollView.pinchGestureRecognizer?.isEnabled = true
        webView?.scrollView.bouncesZoom = true
        // 확대 배율 범위를 네이티브 쪽에서도 직접 강제 지정 (웹 viewport 설정만으로 부족한 경우 대비)
        webView?.scrollView.minimumZoomScale = 1.0
        webView?.scrollView.maximumZoomScale = 5.0
    }
}
