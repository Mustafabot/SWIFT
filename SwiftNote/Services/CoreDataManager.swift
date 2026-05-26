import UIKit
import CoreData

class CoreDataManager {

    static let shared = CoreDataManager()

    private let persistentContainer: NSPersistentContainer

    private init() {
        let model = CoreDataManager.createManagedObjectModel()
        persistentContainer = NSPersistentContainer(name: "SwiftNote", managedObjectModel: model)
        persistentContainer.loadPersistentStores { storeDescription, error in
            if let error = error as NSError? {
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }
    }

    private static func createManagedObjectModel() -> NSManagedObjectModel {
        let model = NSManagedObjectModel()

        let noteEntity = NSEntityDescription()
        noteEntity.name = "Note"
        noteEntity.managedObjectClassName = "NSManagedObject"

        let titleAttr = NSAttributeDescription()
        titleAttr.name = "title"
        titleAttr.attributeType = .stringAttributeType
        titleAttr.isOptional = true
        titleAttr.defaultValue = ""

        let contentAttr = NSAttributeDescription()
        contentAttr.name = "content"
        contentAttr.attributeType = .stringAttributeType
        contentAttr.isOptional = true
        contentAttr.defaultValue = ""

        let categoryAttr = NSAttributeDescription()
        categoryAttr.name = "category"
        categoryAttr.attributeType = .stringAttributeType
        categoryAttr.isOptional = true
        categoryAttr.defaultValue = ""

        let createDateAttr = NSAttributeDescription()
        createDateAttr.name = "createDate"
        createDateAttr.attributeType = .dateAttributeType
        createDateAttr.isOptional = true

        let updateDateAttr = NSAttributeDescription()
        updateDateAttr.name = "updateDate"
        updateDateAttr.attributeType = .dateAttributeType
        updateDateAttr.isOptional = true

        let imageDataAttr = NSAttributeDescription()
        imageDataAttr.name = "imageData"
        imageDataAttr.attributeType = .binaryDataAttributeType
        imageDataAttr.isOptional = true
        imageDataAttr.allowsExternalBinaryDataStorage = true

        noteEntity.properties = [titleAttr, contentAttr, categoryAttr, createDateAttr, updateDateAttr, imageDataAttr]
        model.entities = [noteEntity]

        return model
    }

    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }

    func performBackgroundTask(_ block: @escaping (NSManagedObjectContext) -> Void) {
        persistentContainer.performBackgroundTask { context in
            block(context)
        }
    }

    @discardableResult
    func createNote(title: String, content: String, category: String, imageData: Data?, in context: NSManagedObjectContext? = nil) -> NSManagedObject? {
        let ctx = context ?? self.context
        let note = NSEntityDescription.insertNewObject(forEntityName: "Note", into: ctx)
        note.setValue(title, forKey: "title")
        note.setValue(content, forKey: "content")
        note.setValue(Date(), forKey: "createDate")
        note.setValue(Date(), forKey: "updateDate")
        note.setValue(category, forKey: "category")
        note.setValue(imageData as NSData?, forKey: "imageData")
        saveContext(in: ctx)
        return note
    }

    func fetchNotes(sortDescriptors: [NSSortDescriptor]?, in context: NSManagedObjectContext? = nil) -> [NSManagedObject] {
        let ctx = context ?? self.context
        let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
        request.sortDescriptors = sortDescriptors
        do {
            return try ctx.fetch(request)
        } catch {
            return []
        }
    }

    func fetchNotes(category: String, sortDescriptors: [NSSortDescriptor]?, in context: NSManagedObjectContext? = nil) -> [NSManagedObject] {
        let ctx = context ?? self.context
        let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
        request.predicate = NSPredicate(format: "category == %@", category)
        request.sortDescriptors = sortDescriptors
        do {
            return try ctx.fetch(request)
        } catch {
            return []
        }
    }

    func updateNote(note: NSManagedObject, title: String, content: String, category: String, imageData: Data?, in context: NSManagedObjectContext? = nil) {
        let ctx = context ?? self.context
        note.setValue(title, forKey: "title")
        note.setValue(content, forKey: "content")
        note.setValue(Date(), forKey: "updateDate")
        note.setValue(category, forKey: "category")
        note.setValue(imageData as NSData?, forKey: "imageData")
        saveContext(in: ctx)
    }

    func deleteNote(note: NSManagedObject, in context: NSManagedObjectContext? = nil) {
        let ctx = context ?? self.context
        ctx.delete(note)
        saveContext(in: ctx)
    }

    func saveContext(in context: NSManagedObjectContext? = nil) {
        let ctx = context ?? self.context
        if ctx.hasChanges {
            do {
                try ctx.save()
            } catch {
                let error = error as NSError
                fatalError("Unresolved error \(error), \(error.userInfo)")
            }
        }
    }
}