//
//  Event.swift
//  SwiftCalender
//
//  日程事件数据模型
//  使用SwiftData进行本地持久化存储
//

import Foundation
import SwiftData

/// 重复规则枚举
enum RepeatRule: String, CaseIterable, Codable {
    case none = "不重复"
    case daily = "每日"
    case weekly = "每周"
    case monthly = "每月"
}

/// 提醒时间枚举
enum ReminderTime: Int, CaseIterable, Codable {
    case none = 0
    case fiveMinutes = 5
    case fifteenMinutes = 15
    case thirtyMinutes = 30
    
    var displayName: String {
        switch self {
        case .none:
            return "不提醒"
        case .fiveMinutes:
            return "提前5分钟"
        case .fifteenMinutes:
            return "提前15分钟"
        case .thirtyMinutes:
            return "提前30分钟"
        }
    }
}

/// 日程事件模型
@Model
class Event {
    /// 事件唯一标识符
    @Attribute(.unique) var id: UUID
    
    /// 事件标题
    var title: String
    
    /// 事件日期时间
    var date: Date
    
    /// 事件地点
    var location: String?
    
    /// 重复规则
    var repeatRule: RepeatRule
    
    /// 提醒时间
    var reminderTime: ReminderTime
    
    /// 创建时间
    var createdAt: Date
    
    /// 最后更新时间
    var updatedAt: Date
    
    /// 是否启用通知
    var isNotificationEnabled: Bool
    
    init(
        id: UUID = UUID(),
        title: String,
        date: Date,
        location: String? = nil,
        repeatRule: RepeatRule = .none,
        reminderTime: ReminderTime = .none,
        isNotificationEnabled: Bool = true
    ) {
        self.id = id
        self.title = title
        self.date = date
        self.location = location
        self.repeatRule = repeatRule
        self.reminderTime = reminderTime
        self.isNotificationEnabled = isNotificationEnabled
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    /// 更新事件时自动更新updatedAt字段
    func updateTimestamp() {
        updatedAt = Date()
    }
}