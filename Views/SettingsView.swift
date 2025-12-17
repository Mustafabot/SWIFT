//
//  SettingsView.swift
//  SwiftCalender
//
//  设置视图 - 管理应用设置和用户偏好
//  包括通知开关、默认提醒时间、周起始日等设置
//

import SwiftUI
import UIKit

/// 设置视图
/// 管理应用设置和用户偏好，包括通知开关、默认提醒时间、周起始日等
/// - Note: 使用@AppStorage持久化存储用户设置
struct SettingsView: View {
    @ObservedObject var viewModel: EventViewModel
    @State private var showingNotificationPermission = false
    @AppStorage("defaultReminderTime") private var defaultReminderTime: ReminderTime = .fifteenMinutes
    @AppStorage("weekStartsOnMonday") private var weekStartsOnMonday: Bool = true
    @AppStorage("notificationsEnabled") private var notificationsEnabled: Bool = true
    
    var body: some View {
        NavigationView {
            List {
                // 通知设置区域
                notificationSection
                
                // 通用设置区域
                generalSection
                
                // 关于区域
                aboutSection
            }
            .navigationTitle("设置")
            .navigationBarTitleDisplayMode(.inline)
            .alert("需要通知权限", isPresented: $showingNotificationPermission) {
                Button("前往设置") {
                    openAppSettings()
                }
                Button("取消", role: .cancel) { }
            } message: {
                Text("为了接收日程提醒，请允许应用发送通知")
            }
        }
    }
    
    // MARK: - Views
    
    /// 通知设置区域
    /// - Note: 包含通知总开关和默认提醒时间设置
    private var notificationSection: some View {
        Section {
            // 通知开关
            HStack {
                Label("开启通知", systemImage: "bell")
                Spacer()
                Toggle("", isOn: Binding(
                    get: { notificationsEnabled },
                    set: { newValue in
                        notificationsEnabled = newValue
                        if newValue {
                            requestNotificationPermission()
                        } else {
                            NotificationManager.shared.cancelAllNotifications()
                        }
                    }
                ))
            }
            
            // 默认提醒时间
            if notificationsEnabled {
                HStack {
                    Label("默认提醒时间", systemImage: "clock")
                    Spacer()
                    Picker("提醒时间", selection: $defaultReminderTime) {
                        ForEach(ReminderTime.allCases, id: \.self) { reminder in
                            Text(reminder.displayName).tag(reminder)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
            }
        } header: {
            Text("通知设置")
        } footer: {
            Text("通知功能用于在日程开始前提醒您。您可以在iOS设置中管理通知权限。")
        }
    }
    
    /// 通用设置区域
    /// - Note: 包含周起始日设置和数据清除功能
    private var generalSection: some View {
        Section {
            // 周起始日设置
            HStack {
                Label("周起始日", systemImage: "calendar")
                Spacer()
                Picker("周起始日", selection: Binding(
                    get: { weekStartsOnMonday ? "周一" : "周日" },
                    set: { newValue in
                        weekStartsOnMonday = (newValue == "周一")
                    }
                )) {
                    Text("周一").tag("周一")
                    Text("周日").tag("周日")
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(width: 120)
            }
            
            // 清除所有数据
            Button(role: .destructive) {
                clearAllData()
            } label: {
                Label("清除所有数据", systemImage: "trash")
            }
            .alert("确认清除", isPresented: $showingClearDataAlert) {
                Button("清除", role: .destructive) {
                    clearAllData()
                }
                Button("取消", role: .cancel) { }
            } message: {
                Text("此操作将永久删除所有事件和设置，无法撤销。")
            }
        } header: {
            Text("通用设置")
        } footer: {
            Text("清除所有数据将永久删除所有事件和设置。此操作无法撤销。")
        }
    }
    
    /// 关于区域
    private var aboutSection: some View {
        Section {
            HStack {
                Text("版本")
                Spacer()
                Text(appVersion)
                    .foregroundColor(.secondary)
            }
            
            HStack {
                Text("开发者")
                Spacer()
                Text("SwiftCalender Team")
                    .foregroundColor(.secondary)
            }
        } header: {
            Text("关于")
        }
    }
    
    // MARK: - Helper Methods
    
    /// 请求通知权限
    /// - Note: 异步处理权限请求，失败时显示引导提示
    private func requestNotificationPermission() {
        Task {
            do {
                let granted = try await viewModel.requestNotificationPermission()
                if !granted {
                    await MainActor.run {
                        showingNotificationPermission = true
                    }
                }
            } catch {
                print("请求通知权限失败: \(error)")
            }
        }
    }
    
    private func openAppSettings() {
        if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(settingsUrl)
        }
    }
    
    /// 清除所有数据
    /// - Note: 删除所有事件、取消通知并重置用户设置
    private func clearAllData() {
        NotificationManager.shared.cancelAllNotifications()
        
        // 清除所有事件
        for event in viewModel.events {
            viewModel.deleteEvent(event)
        }
        
        // 重置用户设置
        defaultReminderTime = .fifteenMinutes
        weekStartsOnMonday = true
        notificationsEnabled = true
        
        showingClearDataAlert = false
    }
    
    @State private var showingClearDataAlert = false
    
    private var appVersion: String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }
}