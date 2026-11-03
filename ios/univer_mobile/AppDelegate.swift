import UIKit

// React Native is started from SceneDelegate: apps built with the iOS 27 SDK must adopt the UIScene
// lifecycle, otherwise UIKit kills them at launch (issue #76).
@main
class AppDelegate: UIResponder, UIApplicationDelegate, RNAppAuthAuthorizationFlowManager {
  // react-native-app-auth requires the app delegate to conform to RNAppAuthAuthorizationFlowManager
  // (it raises an exception otherwise) and sets itself here for the duration of a login/logout flow.
  // SceneDelegate hands the OAuth redirect (univer://auth/...) back through it.
  public weak var authorizationFlowManagerDelegate: RNAppAuthAuthorizationFlowManagerDelegate?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    true
  }
}
