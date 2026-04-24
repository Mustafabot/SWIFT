import UIKit

class SettingsViewController: UIViewController {

    private var viewModel: SettingsViewModel!

    private lazy var tableView: UITableView = {
        let tv = UITableView(frame: .zero, style: .grouped)
        tv.translatesAutoresizingMaskIntoConstraints = false
        tv.dataSource = self
        tv.delegate = self
        tv.estimatedRowHeight = 44
        tv.rowHeight = UITableViewAutomaticDimension
        tv.register(UITableViewCell.self, forCellReuseIdentifier: "SwitchCell")
        tv.register(UITableViewCell.self, forCellReuseIdentifier: "SliderCell")
        tv.register(UITableViewCell.self, forCellReuseIdentifier: "SegmentedCell")
        tv.register(UITableViewCell.self, forCellReuseIdentifier: "ButtonCell")
        tv.register(UITableViewCell.self, forCellReuseIdentifier: "ValueCell")
        return tv
    }()

    private let sectionTitles = ["Appearance", "Notes", "About"]

    override func viewDidLoad() {
        super.viewDidLoad()
        viewModel = SettingsViewModel()
        setupUI()
    }

    private func setupUI() {
        title = "Settings"
        view.backgroundColor = .white
        view.addSubview(tableView)

        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    @objc private func darkModeSwitchChanged(_ sender: UISwitch) {
        viewModel.toggleDarkMode()
        applyDarkMode()
        tableView.reloadData()
    }

    @objc private func fontSizeSliderChanged(_ sender: UISlider) {
        let size = sender.value
        viewModel.setFontSize(size)
        if let valueLabel = (sender.superview?.viewWithTag(202)) as? UILabel {
            valueLabel.text = "\(Int(size))"
        }
    }

    @objc private func themeColorChanged(_ sender: UISegmentedControl) {
        viewModel.setThemeColorIndex(sender.selectedSegmentIndex)
        applyThemeColor(sender.selectedSegmentIndex)
    }

    @objc private func defaultCategoryChanged(_ sender: UISegmentedControl) {
        viewModel.setDefaultCategoryIndex(sender.selectedSegmentIndex)
    }

    @objc private func clearCacheTapped() {
        let alert = UIAlertController(title: "Clear Cache", message: "Are you sure you want to clear the image cache?", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        alert.addAction(UIAlertAction(title: "Clear", style: .destructive, handler: { [weak self] _ in
            guard let strongSelf = self else { return }
            strongSelf.viewModel.clearCache()
            ImageLoader.shared.clearCache()
        }))
        present(alert, animated: true, completion: nil)
    }

    private func applyDarkMode() {
        let enabled = viewModel.isDarkModeEnabled
        if enabled {
            navigationController?.navigationBar.barStyle = .black
            view.backgroundColor = UIColor(red: 0.12, green: 0.12, blue: 0.12, alpha: 1.0)
            tableView.backgroundColor = UIColor(red: 0.12, green: 0.12, blue: 0.12, alpha: 1.0)
        } else {
            navigationController?.navigationBar.barStyle = .default
            view.backgroundColor = .white
            tableView.backgroundColor = .white
        }
    }

    private func applyThemeColor(_ index: Int) {
        let colors: [UIColor] = [.blue, .green, .orange]
        let selectedColor = colors[index]
        navigationController?.navigationBar.tintColor = selectedColor
        tabBarController?.tabBar.tintColor = selectedColor
    }
}

extension SettingsViewController: UITableViewDataSource {

    func numberOfSections(in tableView: UITableView) -> Int {
        return sectionTitles.count
    }

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch section {
        case 0: return 3
        case 1: return 2
        case 2: return 2
        default: return 0
        }
    }

    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        return sectionTitles[section]
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let isDark = viewModel.isDarkModeEnabled

        switch (indexPath.section, indexPath.row) {
        case (0, 0):
            let cell = tableView.dequeueReusableCell(withIdentifier: "SwitchCell", for: indexPath)
            cell.textLabel?.text = "Dark Mode"
            cell.textLabel?.textColor = isDark ? .white : .black
            cell.backgroundColor = isDark ? UIColor(red: 0.2, green: 0.2, blue: 0.2, alpha: 1.0) : .white
            cell.selectionStyle = .none
            if cell.accessoryView == nil || !(cell.accessoryView is UISwitch) {
                let switchView = UISwitch()
                switchView.addTarget(self, action: #selector(darkModeSwitchChanged(_:)), for: .valueChanged)
                cell.accessoryView = switchView
            }
            let switchView = cell.accessoryView as! UISwitch
            switchView.isOn = viewModel.isDarkModeEnabled
            return cell

        case (0, 1):
            let cell = tableView.dequeueReusableCell(withIdentifier: "SliderCell", for: indexPath)
            cell.selectionStyle = .none
            cell.backgroundColor = isDark ? UIColor(red: 0.2, green: 0.2, blue: 0.2, alpha: 1.0) : .white
            cell.textLabel?.text = nil
            cell.detailTextLabel?.text = nil

            if cell.contentView.viewWithTag(200) == nil {
                let titleLabel = UILabel()
                titleLabel.tag = 200
                titleLabel.translatesAutoresizingMaskIntoConstraints = false
                titleLabel.font = UIFont.systemFont(ofSize: 16)
                titleLabel.text = "Font Size"
                cell.contentView.addSubview(titleLabel)

                let slider = UISlider()
                slider.tag = 201
                slider.translatesAutoresizingMaskIntoConstraints = false
                slider.minimumValue = 12
                slider.maximumValue = 24
                slider.addTarget(self, action: #selector(fontSizeSliderChanged(_:)), for: .valueChanged)
                cell.contentView.addSubview(slider)

                let valueLabel = UILabel()
                valueLabel.tag = 202
                valueLabel.translatesAutoresizingMaskIntoConstraints = false
                valueLabel.font = UIFont.systemFont(ofSize: 14)
                valueLabel.textAlignment = .center
                cell.contentView.addSubview(valueLabel)

                NSLayoutConstraint.activate([
                    titleLabel.topAnchor.constraint(equalTo: cell.contentView.topAnchor, constant: 8),
                    titleLabel.leadingAnchor.constraint(equalTo: cell.contentView.leadingAnchor, constant: 16),
                    titleLabel.trailingAnchor.constraint(equalTo: cell.contentView.trailingAnchor, constant: -16),

                    slider.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 4),
                    slider.leadingAnchor.constraint(equalTo: cell.contentView.leadingAnchor, constant: 16),
                    slider.bottomAnchor.constraint(equalTo: cell.contentView.bottomAnchor, constant: -8),

                    valueLabel.centerYAnchor.constraint(equalTo: slider.centerYAnchor),
                    valueLabel.leadingAnchor.constraint(equalTo: slider.trailingAnchor, constant: 8),
                    valueLabel.trailingAnchor.constraint(equalTo: cell.contentView.trailingAnchor, constant: -16),
                    valueLabel.widthAnchor.constraint(equalToConstant: 30)
                ])
            }

            let titleLabel = cell.contentView.viewWithTag(200) as! UILabel
            titleLabel.textColor = isDark ? .white : .black

            let slider = cell.contentView.viewWithTag(201) as! UISlider
            slider.value = viewModel.fontSize

            let valueLabel = cell.contentView.viewWithTag(202) as! UILabel
            valueLabel.text = "\(Int(viewModel.fontSize))"
            valueLabel.textColor = isDark ? .white : .black

            return cell

        case (0, 2):
            let cell = tableView.dequeueReusableCell(withIdentifier: "SegmentedCell", for: indexPath)
            cell.selectionStyle = .none
            cell.backgroundColor = isDark ? UIColor(red: 0.2, green: 0.2, blue: 0.2, alpha: 1.0) : .white
            cell.textLabel?.text = nil
            cell.detailTextLabel?.text = nil

            if cell.contentView.viewWithTag(300) == nil {
                let titleLabel = UILabel()
                titleLabel.tag = 300
                titleLabel.translatesAutoresizingMaskIntoConstraints = false
                titleLabel.font = UIFont.systemFont(ofSize: 16)
                titleLabel.text = "Theme Color"
                cell.contentView.addSubview(titleLabel)

                let segmentedControl = UISegmentedControl(items: ["Blue", "Green", "Orange"])
                segmentedControl.tag = 301
                segmentedControl.translatesAutoresizingMaskIntoConstraints = false
                segmentedControl.addTarget(self, action: #selector(themeColorChanged(_:)), for: .valueChanged)
                cell.contentView.addSubview(segmentedControl)

                NSLayoutConstraint.activate([
                    titleLabel.topAnchor.constraint(equalTo: cell.contentView.topAnchor, constant: 8),
                    titleLabel.leadingAnchor.constraint(equalTo: cell.contentView.leadingAnchor, constant: 16),
                    titleLabel.trailingAnchor.constraint(equalTo: cell.contentView.trailingAnchor, constant: -16),

                    segmentedControl.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
                    segmentedControl.leadingAnchor.constraint(equalTo: cell.contentView.leadingAnchor, constant: 16),
                    segmentedControl.trailingAnchor.constraint(equalTo: cell.contentView.trailingAnchor, constant: -16),
                    segmentedControl.bottomAnchor.constraint(equalTo: cell.contentView.bottomAnchor, constant: -8)
                ])
            }

            let titleLabel = cell.contentView.viewWithTag(300) as! UILabel
            titleLabel.textColor = isDark ? .white : .black

            let segmentedControl = cell.contentView.viewWithTag(301) as! UISegmentedControl
            segmentedControl.selectedSegmentIndex = viewModel.themeColorIndex

            return cell

        case (1, 0):
            let cell = tableView.dequeueReusableCell(withIdentifier: "SegmentedCell", for: indexPath)
            cell.selectionStyle = .none
            cell.backgroundColor = isDark ? UIColor(red: 0.2, green: 0.2, blue: 0.2, alpha: 1.0) : .white
            cell.textLabel?.text = nil
            cell.detailTextLabel?.text = nil

            if cell.contentView.viewWithTag(400) == nil {
                let titleLabel = UILabel()
                titleLabel.tag = 400
                titleLabel.translatesAutoresizingMaskIntoConstraints = false
                titleLabel.font = UIFont.systemFont(ofSize: 16)
                titleLabel.text = "Default Category"
                cell.contentView.addSubview(titleLabel)

                let segmentedControl = UISegmentedControl(items: ["General", "Work", "Personal", "Ideas"])
                segmentedControl.tag = 401
                segmentedControl.translatesAutoresizingMaskIntoConstraints = false
                segmentedControl.addTarget(self, action: #selector(defaultCategoryChanged(_:)), for: .valueChanged)
                cell.contentView.addSubview(segmentedControl)

                NSLayoutConstraint.activate([
                    titleLabel.topAnchor.constraint(equalTo: cell.contentView.topAnchor, constant: 8),
                    titleLabel.leadingAnchor.constraint(equalTo: cell.contentView.leadingAnchor, constant: 16),
                    titleLabel.trailingAnchor.constraint(equalTo: cell.contentView.trailingAnchor, constant: -16),

                    segmentedControl.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
                    segmentedControl.leadingAnchor.constraint(equalTo: cell.contentView.leadingAnchor, constant: 16),
                    segmentedControl.trailingAnchor.constraint(equalTo: cell.contentView.trailingAnchor, constant: -16),
                    segmentedControl.bottomAnchor.constraint(equalTo: cell.contentView.bottomAnchor, constant: -8)
                ])
            }

            let titleLabel = cell.contentView.viewWithTag(400) as! UILabel
            titleLabel.textColor = isDark ? .white : .black

            let segmentedControl = cell.contentView.viewWithTag(401) as! UISegmentedControl
            segmentedControl.selectedSegmentIndex = viewModel.defaultCategoryIndex

            return cell

        case (1, 1):
            let cell = tableView.dequeueReusableCell(withIdentifier: "ButtonCell", for: indexPath)
            cell.selectionStyle = .none
            cell.textLabel?.text = nil
            cell.detailTextLabel?.text = nil
            cell.backgroundColor = isDark ? UIColor(red: 0.2, green: 0.2, blue: 0.2, alpha: 1.0) : .white

            if cell.contentView.viewWithTag(500) == nil {
                let button = UIButton(type: .system)
                button.tag = 500
                button.translatesAutoresizingMaskIntoConstraints = false
                button.setTitle("Clear Cache", for: .normal)
                button.setTitleColor(.red, for: .normal)
                button.titleLabel?.font = UIFont.systemFont(ofSize: 16)
                button.addTarget(self, action: #selector(clearCacheTapped), for: .touchUpInside)
                cell.contentView.addSubview(button)

                NSLayoutConstraint.activate([
                    button.topAnchor.constraint(equalTo: cell.contentView.topAnchor, constant: 8),
                    button.leadingAnchor.constraint(equalTo: cell.contentView.leadingAnchor, constant: 16),
                    button.trailingAnchor.constraint(equalTo: cell.contentView.trailingAnchor, constant: -16),
                    button.bottomAnchor.constraint(equalTo: cell.contentView.bottomAnchor, constant: -8),
                    button.heightAnchor.constraint(equalToConstant: 30)
                ])
            }

            return cell

        case (2, 0):
            let cell = tableView.dequeueReusableCell(withIdentifier: "ValueCell", for: indexPath)
            cell.textLabel?.text = "Version"
            cell.detailTextLabel?.text = "SwiftNote v1.0"
            cell.textLabel?.textColor = isDark ? .white : .black
            cell.detailTextLabel?.textColor = isDark ? .lightGray : .gray
            cell.backgroundColor = isDark ? UIColor(red: 0.2, green: 0.2, blue: 0.2, alpha: 1.0) : .white
            cell.selectionStyle = .none
            cell.accessoryType = .none
            cell.accessoryView = nil
            return cell

        case (2, 1):
            let cell = tableView.dequeueReusableCell(withIdentifier: "ValueCell", for: indexPath)
            cell.textLabel?.text = "Built With"
            cell.detailTextLabel?.text = "Swift 4.1 / Xcode 9.4"
            cell.textLabel?.textColor = isDark ? .white : .black
            cell.detailTextLabel?.textColor = isDark ? .lightGray : .gray
            cell.backgroundColor = isDark ? UIColor(red: 0.2, green: 0.2, blue: 0.2, alpha: 1.0) : .white
            cell.selectionStyle = .none
            cell.accessoryType = .none
            cell.accessoryView = nil
            return cell

        default:
            let cell = tableView.dequeueReusableCell(withIdentifier: "ValueCell", for: indexPath)
            return cell
        }
    }
}

extension SettingsViewController: UITableViewDelegate {

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
    }

    func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
        cell.textLabel?.textColor = viewModel.isDarkModeEnabled ? .white : .black
    }
}
