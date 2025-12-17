//
//  EventListView.swift
//  SwiftCalender
//
//  日程列表视图 - 按时间顺序显示选定日期的所有事件
//  支持左滑删除/编辑操作，浮动"+"按钮添加新事件
//

import SwiftUI

/// 日程列表视图
/// - Note: 提供直观的用户界面，支持事件管理和通知切换
struct EventListView: View {
    @ObservedObject var viewModel: EventViewModel
    @State private var showingAddEvent = false
    @State private var showingEditEvent: Event?
    
    var body: some View {
        NavigationView {
            ZStack {
                // 主要内容
                VStack(spacing: 0) {
                    // 选中的日期标题
                    selectedDateHeader
                    
                    // 事件列表
                    eventList
                }
                
                // 浮动添加按钮
                floatingAddButton
            }
            .navigationTitle("日程")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("今天") {
                        viewModel.goToToday()
                    }
                    .font(.subheadline)
                    .foregroundColor(.blue)
                }
            }
            .sheet(isPresented: $showingAddEvent) {
                AddEditEventView(viewModel: viewModel, isPresented: $showingAddEvent)
            }
            .sheet(item: $showingEditEvent) { event in
                AddEditEventView(viewModel: viewModel, event: event, isPresented: .constant(false))
            }
        }
    }
    
    // MARK: - Views
    
    /// 选中日期标题
    private var selectedDateHeader: some View {
        VStack(spacing: 8) {
            HStack {
                Text(viewModel.selectedDateString)
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Spacer()
            }
            
            // 日期信息
            HStack {
                Text(weekdayString(for: viewModel.selectedDate))
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                let eventCount = viewModel.getEventCountForDate(viewModel.selectedDate)
                Text("\(eventCount) 个事件")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.white)
    }
    
    /// 事件列表
    private var eventList: some View {
        let events = viewModel.getEventsForDate(viewModel.selectedDate)
        
        if events.isEmpty {
            // 空状态视图
            emptyStateView
        } else {
            List {
                ForEach(events) { event in
                    EventRowView(event: event)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            Button(role: .destructive) {
                                withAnimation(.easeInOut) {
                                    viewModel.deleteEvent(event)
                                }
                            } label: {
                                Label("删除", systemImage: "trash")
                            }
                            
                            Button {
                                showingEditEvent = event
                            } label: {
                                Label("编辑", systemImage: "pencil")
                            }
                            .tint(.blue)
                        }
                        .swipeActions(edge: .leading) {
                            Button {
                                toggleNotification(for: event)
                            } label: {
                                Label(event.isNotificationEnabled ? "关闭提醒" : "开启提醒", 
                                      systemImage: event.isNotificationEnabled ? "bell.slash" : "bell")
                            }
                            .tint(event.isNotificationEnabled ? .orange : .green)
                        }
                }
            }
            .listStyle(.plain)
            .background(Color.white)
        }
    }
    
    /// 空状态视图
    private var emptyStateView: some View {
        VStack(spacing: 24) {
            Image(systemName: "calendar.badge.plus")
                .font(.system(size: 60))
                .foregroundColor(.gray.opacity(0.5))
            
            VStack(spacing: 8) {
                Text("暂无日程")
                    .font(.title3)
                    .fontWeight(.medium)
                    .foregroundColor(.primary)
                
                Text("点击下方的 + 按钮添加新事件")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            Button(action: {
                showingAddEvent = true
            }) {
                HStack(spacing: 8) {
                    Image(systemName: "plus")
                    Text("添加事件")
                }
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(Color.blue)
                .cornerRadius(8)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(.horizontal, 32)
        .background(Color.white)
    }
    
    /// 浮动添加按钮
    private var floatingAddButton: some View {
        VStack {
            Spacer()
            HStack {
                Spacer()
                Button(action: {
                    showingAddEvent = true
                }) {
                    Image(systemName: "plus")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 56, height: 56)
                        .background(Color.blue)
                        .clipShape(Circle())
                        .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 4)
                }
                .padding(.trailing, 20)
                .padding(.bottom, 20)
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func weekdayString(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE"
        return formatter.string(from: date)
    }
    
    private func toggleNotification(for event: Event) {
        let newNotificationState = !event.isNotificationEnabled
        viewModel.updateEvent(event, isNotificationEnabled: newNotificationState)
    }
}

/// 事件行视图
struct EventRowView: View {
    let event: Event
    
    private let timeFormatter: DateFormatter
    
    init(event: Event) {
        self.event = event
        timeFormatter = DateFormatter()
        timeFormatter.dateFormat = "HH:mm"
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top, spacing: 12) {
                // 时间显示
                VStack(alignment: .center, spacing: 2) {
                    Text(timeFormatter.string(from: event.date))
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                    
                    if event.repeatRule != .none {
                        Image(systemName: "arrow.clockwise")
                            .font(.caption2)
                            .foregroundColor(.blue)
                    }
                }
                .frame(width: 50)
                
                // 事件信息
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.title)
                        .font(.body)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                        .multilineTextAlignment(.leading)
                    
                    // 地点信息
                    if let location = event.location, !location.isEmpty {
                        HStack(spacing: 4) {
                            Image(systemName: "mappin.circle")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            
                            Text(location)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                    
                    // 提醒信息
                    if event.reminderTime != .none {
                        HStack(spacing: 4) {
                            Image(systemName: "bell")
                                .font(.caption)
                                .foregroundColor(event.isNotificationEnabled ? .blue : .gray)
                            
                            Text(event.reminderTime.displayName)
                                .font(.caption)
                                .foregroundColor(event.isNotificationEnabled ? .blue : .gray)
                        }
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                
                // 重复规则指示器
                if event.repeatRule != .none {
                    Text(event.repeatRule.rawValue)
                        .font(.caption2)
                        .fontWeight(.medium)
                        .foregroundColor(.blue)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.1))
                        .clipShape(Capsule())
                }
            }
        }
        .padding(.vertical, 8)
        .contentShape(Rectangle())
    }
}