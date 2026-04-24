import UIKit

class SettingsViewModel {

    static let categories = ["General", "Work", "Personal", "Ideas"]

    var isDarkModeEnabled: Bool {
        return UserDefaultsManager.shared.darkModeEnabled
    }

    var fontSize: Float {
        return UserDefaultsManager.shared.fontSize
    }

    var fontSizeCGFloat: CGFloat {
        return CGFloat(UserDefaultsManager.shared.fontSize)
    }

    var themeColorIndex: Int {
        return UserDefaultsManager.shared.themeColorIndex
    }

    var defaultCategoryIndex: Int {
        let category = UserDefaultsManager.shared.defaultCategory
        if let index = SettingsViewModel.categories.index(of: category) {
            return index
        }
        return 0
    }

    var onSettingsChanged: (() -> Void)?

    func toggleDarkMode() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let newValue = !UserDefaultsManager.shared.darkModeEnabled
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                UserDefaultsManager.shared.darkModeEnabled = newValue
                self.onSettingsChanged?()
            }
        }
    }

    func setFontSize(_ size: Float) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let clampedSize = min(max(size, 12.0), 24.0)
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                UserDefaultsManager.shared.fontSize = clampedSize
                self.onSettingsChanged?()
            }
        }
    }

    func setThemeColorIndex(_ index: Int) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                UserDefaultsManager.shared.themeColorIndex = index
                self.onSettingsChanged?()
            }
        }
    }

    func setDefaultCategoryIndex(_ index: Int) {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            let category: String
            if index >= 0 && index < SettingsViewModel.categories.count {
                category = SettingsViewModel.categories[index]
            } else {
                category = "General"
            }
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                UserDefaultsManager.shared.defaultCategory = category
                self.onSettingsChanged?()
            }
        }
    }

    func clearCache() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            ImageLoader.shared.clearCache()
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.onSettingsChanged?()
            }
        }
    }
}
