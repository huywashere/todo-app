package com.todoapp.config;

import com.todoapp.entity.*;
import com.todoapp.repository.ListRepository;
import com.todoapp.repository.TaskRepository;
import com.todoapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final ListRepository listRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (listRepository.count() > 0) {
            return;
        }

        log.info("Khởi tạo dữ liệu mẫu cho Todo Spring Boot Backend...");

        String demoUserId = "user-demo";
        if (!userRepository.existsById(demoUserId)) {
            userRepository.save(UserEntity.builder()
                    .id(demoUserId)
                    .email("demo@todo.local")
                    .displayName("Demo User")
                    .passwordHash(passwordEncoder.encode("TodoDemo!2026"))
                    .role("USER")
                    .enabled(true)
                    .build());
        }

        // 1. Seed custom lists
        List<ListEntity> initialLists = Arrays.asList(
                ListEntity.builder().id("september-plan").ownerId(demoUserId).name("September Plan").emoji("🚀").color("#3B82F6").hasDot(true).build(),
                ListEntity.builder().id("work-hard").ownerId(demoUserId).name("Work Hard").emoji("💼").color("#F59E0B").hasDot(false).build(),
                ListEntity.builder().id("life-memo").ownerId(demoUserId).name("Life Memo").emoji("🏡").color("#10B981").hasDot(true).build(),
                ListEntity.builder().id("life").ownerId(demoUserId).name("Life").emoji("💖").color("#EC4899").hasDot(false).build(),
                ListEntity.builder().id("workout-plan").ownerId(demoUserId).name("Workout Plan").emoji("🏃").color("#8B5CF6").hasDot(false).build(),
                ListEntity.builder().id("wishlist").ownerId(demoUserId).name("Wishlist").emoji("✨").color("#F97316").hasDot(false).build()
        );
        listRepository.saveAll(initialLists);

        // 2. Seed tasks
        String todayStr = LocalDate.now().toString();
        String tomorrowStr = LocalDate.now().plusDays(1).toString();
        String next3DaysStr = LocalDate.now().plusDays(3).toString();

        TaskEntity task1 = TaskEntity.builder()
                .id("task-1")
                .ownerId(demoUserId)
                .title("Morning Run")
                .description("Chạy bộ 5km quanh công viên và giãn cơ")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.LOW)
                .listId("inbox")
                .time("07:00")
                .dueDate(todayStr)
                .dateLabel("Today")
                .tags(new ArrayList<>(List.of("Fitness")))
                .sortOrder(0)
                .subtasks(new ArrayList<>())
                .build();
        task1.addSubTask(SubTaskEntity.builder().id("st-1").title("Khởi động 5 phút").completed(true).build());
        task1.addSubTask(SubTaskEntity.builder().id("st-2").title("Chạy 5km đều nhịp").completed(false).build());

        TaskEntity task2 = TaskEntity.builder()
                .id("task-2")
                .ownerId(demoUserId)
                .title("Go Grocery Shopping")
                .description("Prepare Shopping Bags in Advance")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .listId("inbox")
                .time("09:00")
                .dueDate(todayStr)
                .dateLabel("Today, Sep 6, 09:00 - 10:00 AM")
                .tags(new ArrayList<>(Arrays.asList("Home", "Personal")))
                .sortOrder(1)
                .subtasks(new ArrayList<>())
                .build();
        task2.addSubTask(SubTaskEntity.builder().id("st-3").title("Eggs").completed(false).build());
        task2.addSubTask(SubTaskEntity.builder().id("st-4").title("Milk").completed(false).build());
        task2.addSubTask(SubTaskEntity.builder().id("st-5").title("Bread").completed(false).build());
        task2.addSubTask(SubTaskEntity.builder().id("st-6").title("Paper Towels").completed(false).build());
        task2.addSubTask(SubTaskEntity.builder().id("st-7").title("Body Wash").completed(false).build());

        TaskEntity task3 = TaskEntity.builder()
                .id("task-3")
                .ownerId(demoUserId)
                .title("Reply to Emails")
                .description("Xử lý hộp thư đến chăm sóc khách hàng")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .listId("inbox")
                .time("12:00")
                .dueDate(todayStr)
                .dateLabel("Today")
                .tags(new ArrayList<>(List.of("Work")))
                .sortOrder(2)
                .subtasks(new ArrayList<>())
                .build();

        TaskEntity task4 = TaskEntity.builder()
                .id("task-4")
                .ownerId(demoUserId)
                .title("Discuss Plan with Client")
                .description("Họp trực tuyến trao đổi lộ trình bàn giao quý 4")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .listId("inbox")
                .time("13:00")
                .dueDate(todayStr)
                .dateLabel("Today")
                .tags(new ArrayList<>(Arrays.asList("Meeting", "Client")))
                .sortOrder(3)
                .subtasks(new ArrayList<>())
                .build();

        TaskEntity task5 = TaskEntity.builder()
                .id("task-5")
                .ownerId(demoUserId)
                .title("Shoot Video")
                .description("Quay video hướng dẫn kiến trúc chuẩn")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .listId("inbox")
                .time("08:00")
                .dueDate(tomorrowStr)
                .dateLabel("Tomorrow")
                .tags(new ArrayList<>(List.of("Content")))
                .sortOrder(4)
                .subtasks(new ArrayList<>())
                .build();

        TaskEntity task6 = TaskEntity.builder()
                .id("task-6")
                .ownerId(demoUserId)
                .title("Host Project Meeting")
                .description("Họp đánh giá tiến độ sprint với tech leads")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .listId("inbox")
                .time("14:00")
                .dueDate(tomorrowStr)
                .dateLabel("Tomorrow")
                .tags(new ArrayList<>(List.of("Meeting")))
                .sortOrder(5)
                .subtasks(new ArrayList<>())
                .build();

        TaskEntity task7 = TaskEntity.builder()
                .id("task-7")
                .ownerId(demoUserId)
                .title("Finalize Promo Video")
                .description("Xuất file video độ phân giải cao")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .listId("inbox")
                .time("17:30")
                .dueDate(tomorrowStr)
                .dateLabel("Tomorrow")
                .tags(new ArrayList<>(List.of("Content")))
                .sortOrder(6)
                .subtasks(new ArrayList<>())
                .build();

        TaskEntity task8 = TaskEntity.builder()
                .id("task-8")
                .ownerId(demoUserId)
                .title("Pick Up Package")
                .description("Lấy bưu kiện tại bưu điện trung tâm")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.LOW)
                .listId("inbox")
                .time("Mon")
                .dueDate(next3DaysStr)
                .dateLabel("Next 7 Days")
                .tags(new ArrayList<>(List.of("Errands")))
                .sortOrder(7)
                .subtasks(new ArrayList<>())
                .build();

        TaskEntity task9 = TaskEntity.builder()
                .id("task-9")
                .ownerId(demoUserId)
                .title("Organize Project Meeting")
                .description("Đồng bộ kế hoạch với đội ngũ thiết kế")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .listId("inbox")
                .time("Mon")
                .dueDate(next3DaysStr)
                .dateLabel("Next 7 Days")
                .tags(new ArrayList<>(List.of("Meeting")))
                .sortOrder(8)
                .subtasks(new ArrayList<>())
                .build();

        TaskEntity task10 = TaskEntity.builder()
                .id("task-10")
                .ownerId(demoUserId)
                .title("Complete Client Proposal")
                .description("Hoàn tất và gửi hồ sơ chào thầu")
                .status(TaskStatus.TODO)
                .priority(TaskPriority.HIGH)
                .listId("inbox")
                .time("Mon")
                .dueDate(next3DaysStr)
                .dateLabel("Next 7 Days")
                .tags(new ArrayList<>(List.of("Work")))
                .sortOrder(9)
                .subtasks(new ArrayList<>())
                .build();

        List<TaskEntity> demoTasks = Arrays.asList(task1, task2, task3, task4, task5, task6, task7, task8, task9, task10);
        demoTasks.forEach(task -> task.setAssigneeEmail("demo@todo.local"));
        taskRepository.saveAll(demoTasks);
        log.info("Dữ liệu mẫu đã được khởi tạo thành công với {} công việc!", taskRepository.count());
    }
}
