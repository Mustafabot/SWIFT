//
//  CalendarView.swift
//  SwiftCalender
//
//  日历视图 - 月视图模式
//  显示当前月份日历，支持日期选择和跳转
//

import SwiftUI

/// 日历视图（月视图）
struct CalendarView: View {
    @ObservedObject var viewModel: EventViewModel
    @State private var showingDatePicker = false
    
    // MARK: - Constants
    
    private let columns = Array(repeating: GridItem(.flexible()), count: 7)
    private let weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // 月份导航栏
                monthNavigationBar
                
                // 星期标题
                weekdayHeader
                
                // 日历网格
                calendarGrid
                
                Spacer()
            }
            .padding(.horizontal, 16)
            .background(Color.white)
        }
    }
    
    // MARK: - Views
    
    /// 月份导航栏
    private var monthNavigationBar: some View {
        HStack {
            Button(action: {
                viewModel.goToPreviousMonth()
            }) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primary)
            }
            
            Spacer()
            
            Text(viewModel.monthYearString)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(.primary)
                .onTapGesture {
                    showingDatePicker = true
                }
            
            Spacer()
            
            Button(action: {
                viewModel.goToNextMonth()
            }) {
                Image(systemName: "chevron.right")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.primary)
            }
        }
        .padding(.horizontal, 4)
        .sheet(isPresented: $showingDatePicker) {
            DatePicker("选择日期", selection: Binding(
                get: { viewModel.currentMonth },
                set: { newDate in
                    viewModel.currentMonth = newDate
                    viewModel.selectedDate = newDate
                }
            ), displayedComponents: [.date])
                .datePickerStyle(.graphical)
                .labelsHidden()
                .presentationDetents([.medium])
        }
    }
    
    /// 星期标题
    private var weekdayHeader: some View {
        HStack(spacing: 0) {
            ForEach(weekdays, id: \.self) { weekday in
                Text(weekday)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
            }
        }
    }
    
    /// 日历网格
    private var calendarGrid: some View {
        LazyVGrid(columns: columns, spacing: 1) {
            ForEach(viewModel.datesOfMonth(viewModel.currentMonth, startingOnMonday: true).indices, id: \.self) { index in
                let date = viewModel.datesOfMonth(viewModel.currentMonth, startingOnMonday: true)[index]
                
                if let date = date {
                    CalendarDayView(
                        date: date,
                        isSelected: Calendar.current.isDate(date, inSameDayAs: viewModel.selectedDate),
                        isToday: Calendar.current.isDateInToday(date),
                        hasEvents: viewModel.hasEventsOnDate(date),
                        eventCount: viewModel.getEventCountForDate(date)
                    )
                    .onTapGesture {
                        viewModel.selectedDate = date
                    }
                } else {
                    // 占位符
                    Rectangle()
                        .fill(Color.clear)
                        .frame(height: 40)
                }
            }
        }
        .background(Color.gray.opacity(0.1))
        .cornerRadius(8)
    }
}

/// 日历日期单元格视图
/// 显示单个日期的日历网格单元，包含日期数字和事件指示器
/// 支持选中状态、今天标识和事件数量显示
struct CalendarDayView: View {
    let date: Date
    let isSelected: Bool
    let isToday: Bool
    let hasEvents: Bool
    let eventCount: Int
    
    private let dayFormatter = DateFormatter()
    
    init(date: Date, isSelected: Bool, isToday: Bool, hasEvents: Bool, eventCount: Int) {
        self.date = date
        self.isSelected = isSelected
        self.isToday = isToday
        self.hasEvents = hasEvents
        self.eventCount = eventCount
        dayFormatter.dateFormat = "d"
    }
    
    var body: some View {
        VStack(spacing: 4) {
            // 日期数字
            Text(dayFormatter.string(from: date))
                .font(.body)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(textColor)
                .frame(width: 36, height: 36)
                .background(backgroundColor)
                .clipShape(Circle())
            
            // 事件指示器
            if hasEvents {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 6, height: 6)
                    .overlay(
                        Text("\(eventCount)")
                            .font(.caption2)
                            .foregroundColor(.white)
                    )
            }
        }
        .frame(height: 50)
        .contentShape(Rectangle())
    }
    
    // MARK: - Computed Properties
    
    private var textColor: Color {
        if isSelected {
            return .white
        } else if isToday {
            return .blue
        } else {
            return .primary
        }
    }
    
    private var backgroundColor: Color {
        if isSelected {
            return .blue
        } else if isToday {
            return Color.blue.opacity(0.1)
        } else {
            return Color.clear
        }
    }
}

// MARK: - Extensions

extension EventViewModel {
    /// 获取某个月的日期网格（星期一为起始日）
    func datesOfMonth(_ date: Date, startingOnMonday: Bool = false) -> [Date?] {
        let calendar = Calendar.current
        var dates: [Date?] = []
        
        guard let monthInterval = calendar.dateInterval(of: .month, for: date),
              let monthStart = monthInterval.start else {
            return dates
        }
        
        let firstDayOfMonth = monthStart
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
            if let lastDate = dates.last, let lastDate = lastDate {
                if let nextDate = calendar.date(byAdding: .day, value: 1, to: lastDate) {
                    dates.append(nextDate)
                } else {
                    dates.append(nil)
                }
            } else {
                dates.append(nil)
            }
        }
        
        return dates
    }
}