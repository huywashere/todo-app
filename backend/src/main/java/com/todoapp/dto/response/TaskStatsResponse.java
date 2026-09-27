package com.todoapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatsResponse {
    private long total;
    private long completed;
    private long inProgress;
    private long todo;
    private long todayCount;
    private long tomorrowCount;
    private long next7DaysCount;
    private long inboxCount;
}
