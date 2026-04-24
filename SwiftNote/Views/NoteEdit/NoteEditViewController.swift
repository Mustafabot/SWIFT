import UIKit

class NoteEditViewController: UIViewController {

    var noteToLoad: NoteModel?
    var initialCategory: String?

    private var viewModel: NoteEditViewModel!

    private let categories = ["General", "Work", "Personal", "Ideas"]
    private var selectedCategoryIndex: Int = 0

    private lazy var scrollView: UIScrollView = {
        let sv = UIScrollView()
        sv.translatesAutoresizingMaskIntoConstraints = false
        sv.alwaysBounceVertical = true
        return sv
    }()

    private lazy var contentView: UIView = {
        let v = UIView()
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private lazy var titleTextField: UITextField = {
        let tf = UITextField()
        tf.translatesAutoresizingMaskIntoConstraints = false
        tf.font = UIFont.boldSystemFont(ofSize: 18)
        tf.placeholder = "Note Title"
        tf.borderStyle = .none
        tf.returnKeyType = .done
        tf.delegate = self
        return tf
    }()

    private lazy var contentTextView: UITextView = {
        let tv = UITextView()
        tv.translatesAutoresizingMaskIntoConstraints = false
        tv.font = UIFont.systemFont(ofSize: 16)
        tv.isScrollEnabled = false
        tv.textContainerInset = UIEdgeInsets(top: 8, left: 0, bottom: 8, right: 0)
        return tv
    }()

    private lazy var imageView: UIImageView = {
        let iv = UIImageView()
        iv.translatesAutoresizingMaskIntoConstraints = false
        iv.contentMode = .scaleAspectFit
        iv.layer.cornerRadius = 8
        iv.clipsToBounds = true
        iv.isHidden = true
        return iv
    }()

    private lazy var addImageButton: UIButton = {
        let btn = UIButton(type: .system)
        btn.translatesAutoresizingMaskIntoConstraints = false
        btn.setTitle("Add Photo", for: .normal)
        btn.addTarget(self, action: #selector(addPhotoTapped), for: .touchUpInside)
        return btn
    }()

    private lazy var categoryCollectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .horizontal
        layout.minimumInteritemSpacing = 8
        layout.minimumLineSpacing = 8
        let cv = UICollectionView(frame: .zero, collectionViewLayout: layout)
        cv.translatesAutoresizingMaskIntoConstraints = false
        cv.showsHorizontalScrollIndicator = false
        cv.backgroundColor = .clear
        cv.dataSource = self
        cv.delegate = self
        cv.register(CategoryCell.self, forCellWithReuseIdentifier: "CategoryCell")
        return cv
    }()

    override func viewDidLoad() {
        super.viewDidLoad()

        viewModel = NoteEditViewModel()

        if let note = noteToLoad {
            viewModel.loadNote(note)
        }

        setupUI()
        setupNavigationBar()
        setupKeyboardObservers()
        configureForEditing()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    private func setupUI() {
        view.backgroundColor = .white
        view.addSubview(scrollView)
        scrollView.addSubview(contentView)
        contentView.addSubview(titleTextField)
        contentView.addSubview(categoryCollectionView)
        contentView.addSubview(contentTextView)
        contentView.addSubview(addImageButton)
        contentView.addSubview(imageView)

        NSLayoutConstraint.activate([
            scrollView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scrollView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scrollView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scrollView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            contentView.topAnchor.constraint(equalTo: scrollView.topAnchor),
            contentView.leadingAnchor.constraint(equalTo: scrollView.leadingAnchor),
            contentView.trailingAnchor.constraint(equalTo: scrollView.trailingAnchor),
            contentView.bottomAnchor.constraint(equalTo: scrollView.bottomAnchor),
            contentView.widthAnchor.constraint(equalTo: scrollView.widthAnchor),

            titleTextField.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 16),
            titleTextField.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            titleTextField.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            titleTextField.heightAnchor.constraint(equalToConstant: 44),

            categoryCollectionView.topAnchor.constraint(equalTo: titleTextField.bottomAnchor, constant: 8),
            categoryCollectionView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            categoryCollectionView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            categoryCollectionView.heightAnchor.constraint(equalToConstant: 36),

            contentTextView.topAnchor.constraint(equalTo: categoryCollectionView.bottomAnchor, constant: 12),
            contentTextView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            contentTextView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            contentTextView.heightAnchor.constraint(greaterThanOrEqualToConstant: 150),

            addImageButton.topAnchor.constraint(equalTo: contentTextView.bottomAnchor, constant: 12),
            addImageButton.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            addImageButton.heightAnchor.constraint(equalToConstant: 36),

            imageView.topAnchor.constraint(equalTo: addImageButton.bottomAnchor, constant: 12),
            imageView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            imageView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            imageView.heightAnchor.constraint(equalToConstant: 200),
            imageView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -16)
        ])
    }

    private func setupNavigationBar() {
        let cancelButton = UIBarButtonItem(title: "Cancel", style: .plain, target: self, action: #selector(cancelTapped))
        let saveButton = UIBarButtonItem(title: "Save", style: .done, target: self, action: #selector(saveTapped))
        saveButton.setTitleTextAttributes([NSAttributedStringKey.font: UIFont.boldSystemFont(ofSize: 17)], for: .normal)

        navigationItem.rightBarButtonItem = saveButton

        if !viewModel.isNew {
            let deleteButton = UIBarButtonItem(title: "Delete", style: .plain, target: self, action: #selector(deleteTapped))
            deleteButton.tintColor = .red
            navigationItem.leftBarButtonItems = [cancelButton, deleteButton]
        } else {
            navigationItem.leftBarButtonItem = cancelButton
        }
    }

    private func setupKeyboardObservers() {
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillShow(_:)), name: Notification.Name.UIKeyboardWillShow, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(keyboardWillHide(_:)), name: Notification.Name.UIKeyboardWillHide, object: nil)
    }

    private func configureForEditing() {
        if let note = viewModel.note {
            titleTextField.text = note.title
            contentTextView.text = note.content
            if let image = note.image {
                imageView.image = image
                imageView.isHidden = false
            }
            if let index = categories.index(of: note.category) {
                selectedCategoryIndex = index
            }
        } else {
            if let cat = initialCategory, let index = categories.index(of: cat) {
                selectedCategoryIndex = index
            } else {
                selectedCategoryIndex = 0
            }
        }
        categoryCollectionView.reloadData()
    }

    @objc private func cancelTapped() {
        navigationController?.popViewController(animated: true)
    }

    @objc private func saveTapped() {
        guard let title = titleTextField.text, !title.isEmpty else {
            let alert = UIAlertController(title: "Error", message: "Title cannot be empty", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default, handler: nil))
            present(alert, animated: true, completion: nil)
            return
        }

        let image: UIImage? = imageView.isHidden ? nil : imageView.image
        _ = viewModel.saveNote(title: title, content: contentTextView.text, category: categories[selectedCategoryIndex], image: image)
        navigationController?.popViewController(animated: true)
    }

    @objc private func deleteTapped() {
        let alert = UIAlertController(title: "Delete Note", message: "Are you sure you want to delete this note?", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        alert.addAction(UIAlertAction(title: "Delete", style: .destructive, handler: { [weak self] _ in
            guard let strongSelf = self else { return }
            _ = strongSelf.viewModel.deleteNote()
            strongSelf.navigationController?.popViewController(animated: true)
        }))
        present(alert, animated: true, completion: nil)
    }

    @objc private func addPhotoTapped() {
        let alert = UIAlertController(title: "Add Photo", message: nil, preferredStyle: .actionSheet)
        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            alert.addAction(UIAlertAction(title: "Camera", style: .default, handler: { [weak self] _ in
                guard let strongSelf = self else { return }
                strongSelf.presentImagePicker(with: .camera)
            }))
        }
        alert.addAction(UIAlertAction(title: "Photo Library", style: .default, handler: { [weak self] _ in
            guard let strongSelf = self else { return }
            strongSelf.presentImagePicker(with: .photoLibrary)
        }))
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel, handler: nil))
        present(alert, animated: true, completion: nil)
    }

    private func presentImagePicker(with sourceType: UIImagePickerControllerSourceType) {
        let picker = UIImagePickerController()
        picker.sourceType = sourceType
        picker.delegate = self
        picker.allowsEditing = false
        present(picker, animated: true, completion: nil)
    }

    @objc private func keyboardWillShow(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let keyboardFrameValue = userInfo[UIKeyboardFrameEndUserInfoKey] as? NSValue else { return }
        let keyboardFrame = keyboardFrameValue.cgRectValue
        let contentInset = UIEdgeInsets(top: 0, left: 0, bottom: keyboardFrame.height, right: 0)
        scrollView.contentInset = contentInset
        scrollView.scrollIndicatorInsets = contentInset
    }

    @objc private func keyboardWillHide(_ notification: Notification) {
        scrollView.contentInset = UIEdgeInsets.zero
        scrollView.scrollIndicatorInsets = UIEdgeInsets.zero
    }
}

extension NoteEditViewController: UITextFieldDelegate {

    func textFieldShouldReturn(_ textField: UITextField) -> Bool {
        textField.resignFirstResponder()
        contentTextView.becomeFirstResponder()
        return true
    }
}

extension NoteEditViewController: UICollectionViewDataSource {

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return categories.count
    }

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "CategoryCell", for: indexPath) as! CategoryCell
        cell.configure(with: categories[indexPath.item], isSelected: indexPath.item == selectedCategoryIndex)
        return cell
    }
}

extension NoteEditViewController: UICollectionViewDelegate {

    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        selectedCategoryIndex = indexPath.item
        collectionView.reloadData()
    }
}

extension NoteEditViewController: UICollectionViewDelegateFlowLayout {

    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        let name = categories[indexPath.item]
        let size = name.size(withAttributes: [NSAttributedStringKey.font: UIFont.systemFont(ofSize: 14)])
        return CGSize(width: size.width + 24, height: 32)
    }
}

extension NoteEditViewController: UIImagePickerControllerDelegate {

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [String: Any]) {
        picker.dismiss(animated: true, completion: nil)
        if let image = info[UIImagePickerControllerOriginalImage] as? UIImage {
            imageView.image = image
            imageView.isHidden = false
        }
    }

    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true, completion: nil)
    }
}

extension NoteEditViewController: UINavigationControllerDelegate {
}

private class CategoryCell: UICollectionViewCell {

    private let titleLabel: UILabel = {
        let label = UILabel()
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = UIFont.systemFont(ofSize: 14)
        label.textAlignment = .center
        return label
    }()

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupCell()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    private func setupCell() {
        contentView.addSubview(titleLabel)
        layer.cornerRadius = 16
        layer.masksToBounds = true

        NSLayoutConstraint.activate([
            titleLabel.centerXAnchor.constraint(equalTo: contentView.centerXAnchor),
            titleLabel.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            titleLabel.leadingAnchor.constraint(greaterThanOrEqualTo: contentView.leadingAnchor, constant: 8),
            titleLabel.trailingAnchor.constraint(lessThanOrEqualTo: contentView.trailingAnchor, constant: -8)
        ])
    }

    func configure(with name: String, isSelected: Bool) {
        titleLabel.text = name
        if isSelected {
            backgroundColor = UIView().tintColor
            titleLabel.textColor = .white
        } else {
            backgroundColor = UIColor(white: 0.9, alpha: 1.0)
            titleLabel.textColor = .darkGray
        }
    }
}
