//
//  EventViewModel.swift
//  SwiftCalender
//
//  事件管理ViewModel - 负责数据的CRUD操作和业务逻辑
//  使用MVVM架构模式
//

import Foundation
import SwiftData
import SwiftUI
import Combine

/// 事件管理ViewModel
@MainActor
class EventViewModel: ObservableObject {
    // MARK: - Published Properties
    
    /// 所有事件列表
    @Published var events: [Event] = []
    
    /// 当前选中的日期
    @Published var selectedDate: Date = Date()
    
    /// 当前显示的月份
    @Published var currentMonth: Date = Date()
    
    /// 是否加载中
    @Published var isLoading: Bool = false
    
    /// 错误信息
    @Published var errorMessage: String?
    
    // MARK: - Properties
    
    private(set) var context: ModelContext
    private let notificationManager = NotificationManager.shared
    
    // MARK: - Initialization
    
    init(modelContext: ModelContext) {
        self.context = modelContext
        Task { @MainActor in
            loadEvents()
        }
    }
    
    /// 更新ModelContext（用于SwiftUI environment）
    func updateContext(_ newContext: ModelContext) {
        self.context = newContext
        loadEvents()
    }
    
    // MARK: - Public Methods
    
    /// 加载所有事件
    func loadEvents() {
        isLoading = true
        do {
            let descriptor = FetchDescriptor<Event>(sortBy: [SortDescriptor(\.date, order: .forward)])
            events = try context.fetch(descriptor)
            isLoading = false
        } catch {
            errorMessage = "加载事件失败: \(error.localizedDescription)"
            isLoading = false
        }
    }
    
    /// 创建新事件
    /// - Parameters:
    ///   - title: 事件标题，不能为空
    ///   - date: 事件日期时间
    ///   - location: 事件地点，可选
    ///   - repeatRule: 重复规则，默认为不重复
    ///   - reminderTime: 提醒时间，默认为不提醒
    ///   - isNotificationEnabled: 是否启用通知，默认为true
    /// - Note: 创建成功后会自动安排通知（如果启用且设置了提醒时间）
    func createEvent(title: String, date: Date, location: String? = nil, repeatRule: RepeatRule = .none, reminderTime: ReminderTime = .none, isNotificationEnabled: Bool = true) {
        let event = Event(
            title: title,
            date: date,
            location: location,
            repeatRule: repeatRule,
            reminderTime: reminderTime,
            isNotificationEnabled: isNotificationEnabled
        )
        
        do {
            context.insert(event)
            try context.save()
            
            // 如果启用了通知，安排通知
            if isNotificationEnabled && reminderTime != .none {
                notificationManager.scheduleNotification(for: event)
            }
            
            loadEvents() // 重新加载数据
        } catch {
            errorMessage = "创建事件失败: \(error.localizedDescription)"
        }
    }
    
    /// 更新事件
    /// - Parameters:
    ///   - event: 要更新的事件对象
    ///   - title: 新的事件标题，可选
    ///   - date: 新的事件日期时间，可选
    ///   - location: 新的事件地点，可选
    ///   - repeatRule: 新的重复规则，可选
    ///   - reminderTime: 新的提醒时间，可选
    ///   - isNotificationEnabled: 新的通知启用状态，可选
    /// - Note: 只有传入非nil的参数才会被更新，通知会根据新设置重新安排
    func updateEvent(_ event: Event, title: String? = nil, date: Date? = nil, location: String? = nil, repeatRule: RepeatRule? = nil, reminderTime: ReminderTime? = nil, isNotificationEnabled: Bool? = nil) {
        var hasChanges = false
        
        if let title = title, title != event.title {
            event.title = title
            hasChanges = true
        }
        
        if let date = date, !Calendar.current.isDate(date, inSameDayAs: event.date) {
            event.date = date
            hasChanges = true
        }
        
        if let location = location, location != event.location {
            event.location = location
            hasChanges = true
        }
        
        if let repeatRule = repeatRule, repeatRule != event.repeatRule {
            event.repeatRule = repeatRule
            hasChanges = true
        }
        
        if let reminderTime = reminderTime, reminderTime != event.reminderTime {
            event.reminderTime = reminderTime
            hasChanges = true
        }
        
        if let isNotificationEnabled = isNotificationEnabled, isNotificationEnabled != event.isNotificationEnabled {
            event.isNotificationEnabled = isNotificationEnabled
            hasChanges = true
        }
        
        if hasChanges {
            event.updateTimestamp()
            
            do {
                try context.save()
                
                // 更新通知
                if event.isNotificationEnabled && event.reminderTime != .none {
                    notificationManager.cancelNotification(for: event.id)
                    notificationManager.scheduleNotification(for: event)
                } else {
                    notificationManager.cancelNotification(for: event.id)
                }
                
                loadEvents()
            } catch {
                errorMessage = "更新事件失败: \(error.localizedDescription)"
            }
        }
    }
    
    /// 删除事件
    /// - Parameter event: 要删除的事件对象
    /// - Note: 删除前会先取消该事件的所有通知提醒
    func deleteEvent(_ event: Event) {
        // 取消通知
        notificationManager.cancelNotification(for: event.id)
        
        do {
            context.delete(event)
            try context.save()
            loadEvents()
        } catch {
            errorMessage = "删除事件失败: \(error.localizedDescription)"
        }
    }
    
    /// 根据日期获取事件
    /// - Parameter date: 指定日期
    /// - Returns: 该日期的所有事件，按时间升序排列
    /// - Note: 使用SwiftData查询，按日期过滤并排序
    func getEventsForDate(_ date: Date) -> [Event] {
        return events.filter { event in
            Calendar.current.isDate(event.date, inSameDayAs: date)
        }.sorted { $0.date < $1.date }
    }
    
    /// 获取某个月的事件
    /// - Parameter date: 月份中的任意日期
    /// - Returns: 该月份的所有事件，按时间升序排列
    /// - Note: 使用日期区间查询来获取整月的事件
    func getEventsForMonth(_ date: Date) -> [Event] {
        let calendar = Calendar.current
        let monthStart = calendar.dateInterval(of: .month, for: date)?.start ?? date
        let monthEnd = calendar.dateInterval(of: .month, for: date)?.end ?? date
        
        return events.filter { event in
            event.date >= monthStart && event.date < monthEnd
        }.sorted { $0.date < $1.date }
    }
    
    /// 切换到上一个月
    /// - Note: 更新currentMonth和selectedDate视图状态
    func goToPreviousMonth() {
        currentMonth = Calendar.current.date(byAdding: .month, value: -1, to: currentMonth) ?? currentMonth
    }
    
    /// 切换到下一个月
    /// - Note: 更新currentMonth和selectedDate视图状态
    func goToNextMonth() {
        currentMonth = Calendar.current.date(byAdding: .month, value: 1, to: currentMonth) ?? currentMonth
    }
    
    /// 回到今天
    func goToToday() {
        currentMonth = Date()
        selectedDate = Date()
    }
    
    /// 检查指定日期是否有事件
    func hasEventsOnDate(_ date: Date) -> Bool {
        return !getEventsForDate(date).isEmpty
    }
    
    /// 获取特定日期的事件数量
    func getEventCountForDate(_ date: Date) -> Int {
        return getEventsForDate(date).count
    }
    
    /// 请求通知权限
    func requestNotificationPermission() async throws -> Bool {
        return try await notificationManager.requestAuthorization()
    }
    
    /// 清除错误信息
    func clearError() {
        errorMessage = nil
    }
    
    // MARK: - Computed Properties
    
    /// 月份格式化字符串
    var monthYearString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy年M月"
        return formatter.string(from: currentMonth)
    }
    
    /// 当天格式化字符串
    var todayString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "M月d日"
        return formatter.string(from: Date())
    }
    
    /// 选中日期的格式化字符串
    var selectedDateString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy年M月d日"
        return formatter.string(from: selectedDate)
    }
}

// MARK: - Calendar Helper Extensions

extension Calendar {
    /// 获取某个月的日期网格
    func datesOfMonth(_ date: Date, startingOnMonday: Bool = false) -> [Date?] {
        let calendar = Calendar.current
        var dates: [Date?] = []
        
        guard let monthInterval = calendar.dateInterval(of: .month, for: date),
              let monthStart = calendar.dateInterval(of: .weekOfMonth, for: monthInterval.start)?.start else {
            return dates
        }
        
        let firstDayOfMonth = monthInterval.start
        let weekday = calendar.component(.weekday, from: firstDayOfMonth)
        let daysToAdd = startingOnMonday ? (weekday + 6) % 7 : weekday - 1
        
        // 添加上个月的占位日期
        for i in 0..<daysToAdd {
            if let date = calendar.date(byAdding: .day, value: -daysToAdd + i, to: firstDayOfMonth) {
                dates.append(date)
            } else {
                dates.append(nil)
            }
        }
        
        // 添加当前月的所有日期
        var currentDate = firstDayOfMonth
        while currentDate < monthInterval.end {
            dates.append(currentDate)
            if let nextDay = calendar.date(byAdding: .day, value: 1, to: currentDate) {
                currentDate = nextDay
            } else {
                break
            }
        }
        
        // 添加下个月的占位日期直到填满6行
        let totalCells = 42 // 6周 × 7天
        while dates.count < totalCells {
            let lastDate = dates.last ?? firstDayOfMonth
            if let nextDate = calendar.date(byAdding: .day, value: 1, to: lastDate) {
                dates.append(nextDate)
            } else {
                dates.append(nil)
            }
        }
        
        return dates
    }
}