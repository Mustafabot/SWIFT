import UIKit
import CoreData

class CoreDataManager {

    static let shared = CoreDataManager()

    private let persistentContainer: NSPersistentContainer

    private init() {
        persistentContainer = NSPersistentContainer(name: "SwiftNote")
        persistentContainer.loadPersistentStores { [weak self] storeDescription, error in
            if let error = error as NSError? {
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }
    }

    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }

    @discardableResult
    func createNote(title: String, content: String, category: String, imageData: Data?) -> NSManagedObject? {
        let note = NSEntityDescription.insertNewObject(forEntityName: "Note", into: context)
        note.setValue(title, forKey: "title")
        note.setValue(content, forKey: "content")
        note.setValue(Date(), forKey: "createDate")
        note.setValue(Date(), forKey: "updateDate")
        note.setValue(category, forKey: "category")
        note.setValue(imageData as NSData?, forKey: "imageData")
        saveContext()
        return note
    }

    func fetchNotes(sortDescriptors: [NSSortDescriptor]?) -> [NSManagedObject] {
        let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
        request.sortDescriptors = sortDescriptors
        do {
            return try context.fetch(request)
        } catch {
            return []
        }
    }

    func fetchNotes(category: String, sortDescriptors: [NSSortDescriptor]?) -> [NSManagedObject] {
        let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
        request.predicate = NSPredicate(format: "category == %@", category)
        request.sortDescriptors = sortDescriptors
        do {
            return try context.fetch(request)
        } catch {
            return []
        }
    }

    func updateNote(note: NSManagedObject, title: String, content: String, category: String, imageData: Data?) {
        note.setValue(title, forKey: "title")
        note.setValue(content, forKey: "content")
        note.setValue(Date(), forKey: "updateDate")
        note.setValue(category, forKey: "category")
        note.setValue(imageData as NSData?, forKey: "imageData")
        saveContext()
    }

    func deleteNote(note: NSManagedObject) {
        context.delete(note)
        saveContext()
    }

    func saveContext() {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let error = error as NSError
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }
    }
}
