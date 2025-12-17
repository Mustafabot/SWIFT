//
//  MainTabView.swift
//  SwiftCalender
//
//  主标签页视图 - 应用的主要导航结构
//  包含日历、日程列表、设置三个核心页面
//

import SwiftUI

/// 主标签页视图
struct MainTabView: View {
    @Environment(\.modelContext) private var modelContext
    
    var body: some View {
        ContentView()
            .modelContext(modelContext)
    }
}

/// 内容视图 - 处理ViewModel的创建
struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    
    @StateObject private var viewModel: EventViewModel
    
    init() {
        let initialContext = ModelContext(ModelContainer(for: [Event.self]))
        _viewModel = StateObject(wrappedValue: EventViewModel(modelContext: initialContext))
    }
    
    var body: some View {
        TabView {
            // 日历页面
            CalendarView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "calendar")
                    Text("日历")
                }
                .tag(0)
            
            // 日程列表页面
            EventListView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "list.bullet")
                    Text("日程")
                }
                .tag(1)
            
            // 设置页面
            SettingsView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "gear")
                    Text("设置")
                }
                .tag(2)
        }
        .accentColor(.blue)
        .background(Color.white)
        // 错误提示
        .alert("错误", isPresented: .constant(viewModel.errorMessage != nil)) {
            Button("确定") {
                viewModel.clearError()
            }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
        .onAppear {
            // 确保ViewModel使用正确的ModelContext
            viewModel.updateContext(modelContext)
        }
    }
}
    
    var body: some View {
        TabView {
            // 日历页面
            CalendarView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "calendar")
                    Text("日历")
                }
                .tag(0)
            
            // 日程列表页面
            EventListView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "list.bullet")
                    Text("日程")
                }
                .tag(1)
            
            // 设置页面
            SettingsView(viewModel: viewModel)
                .tabItem {
                    Image(systemName: "gear")
                    Text("设置")
                }
                .tag(2)
        }
        .accentColor(.blue)
        .background(Color.white)
        // 错误提示
        .alert("错误", isPresented: .constant(viewModel.errorMessage != nil)) {
            Button("确定") {
                viewModel.clearError()
            }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }
}

// MARK: - Preview

struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        MainTabView()
    }
}