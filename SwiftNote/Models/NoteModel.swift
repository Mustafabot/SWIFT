import UIKit
import CoreData

struct NoteModel {

    var id: String
    var title: String
    var content: String
    var createDate: Date
    var updateDate: Date
    var category: String
    var image: UIImage?

    var dateString: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: updateDate)
    }

    static func fromManagedObject(_ object: NSManagedObject) -> NoteModel {
        var image: UIImage?
        if let imageData = object.value(forKey: "imageData") as? Data {
            image = UIImage(data: imageData)
        }
        return NoteModel(
            id: object.objectID.uriRepresentation().absoluteString,
            title: object.value(forKey: "title") as? String ?? "",
            content: object.value(forKey: "content") as? String ?? "",
            createDate: object.value(forKey: "createDate") as? Date ?? Date(),
            updateDate: object.value(forKey: "updateDate") as? Date ?? Date(),
            category: object.value(forKey: "category") as? String ?? "General",
            image: image
        )
    }
}
