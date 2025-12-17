//
//  NotificationManager.swift
//  SwiftCalender
//
//  通知管理器 - 负责本地通知的创建、调度和管理
//  支持应用在前台、后台、终止状态下的提醒
//

import Foundation
import UserNotifications
import SwiftUI

/// 通知管理器单例类
class NotificationManager: NSObject, ObservableObject {
    static let shared = NotificationManager()
    
    /// 通知权限状态
    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined
    
    private override init() {
        super.init()
        Task {
            await getAuthorizationStatus()
        }
    }
    
    // MARK: - Public Methods
    
    /// 请求通知权限
    func requestAuthorization() async throws -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])
            await getAuthorizationStatus()
            return granted
        } catch {
            throw NotificationError.authorizationFailed(error)
        }
    }
    
    /// 为事件创建并调度通知
    func scheduleNotification(for event: Event) {
        guard event.isNotificationEnabled,
              event.reminderTime != .none else { return }
        
        // 计算提醒时间
        let notificationDate = Calendar.current.date(byAdding: .minute, value: -event.reminderTime.rawValue, to: event.date)
        guard notificationDate?.timeIntervalSinceNow ?? 0 > 0 else { return }
        
        let content = UNMutableNotificationContent()
        content.title = "日程提醒"
        content.body = "\(event.title) 即将开始"
        content.sound = .default
        content.userInfo = ["eventId": event.id.uuidString]
        
        // 如果有地点信息，添加到副标题
        if let location = event.location, !location.isEmpty {
            content.subtitle = "地点: \(location)"
        }
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: notificationDate!), repeats: false)
        let request = UNNotificationRequest(identifier: event.id.uuidString, content: content, trigger: trigger)
        
        Task {
            do {
                try await UNUserNotificationCenter.current().add(request)
                print("已为事件 '\(event.title)' 安排通知")
            } catch {
                print("安排通知失败: \(error)")
            }
        }
    }
    
    /// 取消特定事件的通知
    func cancelNotification(for eventId: UUID) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [eventId.uuidString])
        print("已取消事件 \(eventId) 的通知")
    }
    
    /// 取消所有通知
    func cancelAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        print("已取消所有通知")
    }
    
    /// 检查是否有挂起的通知
    func getPendingNotifications() async -> [UNNotificationRequest] {
        return await UNUserNotificationCenter.current().pendingNotificationRequests()
    }
    
    // MARK: - Private Methods
    
    /// 获取当前授权状态
    @MainActor
    private func getAuthorizationStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authorizationStatus = settings.authorizationStatus
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationManager: UNUserNotificationCenterDelegate {
    
    /// 应用在前台时收到通知时的处理
    func userNotificationCenter(_ center: UNUserNotificationCenter, 
                               willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        return [.banner, .sound, .badge]
    }
    
    /// 用户点击通知时的处理
    func userNotificationCenter(_ center: UNUserNotificationCenter, 
                               didReceive response: UNNotificationResponse) async {
        // 处理用户点击通知的逻辑
        // 这里可以添加打开应用并显示相关事件的逻辑
        print("用户点击了通知: \(response.notification.request.identifier)")
    }
}

// MARK: - Error Types

/// 通知相关错误
enum NotificationError: Error, LocalizedError {
    case authorizationFailed(Error)
    case schedulingFailed(Error)
    case invalidEventData
    
    var errorDescription: String? {
        switch self {
        case .authorizationFailed(let error):
            return "通知授权失败: \(error.localizedDescription)"
        case .schedulingFailed(let error):
            return "安排通知失败: \(error.localizedDescription)"
        case .invalidEventData:
            return "事件数据无效"
        }
    }
}