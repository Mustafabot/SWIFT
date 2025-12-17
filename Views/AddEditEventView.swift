//
//  AddEditEventView.swift
//  SwiftCalender
//
//  添加/编辑事件视图 - 用于创建新事件或编辑现有事件
//  包含表单输入和验证功能
//

import SwiftUI

/// 添加/编辑事件视图
/// 提供创建新事件或编辑现有事件的完整表单界面
/// - Note: 支持表单验证、错误提示和数据绑定
struct AddEditEventView: View {
    @ObservedObject var viewModel: EventViewModel
    let event: Event?
    
    @Binding var isPresented: Bool
    
    // 表单字段
    @State private var title: String = ""
    @State private var date: Date = Date()
    @State private var location: String = ""
    @State private var repeatRule: RepeatRule = .none
    @State private var reminderTime: ReminderTime = .none
    @State private var isNotificationEnabled: Bool = true
    
    // 验证状态
    @State private var showingValidationError = false
    @State private var validationMessage: String = ""
    
    // 是否为编辑模式
    private var isEditing: Bool {
        event != nil
    }
    
    init(viewModel: EventViewModel, event: Event? = nil, isPresented: Binding<Bool>) {
        self.viewModel = viewModel
        self.event = event
        self._isPresented = isPresented
        _title = State(initialValue: event?.title ?? "")
        _date = State(initialValue: event?.date ?? Date())
        _location = State(initialValue: event?.location ?? "")
        _repeatRule = State(initialValue: event?.repeatRule ?? .none)
        _reminderTime = State(initialValue: event?.reminderTime ?? .fifteenMinutes)
        _isNotificationEnabled = State(initialValue: event?.isNotificationEnabled ?? true)
    }
    
    var body: some View {
        NavigationView {
            Form {
                // 基本信息区域
                basicInfoSection
                
                // 时间和重复设置
                timeRepeatSection
                
                // 提醒设置
                reminderSection
            }
            .navigationTitle(isEditing ? "编辑事件" : "添加事件")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("取消") {
                        isPresented = false
                    }
                    .foregroundColor(.primary)
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(isEditing ? "保存" : "添加") {
                        saveEvent()
                    }
                    .fontWeight(.semibold)
                    .foregroundColor(.blue)
                    .disabled(title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .alert("输入错误", isPresented: $showingValidationError) {
                Button("确定") { }
            } message: {
                Text(validationMessage)
            }
        }
    }
    
    // MARK: - Views
    
    /// 基本信息区域
    private var basicInfoSection: some View {
        Section {
            // 事件标题
            VStack(alignment: .leading, spacing: 8) {
                Text("标题 *")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                TextField("请输入事件标题", text: $title)
                    .textFieldStyle(.roundedBorder)
            }
            
            // 地点
            VStack(alignment: .leading, spacing: 8) {
                Text("地点")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                TextField("请输入地点（可选）", text: $location)
                    .textFieldStyle(.roundedBorder)
            }
        } header: {
            Text("基本信息")
        } footer: {
            Text("标题为必填项，地点信息可选。")
        }
    }
    
    /// 时间和重复设置
    private var timeRepeatSection: some View {
        Section {
            // 日期时间选择
            VStack(alignment: .leading, spacing: 8) {
                Text("日期时间")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                DatePicker("", selection: $date, displayedComponents: [.date, .hourAndMinute])
                    .datePickerStyle(.compact)
                    .labelsHidden()
            }
            
            // 重复规则
            VStack(alignment: .leading, spacing: 8) {
                Text("重复规则")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Picker("重复规则", selection: $repeatRule) {
                    ForEach(RepeatRule.allCases, id: \.self) { rule in
                        Text(rule.rawValue).tag(rule)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
            }
        } header: {
            Text("时间和重复")
        } footer: {
            Text("设置事件是否重复以及重复的频率。")
        }
    }
    
    /// 提醒设置
    private var reminderSection: some View {
        Section {
            // 通知开关
            Toggle("开启提醒", isOn: $isNotificationEnabled)
            
            if isNotificationEnabled {
                // 提醒时间选择
                VStack(alignment: .leading, spacing: 8) {
                    Text("提醒时间")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Picker("提醒时间", selection: $reminderTime) {
                        ForEach(ReminderTime.allCases, id: \.self) { time in
                            Text(time.displayName).tag(time)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
            }
        } header: {
            Text("提醒设置")
        } footer: {
            Text("开启提醒后，系统会在指定时间发送本地通知。")
        }
    }
    
    // MARK: - Actions
    
    private func saveEvent() {
        // 验证输入
        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedTitle.isEmpty else {
            validationMessage = "请输入事件标题"
            showingValidationError = true
            return
        }
        
        guard date.timeIntervalSinceNow > -60 else {
            validationMessage = "请选择未来时间"
            showingValidationError = true
            return
        }
        
        // 保存事件
        if isEditing, let event = event {
            viewModel.updateEvent(
                event,
                title: trimmedTitle,
                date: date,
                location: location.isEmpty ? nil : location,
                repeatRule: repeatRule,
                reminderTime: isNotificationEnabled ? reminderTime : .none,
                isNotificationEnabled: isNotificationEnabled
            )
        } else {
            viewModel.createEvent(
                title: trimmedTitle,
                date: date,
                location: location.isEmpty ? nil : location,
                repeatRule: repeatRule,
                reminderTime: isNotificationEnabled ? reminderTime : .none,
                isNotificationEnabled: isNotificationEnabled
            )
        }
        
        // 关闭视图
        isPresented = false
    }
}

// MARK: - Preview

struct AddEditEventView_Previews: PreviewProvider {
    static var previews: some View {
        let context = try! ModelContainer(for: [Event.self]).mainContext
        let viewModel = EventViewModel(modelContext: context)
        
        NavigationView {
            AddEditEventView(viewModel: viewModel, isPresented: .constant(true))
        }
    }
}