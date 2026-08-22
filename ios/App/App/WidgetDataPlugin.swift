import Foundation
import Capacitor
import WidgetKit

@objc(WidgetDataPlugin)
public class WidgetDataPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetDataPlugin"
    public let jsName = "WidgetData"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveUserInfo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearUserInfo", returnType: CAPPluginReturnPromise)
    ]

    let appGroupId = "group.com.dbmusic.viral"

    @objc func saveUserInfo(_ call: CAPPluginCall) {
        guard let role = call.getString("role"), let id = call.getString("id") else {
            call.reject("role, id 필요")
            return
        }
        if let defaults = UserDefaults(suiteName: appGroupId) {
            defaults.set(role, forKey: "userRole")
            defaults.set(id, forKey: "userId")
            defaults.synchronize()
        }
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }

    @objc func clearUserInfo(_ call: CAPPluginCall) {
        if let defaults = UserDefaults(suiteName: appGroupId) {
            defaults.removeObject(forKey: "userRole")
            defaults.removeObject(forKey: "userId")
            defaults.synchronize()
        }
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
