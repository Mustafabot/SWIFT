import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        let tabBarController = MainTabBarController()
        window?.rootViewController = tabBarController
        window?.makeKeyAndVisible()
        let themeIndex = UserDefaultsManager.shared.themeColorIndex
        let colors: [UIColor] = [.blue, .green, .orange]
        let selectedColor = colors[themeIndex]
        if let navControllers = tabBarController.viewControllers as? [UINavigationController] {
            for nav in navControllers {
                nav.navigationBar.tintColor = selectedColor
            }
        }
        tabBarController.tabBar.tintColor = selectedColor
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
    }

    func applicationWillTerminate(_ application: UIApplication) {
        CoreDataManager.shared.saveContext()
    }
}
