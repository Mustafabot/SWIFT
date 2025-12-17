//
//  SwiftCalenderApp.swift
//  SwiftCalender
//
//  SwiftUI日历应用主入口
//

import SwiftUI
import SwiftData

@main
struct SwiftCalenderApp: App {
    let container: ModelContainer
    
    init() {
        do {
            // 配置SwiftData容器
            let schema = Schema([
                Event.self
            ])
            let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
            container = try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("无法创建数据模型容器: \(error)")
        }
    }
    
    var body: some Scene {
        WindowGroup {
            MainTabView()
                .modelContainer(container)
        }
    }
}