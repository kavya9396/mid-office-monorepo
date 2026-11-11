# Retail — IT Task Screen Specs

> Part of the [Screen Specifications](./README.md).
> Source prototypes: `design-reference/ui-prototypes/Retail/IT Task/`

---

## Overview

IT Task manages internal IT-raised tasks linked to underwriting applications.
These tasks cover data correction requests, system exception handling, and
technical query resolution raised by the IT operations team.

---

## URL & Routing

| Route | Screen |
|---|---|
| `/retail/it-task` | Landing / Inbox |
| `/retail/it-task/login` | Login |
| `/retail/it-task/:taskId` | IT Task Detail Screen |

---

## Screens

### Login
**Prototype:** `login.html`
Standard login. Role guard: `IT_TASK_USER`.

---

### Landing / Inbox
**Prototype:** `landing-prototype.html`

Standard inbox. Task table shows open IT tasks.

#### Data / API
```ts
GET /api/retail/it-task/tasks
Response: { sections: TaskSection[]; tasks: ITTask[]; totalCount: number; }
```

---

### IT Task Detail Screen
**Prototype:** `it-task-prototype.html`

#### Purpose
IT user views the task details, reviews linked application data, and resolves
or escalates the task.

#### Component tree
```
<ITTaskDetailPage taskId={...}>
  <AppHeader showBack onBack={navigate('/retail/it-task')} />
  <main>
    <TaskDetailBanner task={task} />
    <TabNav tabs={['Task Details','Application Data','Resolution History']} />
    <TabPanel tab="Task Details">
      <TaskMetaGrid task={task} />
      <RemarkField label="Resolution Remarks" name="resolutionRemarks" />
    </TabPanel>
    <TabPanel tab="Application Data">
      <ApplicationDataSummary applicationId={task.applicationId} />
    </TabPanel>
    <TabPanel tab="Resolution History">
      <ResolutionHistoryTable entries={task.history} />
    </TabPanel>
    <DecisionFooter
      actions={['Resolve','Escalate','Reject']}
      onDecision={submitResolution}
    />
  </main>
</ITTaskDetailPage>
```

#### Data / API
```ts
GET  /api/retail/it-task/tasks/:taskId
POST /api/retail/it-task/tasks/:taskId/resolution
Body: {
  action: 'RESOLVE' | 'ESCALATE' | 'REJECT';
  remarks: string;
}
```

---

## Shared Rules (IT Task)

- Routes require `businessLine === 'RETAIL'` and role `IT_TASK_USER`.
- Reuse shared `AppHeader`, `Sidebar`, `DecisionFooter`.
- IT Task does not show `ApplicantBanner` — use `TaskDetailBanner` instead,
  which shows task metadata (task ID, type, priority, raised date) rather than applicant PII.
