Cây thư mục tổng quát: src/features/gantt **✅ IMPLEMENTED**

```
src/features/gantt/
├── components/                 # ✅ UI Components (Chỉ hiển thị, ít logic)
│   ├── bars/                   # ✅ Các thanh hiển thị trên biểu đồ
│   │   ├── TaskBar.tsx         # ✅ Thanh hiển thị task (màu, tiến độ)
│   │   ├── MilestoneDiamond.tsx # ✅ Biểu tượng hình thoi cho milestone
│   │   ├── ProgressBar.tsx     # ✅ Progress indicator
│   │   └── DependencyLine.tsx  # ✅ Đường nối mũi tên phụ thuộc (SVG)
│   ├── columns/                # ✅ Cột dữ liệu bảng bên trái
│   │   ├── TaskListTable.tsx   # ✅ Bảng danh sách bên trái
│   │   ├── TaskRow.tsx         # ✅ Một dòng trong bảng
│   │   ├── TaskGrid.tsx        # ✅ Grid layout (MIGRATED)
│   │   └── columns-def.tsx     # ✅ Cấu hình cột (Tên, Ngày bắt đầu...)
│   ├── dialogs/                # ✅ Các form popup (Add/Edit)
│   │   ├── TaskDetailDialog.tsx # ✅ Form sửa chi tiết task
│   │   ├── CreateTaskDialog.tsx # ✅ Form tạo mới (MIGRATED)
│   │   ├── BaselineManagerDialog.tsx # ✅ Baseline mgmt (MIGRATED)
│   │   ├── MilestoneDialog.tsx # ✅ Milestone settings (MIGRATED)
│   │   ├── StatusSettingsDialog.tsx # ✅ Status settings (MIGRATED)
│   │   ├── LabelSettingsDialog.tsx # ✅ Label settings (MIGRATED)
│   │   └── ViewSettingsDialog.tsx # ✅ Cấu hình hiển thị
│   ├── timeline/               # ✅ Lưới thời gian (Grid, Header)
│   │   ├── ChartArea.tsx       # ✅ Khu vực vẽ biểu đồ chính
│   │   ├── TimelineHeader.tsx  # ✅ Thanh ngày tháng phía trên
│   │   ├── TimelineGrid.tsx    # ✅ Lưới kẻ dọc background
│   │   ├── TimeMarker.tsx      # ✅ Đường kẻ hiện tại (Today)
│   │   └── GanttPanels.tsx     # ✅ Panel layout
│   ├── toolbar/                # ✅ Thanh công cụ (Zoom, Filter)
│   │   ├── GanttToolbar.tsx    # ✅ Thanh công cụ tổng (MIGRATED)
│   │   ├── ViewModeSelector.tsx # ✅ Dropdown chọn Day/Week/Month
│   │   └── FilterControls.tsx  # ✅ Filter controls
│   ├── GanttChart.tsx          # ✅ Chart component (MIGRATED)
│   ├── GanttPanels.tsx         # ✅ Panel layout (MIGRATED)
│   └── index.ts                # ✅ Component exports
│
├── services/                   # ✅ API Layer (Quan trọng: Switch Real/Mock)
│   ├── interfaces/             # ✅ Định nghĩa hàm (Contract)
│   │   ├── task.interface.ts   # ✅ Task contract
│   │   ├── allocation.interface.ts # ✅ Allocation contract
│   │   └── settings.interface.ts # ✅ Settings contract
│   ├── api/                    # ✅ Supabase services
│   │   ├── task.service.ts     # ✅ Task API
│   │   ├── allocation.service.ts # ✅ Allocation API
│   │   └── settings.service.ts # ✅ Settings API
│   ├── mocks/                  # ✅ Mock data
│   │   ├── data/
│   │   │   ├── mock-tasks.ts   # ✅ Data JSON cứng
│   │   │   └── mock-allocations.ts # ✅ Mock allocations
│   │   ├── task.mock.ts        # ✅ Service giả
│   │   ├── allocation.mock.ts  # ✅ Service giả
│   │   └── index.ts            # ✅ Mock exports
│   └── factory.ts              # ✅ Switch chuyển đổi Real/Mock
│
├── store/                      # ✅ Global State (Zustand)
│   ├── slices/                 # ✅ Các phần nhỏ của store
│   │   ├── task-slice.ts       # ✅ Task state
│   │   ├── ui-slice.ts         # ✅ UI state
│   │   └── view-slice.ts       # ✅ View state
│   ├── gantt.store.ts          # ✅ Main Store (Zustand)
│   └── gantt.selector.ts       # ✅ Hàm lấy dữ liệu (Selectors)
│
├── hooks/                      # ✅ React Hooks (Cầu nối UI <-> Store/Service)
│   ├── queries/                # ✅ Lấy dữ liệu (useQuery)
│   │   ├── useTaskQueries.ts   # ✅ Task queries
│   │   ├── useAllocationQueries.ts # ✅ Allocation queries
│   │   └── useSettingQueries.ts # ✅ Settings queries
│   ├── mutations/              # ✅ Sửa dữ liệu (useMutation)
│   │   ├── useTaskMutations.ts # ✅ Task mutations
│   │   └── useAllocationMutations.ts # ✅ Allocation mutations
│   ├── ui/                     # ✅ Logic giao diện
│   │   ├── useGanttDnd.ts      # ✅ Drag & drop logic
│   │   ├── useGanttZoom.ts     # ✅ Zoom logic
│   │   └── useGanttScroll.ts   # ✅ Scroll sync
│   ├── useGanttState.ts        # ✅ State management
│   ├── useGanttHandlers.ts     # ✅ Event handlers
│   ├── useGanttCalculations.ts # ✅ Calculations
│   ├── useGanttTimeline.ts     # ✅ Timeline logic
│   ├── useDatePosition.ts      # ✅ Date positioning
│   ├── useTaskDateRange.ts     # ✅ Task date range
│   ├── useTaskFilters.ts       # ✅ Task filtering
│   ├── useTaskHierarchy.ts     # ✅ Task hierarchy
│   ├── useTimelineColumns.ts   # ✅ Timeline columns
│   ├── useWorkingDays.ts       # ✅ Working days calc
│   └── index.ts                # ✅ Hooks exports
│
├── lib/                        # ✅ Hàm tiện ích thuần túy (Math, Date)
│   ├── date-utils.ts           # ✅ Xử lý ngày tháng
│   ├── gantt-utils.ts          # ✅ Chuyển đổi Ngày <-> Pixel
│   └── tree-utils.ts           # ✅ Tree utilities
│
├── types/                      # ✅ TypeScript Definitions
│   ├── gantt.types.ts          # ✅ Gantt types
│   ├── task.types.ts           # ✅ Task types
│   └── allocation.types.ts     # ✅ Allocation types
│
├── context/                    # ✅ React Context
│   └── GanttContext.tsx        # ✅ Gantt context
│
├── pages/                      # ✅ Page entry points
│   ├── GanttChart.tsx          # ✅ Wrapper component (MIGRATED)
│   ├── GanttView.tsx           # ✅ Main container (MIGRATED)
│   ├── GanttChart.refactored.tsx # ✅ Refactored version
│   └── index.ts                # ✅ Page exports
│
├── index.ts                    # ✅ Feature main export
├── MIGRATION_COMPLETED.md      # ✅ Migration documentation
├── MIGRATION_QUICK_REFERENCE.md # ✅ Quick reference
├── STRUCTURE_VERIFICATION.md   # ✅ Structure verification
└── Readme01.md                 # 📖 This file
```

📝 Chi tiết chức năng từng file1. 📂 services/ (Tầng Dữ liệu - Data Layer)Nơi duy nhất trong app biết dữ liệu lấy từ đâu (Supabase hay Mock).File/FolderChức nănginterfaces/task.interface.tsQuy định các hàm bắt buộc (VD: getTasks, updateTask).allocation.interface.tsQuy định hàm quản lý nguồn lực (getAllocations, upsertAllocation).supabase/task.service.tsThực thi interface trên bằng Supabase SDK (gọi DB thật).allocation.service.tsThực thi logic gọi DB bảng allocations.settings.service.tsLưu/Lấy cấu hình view từ bảng view_settings.mocks/data/mock-tasks.tsChứa mảng JSON dữ liệu mẫu (Hardcode).task.mock.tsThực thi interface nhưng trả về mảng JSON (giả lập delay mạng).factory.tsQuan trọng: Kiểm tra biến môi trường (ENV) để quyết định export Service Thật hay Mock ra ngoài cho Hooks dùng.2. 📂 store/ (Tầng Trạng thái - State Layer)Quản lý trạng thái Client bằng thư viện Zustand.File/FolderChức năngslices/view-slice.tsLưu zoomLevel (Day/Week), scrollPosition, visibleDateRange.task-slice.tsLưu selectedTaskId, expandedTaskIds (danh sách task đang mở rộng), filterKeyword.ui-slice.tsLưu trạng thái đóng/mở của các Dialog (VD: isCreateTaskOpen).gantt.store.tsGộp tất cả các slices trên thành 1 hook duy nhất: useGanttStore.gantt.selectors.tsCác hàm chọn lọc dữ liệu giúp component không bị render lại thừa thãi.3. 📂 hooks/ (Tầng Logic - Logic Layer)Cầu nối: Component gọi Hook -> Hook gọi Store/Service.File/FolderChức năngqueries/Dùng React Query để Fetch dữ liệu (Read)useTaskQueries.tsChứa useGetTasks. Gọi ganttService.task.getTasks().useAllocationQueries.tsChứa useGetAllocations.mutations/Dùng React Query để thay đổi dữ liệu (Write)useTaskMutations.tsChứa useAddTask, useUpdateTask, useDeleteTask (xử lý Optimistic Update tại đây).useBaselineMutations.tsLogic tạo snapshot và restore baseline.ui/Logic tính toán giao diện phức tạpuseGanttDnd.tsLogic Drag & Drop: Tính toán khi kéo thanh task thì ngày bắt đầu/kết thúc thay đổi ra sao.useGanttZoom.tsLogic Zoom: Tính toán độ rộng cột (columnWidth) khi đổi chế độ xem.useGanttScroll.tsĐồng bộ thanh cuộn giữa Bảng task bên trái và Biểu đồ bên phải.4. 📂 components/ (Tầng Giao diện - UI Layer)File/FolderChức năngbars/TaskBar.tsxThanh task chính. Hiển thị màu sắc, % hoàn thành, label.MilestoneDiamond.tsxHình thoi hiển thị Milestone.DependencyLine.tsxĐường nối mũi tên giữa các task (SVG).columns/TaskListTable.tsxBảng danh sách công việc bên trái.columns-def.tsxĐịnh nghĩa các cột (Tên, Ngày, Người thực hiện).timeline/TimelineHeader.tsxThanh ngày tháng năm phía trên cùng.TimelineGrid.tsxCác ô lưới background (kẻ dọc).ChartArea.tsxVùng chứa chính, nơi render các Bar và Grid.dialogs/TaskDetailDialog.tsxForm chi tiết task (Tab: Thông tin, Resource, Dependency).LabelSettingsDialog.tsxForm quản lý màu sắc nhãn (File bạn gửi đầu tiên).toolbar/ViewModeSelector.tsxDropdown chọn xem theo Ngày / Tuần / Tháng.5. 📂 lib/ & types/ (Core Utils)FileChức năngtypes/task.types.tsInterface Task, TaskLabel, TaskStatus.types/gantt.types.tsType ViewMode ('Day'lib/date-utils.tsCác hàm xử lý ngày: addDays, getWeekNumber, isWeekend.lib/gantt-utils.tsCore logic: Hàm getDateX(date) (đổi ngày ra pixel) và getXDate(pixel) (đổi pixel ra ngày).🚀 Bạn muốn bắt đầu từ đâu?Để xây dựng hệ thống này mà không bị rối, tôi khuyên bạn nên làm theo thứ tự sau. Bạn chọn bước nào tôi sẽ code mẫu bước đó:Bước 1 (Base): Tạo file types và interfaces (Định nghĩa khuôn mẫu).Bước 2 (Data): Viết services/mocks và services/factory (Để chạy được app ngay mà chưa cần DB).Bước 3 (State): Cấu hình store (Zustand).Bước 4 (Logic): Viết hooks/queries.Bước 5 (UI): Dựng khung GanttChart.tsx.

src/features/gantt/
├── components/
│ ├── bars/
│ │ ├── TaskBar.tsx # Thanh hiển thị task (màu, tiến độ)
│ │ ├── MilestoneDiamond.tsx # Biểu tượng hình thoi cho milestone
│ │ └── DependencyLine.tsx # Đường nối mũi tên phụ thuộc (SVG)
│ ├── columns/
│ │ ├── TaskListTable.tsx # Bảng danh sách bên trái
│ │ ├── TaskRow.tsx # Một dòng trong bảng
│ │ └── columns-def.tsx # Cấu hình cột (Tên, Ngày bắt đầu...)
│ ├── dialogs/
│ │ ├── TaskDetailDialog.tsx # Form sửa chi tiết task
│ │ ├── CreateTaskDialog.tsx # Form tạo mới
│ │ └── ViewSettingsDialog.tsx # Cấu hình hiển thị
│ ├── timeline/
│ │ ├── ChartArea.tsx # Khu vực vẽ biểu đồ chính
│ │ ├── TimelineHeader.tsx # Thanh ngày tháng phía trên
│ │ ├── TimelineGrid.tsx # Lưới kẻ dọc background
│ │ └── TimeMarker.tsx # Đường kẻ hiện tại (Today)
│ └── toolbar/
│ ├── GanttToolbar.tsx # Thanh công cụ tổng
│ ├── ViewModeSelector.tsx # Dropdown chọn Day/Week/Month
│ └── ZoomSlider.tsx # Thanh trượt zoom
│
├── services/ # 🟢 CORE: Quản lý Data
│ ├── interfaces/
│ │ ├── task.interface.ts # Contract cho Task
│ │ └── allocation.interface.ts # Contract cho Allocation
│ ├── mocks/
│ │ ├── data/
│ │ │ └── mock-tasks.ts # Data JSON cứng
│ │ ├── task.mock.ts # Service giả
│ │ └── allocation.mock.ts # Service giả
│ ├── supabase/
│ │ ├── task.service.ts # Service thật (gọi DB)
│ │ └── allocation.service.ts # Service thật (gọi DB)
│ └── factory.ts # ⚙️ Switch chuyển đổi Real/Mock
│
├── store/ # 🟢 STATE: Quản lý trạng thái UI
│ ├── gantt.store.ts # Main Store (Zustand)
│ └── gantt.selectors.ts # Hàm lấy dữ liệu (Hooks)
│
├── hooks/ # 🟢 LOGIC: React Hooks
│ ├── queries/
│ │ ├── useTaskQueries.ts # Lấy danh sách task
│ │ └── useAllocationQueries.ts # Lấy danh sách nhân sự
│ ├── mutations/
│ │ ├── useTaskMutations.ts # Thêm/Sửa/Xóa task
│ │ └── useGanttMutations.ts # Các mutation khác
│ └── ui/
│ ├── useGanttDnd.ts # Logic kéo thả
│ └── useGanttZoom.ts # Logic tính toán zoom
│
├── lib/ # 🟢 UTILS: Hàm toán học
│ ├── date-utils.ts # Xử lý ngày tháng
│ └── gantt-utils.ts # Chuyển đổi Ngày <-> Pixel
│
├── types/
│ ├── gantt.types.ts
│ └── task.types.ts
│
└── GanttChart.tsx # Component chính (Entry Point)
