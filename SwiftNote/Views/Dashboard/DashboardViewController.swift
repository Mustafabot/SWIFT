import UIKit

class DashboardViewController: UIViewController {

    private var collectionView: UICollectionView!
    private let refreshControl = UIRefreshControl()
    private var viewModel = DashboardViewModel()

    override func viewDidLoad() {
        super.viewDidLoad()

        navigationItem.title = "SwiftNote"
        navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .add, target: self, action: #selector(addButtonTapped))

        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical
        layout.minimumInteritemSpacing = 10
        layout.minimumLineSpacing = 10
        layout.sectionInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        let screenWidth = UIScreen.main.bounds.width
        let itemWidth = (screenWidth - 16 * 2 - 10) / 2
        layout.itemSize = CGSize(width: itemWidth, height: itemWidth * 1.2)

        collectionView = UICollectionView(frame: .zero, collectionViewLayout: layout)
        collectionView.backgroundColor = .white
        collectionView.alwaysBounceVertical = true
        collectionView.register(DashboardCell.self, forCellWithReuseIdentifier: "DashboardCell")
        collectionView.register(DashboardHeaderView.self, forSupplementaryViewOfKind: UICollectionElementKindSectionHeader, withReuseIdentifier: "DashboardHeader")
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.refreshControl = refreshControl

        refreshControl.addTarget(self, action: #selector(handleRefresh), for: .valueChanged)

        view.addSubview(collectionView)
        setupConstraints()

        viewModel.onDataLoaded = { [weak self] in
            DispatchQueue.main.async {
                self?.collectionView.reloadData()
                self?.refreshControl.endRefreshing()
            }
        }

        viewModel.loadDashboardData()
    }

    private func setupConstraints() {
        NSLayoutConstraint.activate([
            collectionView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            collectionView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            collectionView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            collectionView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor)
        ])
    }

    @objc private func addButtonTapped() {
        let alertController = UIAlertController(title: nil, message: nil, preferredStyle: .actionSheet)

        let newNoteAction = UIAlertAction(title: "New Note", style: .default) { [weak self] _ in
            self?.navigateToNoteEdit(category: "General")
        }
        let newWorkNoteAction = UIAlertAction(title: "New Work Note", style: .default) { [weak self] _ in
            self?.navigateToNoteEdit(category: "Work")
        }
        let newPersonalNoteAction = UIAlertAction(title: "New Personal Note", style: .default) { [weak self] _ in
            self?.navigateToNoteEdit(category: "Personal")
        }
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel, handler: nil)

        alertController.addAction(newNoteAction)
        alertController.addAction(newWorkNoteAction)
        alertController.addAction(newPersonalNoteAction)
        alertController.addAction(cancelAction)

        present(alertController, animated: true, completion: nil)
    }

    private func navigateToNoteEdit(category: String) {
        let editVC = NoteEditViewController()
        editVC.initialCategory = category
        navigationController?.pushViewController(editVC, animated: true)
    }

    @objc private func handleRefresh() {
        viewModel.loadDashboardData()
    }
}

extension DashboardViewController: UICollectionViewDataSource {

    func numberOfSections(in collectionView: UICollectionView) -> Int {
        return 1
    }

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return viewModel.numberOfItemsInSection(section)
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "DashboardCell", for: indexPath) as! DashboardCell
        let note = viewModel.itemAtIndex(indexPath.item)
        cell.configure(with: note)
        return cell
    }

    func collectionView(_ collectionView: UICollectionView, viewForSupplementaryElementOfKind kind: String, at indexPath: IndexPath) -> UICollectionReusableView {
        let headerView = collectionView.dequeueReusableSupplementaryView(ofKind: kind, withReuseIdentifier: "DashboardHeader", for: indexPath) as! DashboardHeaderView
        headerView.configure(title: "Recent Notes", count: viewModel.totalNoteCount)
        return headerView
    }
}

extension DashboardViewController: UICollectionViewDelegate {

    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        let note = viewModel.itemAtIndex(indexPath.item)
        let editVC = NoteEditViewController()
        editVC.noteToLoad = note
        navigationController?.pushViewController(editVC, animated: true)
    }
}

extension DashboardViewController: UICollectionViewDelegateFlowLayout {

    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, referenceSizeForHeaderInSection section: Int) -> CGSize {
        return CGSize(width: collectionView.bounds.width, height: 44)
    }
}
