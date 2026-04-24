import UIKit
import CoreData

class DashboardViewModel {

    var recentNotes: [NoteModel] = []
    var totalNoteCount: Int = 0
    var categoryCounts: [String: Int] = [:]

    var onDataLoaded: (() -> Void)?

    func loadDashboardData() {
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            let sortDescriptor = NSSortDescriptor(key: "updateDate", ascending: false)
            let allObjects = CoreDataManager.shared.fetchNotes(sortDescriptors: [sortDescriptor])
            let allNotes = allObjects.map { NoteModel.fromManagedObject($0) }

            var recent: [NoteModel] = []
            for i in 0..<min(10, allNotes.count) {
                recent.append(allNotes[i])
            }

            var counts: [String: Int] = [:]
            for note in allNotes {
                if let count = counts[note.category] {
                    counts[note.category] = count + 1
                } else {
                    counts[note.category] = 1
                }
            }

            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.recentNotes = recent
                self.totalNoteCount = allNotes.count
                self.categoryCounts = counts
                self.onDataLoaded?()
            }
        }
    }

    func numberOfItemsInSection(_ section: Int) -> Int {
        return recentNotes.count
    }

    func itemAtIndex(_ index: Int) -> NoteModel {
        return recentNotes[index]
    }
}
