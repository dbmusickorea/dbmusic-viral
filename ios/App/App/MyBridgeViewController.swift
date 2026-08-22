import UIKit
import Capacitor

@objc(MyBridgeViewController)
class MyBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(WidgetDataPlugin())
    }
}
