import Foundation

class UserDefaultsManager {

    static let shared = UserDefaultsManager()

    private let defaults = UserDefaults.standard

    private struct Keys {
        static let darkModeEnabled = "darkModeEnabled"
        static let fontSize = "fontSize"
        static let themeColorIndex = "themeColorIndex"
        static let defaultCategory = "defaultCategory"
    }

    var darkModeEnabled: Bool {
        didSet {
            defaults.set(darkModeEnabled, forKey: Keys.darkModeEnabled)
        }
    }

    var fontSize: Float {
        didSet {
            let clamped = min(max(fontSize, 12.0), 24.0)
            fontSize = clamped
            defaults.set(fontSize, forKey: Keys.fontSize)
        }
    }

    var themeColorIndex: Int {
        didSet {
            defaults.set(themeColorIndex, forKey: Keys.themeColorIndex)
        }
    }

    var defaultCategory: String {
        didSet {
            defaults.set(defaultCategory, forKey: Keys.defaultCategory)
        }
    }

    private init() {
        darkModeEnabled = defaults.object(forKey: Keys.darkModeEnabled) as? Bool ?? false
        fontSize = defaults.object(forKey: Keys.fontSize) as? Float ?? 16.0
        themeColorIndex = defaults.object(forKey: Keys.themeColorIndex) as? Int ?? 0
        defaultCategory = defaults.object(forKey: Keys.defaultCategory) as? String ?? "General"
    }
}
