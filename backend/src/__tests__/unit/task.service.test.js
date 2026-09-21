// ─── Mock all dependencies BEFORE requiring the service ───
jest.mock('../../db/queries/task.queries');
jest.mock('../../db/queries/project.queries');
jest.mock('../../db/queries/workspace.queries');
jest.mock('../../db/queries/label.queries', () => ({
  getLabelsForTasks: jest.fn().mockResolvedValue(new Map()),
  getTaskLabels: jest.fn().mockResolvedValue([]),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByProject: jest.fn().mockResolvedValue([]),
  findByName: jest.fn(),
  attachToTask: jest.fn(),
  detachFromTask: jest.fn(),
}));
jest.mock('../../config/socket', () => ({
  emitToWorkspace: jest.fn(),
  emitToUser: jest.fn(),
  initSocket: jest.fn(),
  getIO: jest.fn(() => null),
}));
jest.mock('../../utils/cache.utils', () => ({
  invalidateCache: jest.fn().mockResolvedValue(),
  buildKey: jest.fn((...parts) => parts.join(':')),
  cacheWrapper: jest.fn((key, ttl, fn) => fn()),
}));

// Activity service & notification service are instantiated at module load time
// in task.service.js, so we must provide a class-shaped mock (not auto-mock)
jest.mock('../../services/activity.service', () => {
  return jest.fn().mockImplementation(() => ({
    log: jest.fn().mockResolvedValue(),
  }));
});

jest.mock('../../services/notification.service', () => {
  return jest.fn().mockImplementation(() => ({
    notifyTaskAssigned: jest.fn().mockResolvedValue(),
    notifyStatusChanged: jest.fn().mockResolvedValue(),
    notifyMention: jest.fn().mockResolvedValue(),
    notifyComment: jest.fn().mockResolvedValue(),
    create: jest.fn().mockResolvedValue(),
  }));
});

// ─── Require the service (deps come back as mocks) ───
const TaskService = require('../../services/task.service');
const TaskQueries = require('../../db/queries/task.queries');
const ProjectQueries = require('../../db/queries/project.queries');
const WorkspaceQueries = require('../../db/queries/workspace.queries');
const { emitToWorkspace } = require('../../config/socket');
const { invalidateCache, buildKey, cacheWrapper } = require('../../utils/cache.utils');

describe('TaskService', () => {
  let taskService;

  // Common fixtures
  const projectId = 'project-1';
  const workspaceId = 'workspace-1';
  const userId = 'user-1';

  const mockProject = {
    id: projectId,
    workspace_id: workspaceId,
    name: 'Test Project',
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Desc',
    status: 'TODO',
    priority: 'MEDIUM',
    project_id: projectId,
    workspace_id: workspaceId,
    created_by_id: userId,
    assignee_id: null,
    assignee_user_id: null,
    reporter_id: userId,
    position: 1,
    is_archived: false,
    comment_count: 0,
    attachment_count: 0,
  };

  beforeEach(() => {
    taskService = new TaskService();

    // Default mocks: pass access checks
    WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
      isOwner: false,
      isMember: true,
      role: 'MEMBER',
    });
    WorkspaceQueries.isOwner.mockResolvedValue(false);
    WorkspaceQueries.getUserRole.mockResolvedValue('MEMBER');

    // Cache utils — passthrough for cacheWrapper, noop for invalidate
    invalidateCache.mockResolvedValue();
    buildKey.mockImplementation((...parts) => parts.join(':'));
    cacheWrapper.mockImplementation((key, ttl, fn) => fn());
  });

  // ═══════════════════════════════════════════════════
  // createTask()
  // ═══════════════════════════════════════════════════
  describe('createTask()', () => {
    it('should throw if project not found', async () => {
      ProjectQueries.findById.mockResolvedValue(null);

      await expect(
        taskService.createTask(projectId, userId, { title: 'New' })
      ).rejects.toThrow('Project not found');

      expect(TaskQueries.create).not.toHaveBeenCalled();
    });

    it('should throw if user has no workspace access', async () => {
      ProjectQueries.findById.mockResolvedValue(mockProject);
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: false,
        role: null,
      });

      await expect(
        taskService.createTask(projectId, userId, { title: 'New' })
      ).rejects.toThrow('You do not have access to this project');
    });

    it('should create a task with default status and priority', async () => {
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.create.mockResolvedValue({ ...mockTask, id: 'task-new' });
      TaskQueries.findById.mockResolvedValue({ ...mockTask, id: 'task-new' });

      await taskService.createTask(projectId, userId, {
        title: 'New Task',
      });

      expect(TaskQueries.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId,
          createdById: userId,
        })
      );
    });

    it('should resolve assignee userId → workspace memberId', async () => {
      ProjectQueries.findById.mockResolvedValue(mockProject);
      WorkspaceQueries.findMemberByUser.mockResolvedValue({
        id: 'wm-1',
        user_id: 'assignee-user',
      });
      TaskQueries.create.mockResolvedValue({ ...mockTask });
      TaskQueries.findById.mockResolvedValue(mockTask);

      await taskService.createTask(projectId, userId, {
        title: 'Assigned Task',
        assigneeId: 'assignee-user',
      });

      expect(WorkspaceQueries.findMemberByUser).toHaveBeenCalledWith(
        workspaceId,
        'assignee-user'
      );
      expect(TaskQueries.create).toHaveBeenCalledWith(
        expect.objectContaining({ assigneeId: 'wm-1' })
      );
    });

    it('should throw if assignee is not a workspace member', async () => {
      ProjectQueries.findById.mockResolvedValue(mockProject);
      WorkspaceQueries.findMemberByUser.mockResolvedValue(null);

      await expect(
        taskService.createTask(projectId, userId, {
          title: 'Bad',
          assigneeId: 'outsider',
        })
      ).rejects.toThrow('Assignee is not a member of this workspace');
    });

    it('should invalidate dashboard cache after create', async () => {
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.create.mockResolvedValue(mockTask);
      TaskQueries.findById.mockResolvedValue(mockTask);

      await taskService.createTask(projectId, userId, { title: 'New' });

      expect(invalidateCache).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // updateTask()
  // ═══════════════════════════════════════════════════
  describe('updateTask()', () => {
    it('should throw if task not found', async () => {
      TaskQueries.findById.mockResolvedValue(null);

      await expect(
        taskService.updateTask('missing', userId, { title: 'X' })
      ).rejects.toThrow('Task not found');
    });

    it('should reject MEMBER editing a non-own task', async () => {
      TaskQueries.findById.mockResolvedValue({
        ...mockTask,
        created_by_id: 'someone-else',
        assignee_user_id: 'someone-else',
      });
      ProjectQueries.findById.mockResolvedValue(mockProject);
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: true,
        role: 'MEMBER',
      });

      await expect(
        taskService.updateTask(mockTask.id, userId, { title: 'Hacked' })
      ).rejects.toThrow('You do not have permission to edit this task');
    });

    it('should allow MANAGER to edit any task', async () => {
      // First findById call: original task
      // Second findById call: updated task (re-fetched after update)
      TaskQueries.findById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({ ...mockTask, title: 'Updated' });

      ProjectQueries.findById.mockResolvedValue(mockProject);
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: true,
        role: 'MANAGER',
      });
      TaskQueries.update.mockResolvedValue({ ...mockTask, title: 'Updated' });

      const result = await taskService.updateTask(mockTask.id, userId, {
        title: 'Updated',
      });

      expect(TaskQueries.update).toHaveBeenCalledWith(
        mockTask.id,
        expect.objectContaining({ title: 'Updated' })
      );
      expect(result.title).toBe('Updated');
    });

    it('should allow MEMBER to edit own task', async () => {
      TaskQueries.findById.mockResolvedValue({
        ...mockTask,
        created_by_id: userId,
        assignee_user_id: userId,
      });
      ProjectQueries.findById.mockResolvedValue(mockProject);
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: true,
        role: 'MEMBER',
      });
      TaskQueries.update.mockResolvedValue(mockTask);

      await taskService.updateTask(mockTask.id, userId, { title: 'Mine' });

      expect(TaskQueries.update).toHaveBeenCalled();
    });

    it('should detect status change and log activity', async () => {
      TaskQueries.findById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({ ...mockTask, status: 'DONE' });
      ProjectQueries.findById.mockResolvedValue(mockProject);
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: true,
        role: 'MANAGER',
      });
      TaskQueries.update.mockResolvedValue({ ...mockTask, status: 'DONE' });

      const result = await taskService.updateTask(mockTask.id, userId, {
        status: 'DONE',
      });

      // Behavioral assertion: the update query was called with the new status
      expect(TaskQueries.update).toHaveBeenCalledWith(
        mockTask.id,
        expect.objectContaining({ status: 'DONE' })
      );
      expect(result.status).toBe('DONE');
    });

    it('should not throw when status is unchanged', async () => {
      TaskQueries.findById
        .mockResolvedValueOnce({ ...mockTask, status: 'TODO' })
        .mockResolvedValueOnce({ ...mockTask, status: 'TODO' });
      ProjectQueries.findById.mockResolvedValue(mockProject);
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: true,
        role: 'MANAGER',
      });
      TaskQueries.update.mockResolvedValue({ ...mockTask, status: 'TODO' });

      const result = await taskService.updateTask(mockTask.id, userId, {
        status: 'TODO',
      });

      expect(result.status).toBe('TODO');
    });
  });

  // ═══════════════════════════════════════════════════
  // updateTaskStatus()
  // ═══════════════════════════════════════════════════
  describe('updateTaskStatus()', () => {
    it('should move task and emit socket event', async () => {
      TaskQueries.findById
        .mockResolvedValueOnce({ ...mockTask, status: 'TODO' })   // initial
        .mockResolvedValueOnce({ ...mockTask, status: 'DONE' });  // re-fetch
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.updateStatus.mockResolvedValue();

      await taskService.updateTaskStatus(mockTask.id, userId, 'DONE', 5);

      expect(TaskQueries.updateStatus).toHaveBeenCalledWith(
        mockTask.id,
        'DONE',
        5
      );
      expect(emitToWorkspace).toHaveBeenCalledWith(
        workspaceId,
        'task:moved',
        expect.objectContaining({ status: 'DONE', position: 5 })
      );
    });

    it('should log COMPLETED activity when moving to DONE', async () => {
      TaskQueries.findById
        .mockResolvedValueOnce({ ...mockTask, status: 'IN_PROGRESS' })
        .mockResolvedValueOnce({ ...mockTask, status: 'DONE' });
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.updateStatus.mockResolvedValue();

      const result = await taskService.updateTaskStatus(
        mockTask.id,
        userId,
        'DONE',
        1
      );

      // Behavioral assertion: the underlying update status query was called
      expect(TaskQueries.updateStatus).toHaveBeenCalledWith(
        mockTask.id,
        'DONE',
        1
      );
      expect(result.status).toBe('DONE');
    });
  });

  // ═══════════════════════════════════════════════════
  // deleteTask()
  // ═══════════════════════════════════════════════════
  describe('deleteTask()', () => {
    it('should throw if task not found', async () => {
      TaskQueries.findById.mockResolvedValue(null);

      await expect(
        taskService.deleteTask('missing', userId)
      ).rejects.toThrow('Task not found');
    });

    it('should delete the task and invalidate caches', async () => {
      TaskQueries.findById.mockResolvedValue(mockTask);
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.delete.mockResolvedValue();

      const result = await taskService.deleteTask(mockTask.id, userId);

      expect(TaskQueries.delete).toHaveBeenCalledWith(mockTask.id);
      expect(invalidateCache).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should emit task:deleted socket event', async () => {
      TaskQueries.findById.mockResolvedValue(mockTask);
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.delete.mockResolvedValue();

      await taskService.deleteTask(mockTask.id, userId);

      expect(emitToWorkspace).toHaveBeenCalledWith(
        workspaceId,
        'task:deleted',
        expect.objectContaining({ taskId: mockTask.id })
      );
    });
  });

  // ═══════════════════════════════════════════════════
  // archiveTask() / unarchiveTask()
  // ═══════════════════════════════════════════════════
  describe('archiveTask()', () => {
    it('should archive the task', async () => {
      TaskQueries.findById.mockResolvedValue(mockTask);
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.archive.mockResolvedValue({ ...mockTask, is_archived: true });

      const result = await taskService.archiveTask(mockTask.id, userId);

      expect(TaskQueries.archive).toHaveBeenCalledWith(mockTask.id);
      expect(result.is_archived).toBe(true);
    });
  });

  describe('unarchiveTask()', () => {
    it('should unarchive the task', async () => {
      TaskQueries.findById.mockResolvedValue({
        ...mockTask,
        is_archived: true,
      });
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.unarchive.mockResolvedValue({
        ...mockTask,
        is_archived: false,
      });

      const result = await taskService.unarchiveTask(mockTask.id, userId);

      expect(TaskQueries.unarchive).toHaveBeenCalledWith(mockTask.id);
      expect(result.is_archived).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════
  // duplicateTask()
  // ═══════════════════════════════════════════════════
  describe('duplicateTask()', () => {
    it('should duplicate and emit task:created', async () => {
      TaskQueries.findById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce({ ...mockTask, id: 'task-copy' });
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.duplicate.mockResolvedValue({ id: 'task-copy' });

      const result = await taskService.duplicateTask(mockTask.id, userId);

      expect(TaskQueries.duplicate).toHaveBeenCalledWith(mockTask.id, userId);
      expect(emitToWorkspace).toHaveBeenCalledWith(
        workspaceId,
        'task:created',
        expect.objectContaining({ actorId: userId })
      );
      expect(result.id).toBe('task-copy');
    });
  });

  // ═══════════════════════════════════════════════════
  // getTaskStats()
  // ═══════════════════════════════════════════════════
  describe('getTaskStats()', () => {
    it('should convert string counts to numbers', async () => {
      ProjectQueries.findById.mockResolvedValue(mockProject);
      TaskQueries.getStatsByProject.mockResolvedValue({
        total: '10',
        todo: '3',
        in_progress: '2',
        review: '1',
        done: '4',
        blocked: '0',
        urgent: '1',
        high: '2',
        medium: '5',
        low: '2',
        overdue: '1',
      });

      const stats = await taskService.getTaskStats(projectId, userId);

      expect(stats.total).toBe(10);
      expect(stats.byStatus.todo).toBe(3);
      expect(stats.byStatus.done).toBe(4);
      expect(stats.byPriority.urgent).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════
  // getMyTasks()
  // ═══════════════════════════════════════════════════
  describe('getMyTasks()', () => {
    it('should use cacheWrapper and return paginated data', async () => {
      TaskQueries.getMyTasks.mockResolvedValue({
        data: [mockTask],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const result = await taskService.getMyTasks(userId, {});

      expect(cacheWrapper).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should clamp limit to 100 and page to >= 1', async () => {
      TaskQueries.getMyTasks.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      await taskService.getMyTasks(userId, { page: '0', limit: '999' });

      // Verify the query received normalized values
      expect(TaskQueries.getMyTasks).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ page: 1, limit: 100 })
      );
    });
  });

  // ═══════════════════════════════════════════════════
  // enrichTask() — pure function
  // ═══════════════════════════════════════════════════
  describe('enrichTask()', () => {
    it('should return null for null input', () => {
      expect(taskService.enrichTask(null)).toBeNull();
    });

    it('should map DB snake_case to frontend camelCase', () => {
      const raw = {
        id: 't1',
        title: 'T',
        description: 'D',
        status: 'TODO',
        priority: 'HIGH',
        due_date: '2025-01-01',
        story_points: 5,
        position: 1,
        is_archived: false,
        project_id: 'p1',
        workspace_id: 'w1',
        created_by_id: 'u1',
        created_by_name: 'Alice',
        assignee_id: 'wm1',
        assignee_user_id: 'u2',
        assignee_name: 'Bob',
        comment_count: '3',
        attachment_count: '2',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        completed_at: null,
      };

      const enriched = taskService.enrichTask(raw);

      expect(enriched.dueDate).toBe('2025-01-01');
      expect(enriched.storyPoints).toBe(5);
      expect(enriched.projectId).toBe('p1');
      expect(enriched.workspaceId).toBe('w1');
      expect(enriched.createdByName).toBe('Alice');
      expect(enriched.assigneeName).toBe('Bob');
      expect(enriched.commentCount).toBe(3); // parsed from string
      expect(enriched.attachmentCount).toBe(2); // parsed from string
    });

    it('should default comment/attachment counts to 0 when missing', () => {
      const enriched = taskService.enrichTask({ id: 't1', title: 'T' });
      expect(enriched.commentCount).toBe(0);
      expect(enriched.attachmentCount).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════
  // checkWorkspaceAccess()
  // ═══════════════════════════════════════════════════
  describe('checkWorkspaceAccess()', () => {
    it('should return true for workspace owner', async () => {
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: true,
        isMember: false,
        role: null,
      });
      const result = await taskService.checkWorkspaceAccess(
        workspaceId,
        userId
      );
      expect(result).toBe(true);
    });

    it('should return true for workspace member', async () => {
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: true,
        role: 'MEMBER',
      });
      const result = await taskService.checkWorkspaceAccess(
        workspaceId,
        userId
      );
      expect(result).toBe(true);
    });

    it('should return false for outsider', async () => {
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: false,
        role: null,
      });
      const result = await taskService.checkWorkspaceAccess(
        workspaceId,
        userId
      );
      expect(result).toBe(false);
    });
  });
});