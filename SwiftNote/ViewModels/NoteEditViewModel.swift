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
            CoreDataManager.shared.performBackgroundTask { context in
                CoreDataManager.shared.createNote(title: title, content: content, category: category, imageData: imageData, in: context)
                DispatchQueue.main.async { [weak self] in
                    guard let strongSelf = self else { return }
                    strongSelf.isNew = false
                    strongSelf.onNoteSaved?()
                }
            }
            return true
        } else {
            guard let existingNote = note else { return false }
            CoreDataManager.shared.performBackgroundTask { context in
                let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
                request.predicate = NSPredicate(format: "title == %@ AND createDate == %@", existingNote.title, existingNote.createDate as NSDate)
                do {
                    let results = try context.fetch(request)
                    if let object = results.first {
                        CoreDataManager.shared.updateNote(note: object, title: title, content: content, category: category, imageData: imageData, in: context)
                        DispatchQueue.main.async { [weak self] in
                            guard let strongSelf = self else { return }
                            strongSelf.note?.title = title
                            strongSelf.note?.content = content
                            strongSelf.note?.category = category
                            strongSelf.note?.updateDate = Date()
                            strongSelf.note?.image = image
                            strongSelf.onNoteSaved?()
                        }
                    }
                } catch {
                    // Handle error silently
                }
            }
            return true
        }
    }

    @discardableResult
    func deleteNote() -> Bool {
        guard let existingNote = note else { return false }
        CoreDataManager.shared.performBackgroundTask { context in
            let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
            request.predicate = NSPredicate(format: "title == %@ AND createDate == %@", existingNote.title, existingNote.createDate as NSDate)
            do {
                let results = try context.fetch(request)
                if let object = results.first {
                    CoreDataManager.shared.deleteNote(note: object, in: context)
                    DispatchQueue.main.async { [weak self] in
                        guard let strongSelf = self else { return }
                        strongSelf.note = nil
                        strongSelf.onNoteDeleted?()
                    }
                }
            } catch {
                // Handle error silently
            }
        }
        return true
    }

    func loadNote(_ noteModel: NoteModel) {
        note = noteModel
        isNew = false
    }
}