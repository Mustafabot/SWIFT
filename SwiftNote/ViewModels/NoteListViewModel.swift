import UIKit
import CoreData

class NoteListViewModel {

    var allNotes: [NoteModel] = []
    var filteredNotes: [NoteModel] = []
    var searchText: String = ""
    var selectedCategory: String?

    var onNotesUpdated: (() -> Void)?

    func loadNotes() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            let sortDescriptor = NSSortDescriptor(key: "updateDate", ascending: false)
            let objects = CoreDataManager.shared.fetchNotes(sortDescriptors: [sortDescriptor])
            let notes = objects.map { NoteModel.fromManagedObject($0) }

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.allNotes = notes
                self.filterNotes()
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
        let context = CoreDataManager.shared.context
        let request: NSFetchRequest<NSManagedObject> = NSFetchRequest(entityName: "Note")
        request.predicate = NSPredicate(format: "title == %@ AND createDate == %@", noteModel.title, noteModel.createDate as NSDate)
        do {
            let results = try context.fetch(request)
            if let object = results.first {
                DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                    CoreDataManager.shared.deleteNote(note: object)
                    DispatchQueue.main.async { [weak self] in
                        guard let self = self else { return }
                        self.loadNotes()
                    }
                }
            }
        } catch {
            return
        }
    }

    func numberOfNotes() -> Int {
        return filteredNotes.count
    }

    func noteAtIndex(_ index: Int) -> NoteModel {
        return filteredNotes[index]
    }
}
