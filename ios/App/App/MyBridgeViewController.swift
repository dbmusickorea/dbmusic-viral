import UIKit
import Capacitor

@objc(MyBridgeViewController)
class MyBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(WidgetDataPlugin())
        // 아이폰 가장자리 스와이프로 뒤로가기/앞으로가기 제스처 활성화
        webView?.allowsBackForwardNavigationGestures = true
    }
}
