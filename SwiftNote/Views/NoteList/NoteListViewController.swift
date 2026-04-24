import UIKit

class NoteListViewController: UIViewController {

    private var tableView: UITableView!
    private let searchBar = UISearchBar()
    private let refreshControl = UIRefreshControl()
    private var viewModel = NoteListViewModel()

    private let segmentedControl: UISegmentedControl = {
        let sc = UISegmentedControl(items: ["All", "General", "Work", "Personal", "Ideas"])
        sc.selectedSegmentIndex = 0
        return sc
    }()

    override func viewDidLoad() {
        super.viewDidLoad()

        navigationItem.titleView = segmentedControl
        segmentedControl.addTarget(self, action: #selector(segmentChanged), for: .valueChanged)

        searchBar.placeholder = "Search Notes"
        searchBar.delegate = self
        searchBar.sizeToFit()

        tableView = UITableView(frame: .zero, style: .plain)
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(NoteTableViewCell.self, forCellReuseIdentifier: "NoteTableViewCell")
        tableView.tableHeaderView = searchBar
        tableView.estimatedRowHeight = 80
        tableView.rowHeight = UITableViewAutomaticDimension
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.refreshControl = refreshControl

        refreshControl.addTarget(self, action: #selector(handleRefresh), for: .valueChanged)

        view.addSubview(tableView)
        setupConstraints()

        viewModel.onNotesUpdated = { [weak self] in
            DispatchQueue.main.async {
                self?.tableView.reloadData()
                self?.refreshControl.endRefreshing()
            }
        }

        viewModel.loadNotes()
    }

    private func setupConstraints() {
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor)
        ])
    }

    @objc private func segmentChanged() {
        switch segmentedControl.selectedSegmentIndex {
        case 0:
            viewModel.selectedCategory = nil
        case 1:
            viewModel.selectedCategory = "General"
        case 2:
            viewModel.selectedCategory = "Work"
        case 3:
            viewModel.selectedCategory = "Personal"
        case 4:
            viewModel.selectedCategory = "Ideas"
        default:
            viewModel.selectedCategory = nil
        }
        viewModel.filterNotes()
    }

    @objc private func handleRefresh() {
        viewModel.loadNotes()
    }
}

extension NoteListViewController: UITableViewDataSource {

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return viewModel.numberOfNotes()
    }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "NoteTableViewCell", for: indexPath) as! NoteTableViewCell
        let note = viewModel.noteAtIndex(indexPath.row)
        cell.configure(with: note)
        return cell
    }
}

extension NoteListViewController: UITableViewDelegate {

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        let note = viewModel.noteAtIndex(indexPath.row)
        let editVC = NoteEditViewController()
        editVC.noteToLoad = note
        navigationController?.pushViewController(editVC, animated: true)
    }

    func tableView(_ tableView: UITableView, editingStyleForRowAt indexPath: IndexPath) -> UITableViewCellEditingStyle {
        return .delete
    }

    func tableView(_ tableView: UITableView, commit editingStyle: UITableViewCellEditingStyle, forRowAt indexPath: IndexPath) {
        if editingStyle == .delete {
            viewModel.deleteNote(at: indexPath.row)
        }
    }
}

extension NoteListViewController: UISearchBarDelegate {

    func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
        viewModel.searchText = searchText
        viewModel.filterNotes()
    }

    func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
        searchBar.resignFirstResponder()
    }

    func searchBarCancelButtonClicked(_ searchBar: UISearchBar) {
        searchBar.text = nil
        viewModel.searchText = ""
        searchBar.resignFirstResponder()
        viewModel.filterNotes()
    }
}
