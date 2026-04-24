import UIKit

class MainTabBarController: UITabBarController {

    override func viewDidLoad() {
        super.viewDidLoad()
        setupTabs()
        applyTheme()
    }

    private func setupTabs() {
        let dashboardVC = DashboardViewController()
        dashboardVC.title = "Home"
        let dashboardNav = UINavigationController(rootViewController: dashboardVC)
        dashboardNav.tabBarItem = UITabBarItem(tabBarSystemItem: .favorites, tag: 0)

        let noteListVC = NoteListViewController()
        noteListVC.title = "Notes"
        let noteListNav = UINavigationController(rootViewController: noteListVC)
        noteListNav.tabBarItem = UITabBarItem(tabBarSystemItem: .recents, tag: 1)

        let noteEditVC = NoteEditViewController()
        noteEditVC.title = "New"
        let noteEditNav = UINavigationController(rootViewController: noteEditVC)
        noteEditNav.tabBarItem = UITabBarItem(tabBarSystemItem: .compose, tag: 2)

        let settingsVC = SettingsViewController()
        settingsVC.title = "Settings"
        let settingsNav = UINavigationController(rootViewController: settingsVC)
        settingsNav.tabBarItem = UITabBarItem(tabBarSystemItem: .more, tag: 3)

        viewControllers = [dashboardNav, noteListNav, noteEditNav, settingsNav]
    }

    private func applyTheme() {
        let themeIndex = UserDefaultsManager.shared.themeColorIndex
        let colors: [UIColor] = [.blue, .green, .orange]
        let selectedColor = colors[themeIndex]

        tabBar.tintColor = selectedColor

        if let navControllers = viewControllers as? [UINavigationController] {
            for nav in navControllers {
                nav.navigationBar.tintColor = selectedColor
            }
        }

        let isDarkMode = UserDefaultsManager.shared.darkModeEnabled
        if isDarkMode {
            tabBar.barStyle = .black
        } else {
            tabBar.barStyle = .default
        }
    }
}
