import UIKit
import CoreData

class NoteEditViewModel {

    var note: NoteModel?
    var isNew: Bool = true

    var onNoteSaved: (() -> Void)?
    var onNoteDeleted: (() -> Void)?

    private func resizeImage(_ image: UIImage, maxWidth: CGFloat, maxHeight: CGFloat) -> UIImage {
        let size = image.size
        var width = size.width
        var height = size.height

        if width > maxWidth {
            height = height * maxWidth / width
            width = maxWidth
        }
        if height > maxHeight {
            width = width * maxHeight / height
            height = maxHeight
        }

        let newSize = CGSize(width: width, height: height)
        UIGraphicsBeginImageContextWithOptions(newSize, false, 0.0)
        image.draw(in: CGRect(origin: CGPoint.zero, size: newSize))
        let resizedImage = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()

        return resizedImage ?? image
    }

    private func compressImage(_ image: UIImage) -> Data? {
        let resized = resizeImage(image, maxWidth: 1024.0, maxHeight: 1024.0)
        return UIImageJPEGRepresentation(resized, 0.5)
    }

    @discardableResult
    func saveNote(title: String, content: String, category: String, image: UIImage?) -> Bool {
        var imageData: Data?
        if let image = image {
            imageData = compressImage(image)
        }

        if isNew {
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                CoreDataManager.shared.createNote(title: title, content: content, category: category, imageData: imageData)
                DispatchQueue.main.async { [weak self] in
                    guard let self = self else { return }
                    self.isNew = false
                    self.onNoteSaved?()
                }
            }
            return true
        } else {
            guard let existingNote = note else { return false }
            let context = CoreDataManager.shared.context
            let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
            request.predicate = NSPredicate(format: "title == %@ AND createDate == %@", existingNote.title, existingNote.createDate as NSDate)
            do {
                let results = try context.fetch(request)
                if let object = results.first {
                    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                        CoreDataManager.shared.updateNote(note: object, title: title, content: content, category: category, imageData: imageData)
                        DispatchQueue.main.async { [weak self] in
                            guard let self = self else { return }
                            self.note?.title = title
                            self.note?.content = content
                            self.note?.category = category
                            self.note?.updateDate = Date()
                            self.note?.image = image
                            self.onNoteSaved?()
                        }
                    }
                    return true
                }
            } catch {
                return false
            }
            return false
        }
    }

    @discardableResult
    func deleteNote() -> Bool {
        guard let existingNote = note else { return false }
        let context = CoreDataManager.shared.context
        let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
        request.predicate = NSPredicate(format: "title == %@ AND createDate == %@", existingNote.title, existingNote.createDate as NSDate)
        do {
            let results = try context.fetch(request)
            if let object = results.first {
                DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                    CoreDataManager.shared.deleteNote(note: object)
                    DispatchQueue.main.async { [weak self] in
                        guard let self = self else { return }
                        self.note = nil
                        self.onNoteDeleted?()
                    }
                }
                return true
            }
        } catch {
            return false
        }
        return false
    }

    func loadNote(_ noteModel: NoteModel) {
        note = noteModel
        isNew = false
    }
}
