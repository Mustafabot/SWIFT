import UIKit
import CoreData

class NoteListViewModel {

    var allNotes: [NoteModel] = []
    var filteredNotes: [NoteModel] = []
    var searchText: String = ""
    var selectedCategory: String?

    var onNotesUpdated: (() -> Void)?

    func loadNotes() {
        CoreDataManager.shared.performBackgroundTask { context in
            let sortDescriptor = NSSortDescriptor(key: "updateDate", ascending: false)
            let objects = CoreDataManager.shared.fetchNotes(sortDescriptors: [sortDescriptor], in: context)
            let notes = objects.map { NoteModel.fromManagedObject($0) }

            DispatchQueue.main.async { [weak self] in
                guard let innerSelf = self else { return }
                innerSelf.allNotes = notes
                innerSelf.filterNotes()
            }
        }
    }

    func filterNotes() {
        var result = allNotes

        if let category = selectedCategory, category.count > 0 {
            result = result.filter { note in
                return note.category == category
            }
        }

        if searchText.count > 0 {
            result = result.filter { note in
                return note.title.localizedCaseInsensitiveContains(searchText) || note.content.localizedCaseInsensitiveContains(searchText)
            }
        }

        filteredNotes = result
        onNotesUpdated?()
    }

    func deleteNote(at index: Int) {
        guard index >= 0 && index < filteredNotes.count else { return }
        let noteModel = filteredNotes[index]
        CoreDataManager.shared.performBackgroundTask { context in
            let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
            request.predicate = NSPredicate(format: "title == %@ AND createDate == %@", noteModel.title, noteModel.createDate as NSDate)
            do {
                let results = try context.fetch(request)
                if let object = results.first {
                    CoreDataManager.shared.deleteNote(note: object, in: context)
                    DispatchQueue.main.async { [weak self] in
                        guard let innerSelf = self else { return }
                        innerSelf.loadNotes()
                    }
                }
            } catch {
                return
            }
        }
    }

    func numberOfNotes() -> Int {
        return filteredNotes.count
    }

    func noteAtIndex(_ index: Int) -> NoteModel {
        return filteredNotes[index]
    }
}