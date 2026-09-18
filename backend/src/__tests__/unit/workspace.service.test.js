// ─── Mock deps before requiring service ───
jest.mock('../../db/queries/workspace.queries');
jest.mock('../../db/queries/user.queries');
jest.mock('../../db/queries/invitation.queries');
jest.mock('../../utils/token.utils');
jest.mock('../../services/email.service');
jest.mock('../../services/notification.service');
jest.mock('../../utils/cache.utils');
jest.mock('../../jobs/email.producer');

const WorkspaceService = require('../../services/workspace.service');
const WorkspaceQueries = require('../../db/queries/workspace.queries');
const UserQueries = require('../../db/queries/user.queries');
const InvitationQueries = require('../../db/queries/invitation.queries');
const { createWorkspaceInvitationToken } = require('../../utils/token.utils');
const EmailProducer = require('../../jobs/email.producer');
const { cacheWrapper, invalidateCache, buildKey } = require('../../utils/cache.utils');

describe('WorkspaceService', () => {
  let workspaceService;

  const userId = 'user-1';
  const workspaceId = 'ws-1';

  beforeEach(() => {
    workspaceService = new WorkspaceService();

    // Default cache mocks
    invalidateCache.mockResolvedValue();
    buildKey.mockImplementation((...parts) => parts.join(':'));
    cacheWrapper.mockImplementation((key, ttl, fn) => fn());
  });

  // ═══════════════════════════════════════════════════
  // createWorkspace()
  // ═══════════════════════════════════════════════════
  describe('createWorkspace()', () => {
    it('should throw if slug already exists', async () => {
      WorkspaceQueries.findBySlug.mockResolvedValue({ id: 'existing' });

      await expect(
        workspaceService.createWorkspace(userId, { name: 'Duplicate' })
      ).rejects.toThrow('A workspace with this name already exists');

      expect(WorkspaceQueries.create).not.toHaveBeenCalled();
    });

    it('should create workspace and add owner as member', async () => {
      WorkspaceQueries.findBySlug.mockResolvedValue(null);
      WorkspaceQueries.create.mockResolvedValue({
        id: workspaceId,
        name: 'My Workspace',
        slug: 'my-workspace',
      });
      WorkspaceQueries.addMember.mockResolvedValue();

      const result = await workspaceService.createWorkspace(userId, {
        name: 'My Workspace',
        description: 'Test',
      });

      expect(WorkspaceQueries.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Workspace',
          slug: 'my-workspace',
          ownerId: userId,
        })
      );
      expect(WorkspaceQueries.addMember).toHaveBeenCalledWith(
        workspaceId,
        userId,
        'OWNER',
        userId
      );
      expect(result.id).toBe(workspaceId);
    });

    it('should invalidate user workspace cache after create', async () => {
      WorkspaceQueries.findBySlug.mockResolvedValue(null);
      WorkspaceQueries.create.mockResolvedValue({ id: workspaceId });
      WorkspaceQueries.addMember.mockResolvedValue();

      await workspaceService.createWorkspace(userId, { name: 'New' });

      expect(invalidateCache).toHaveBeenCalled();
    });

    it('should generate a slug from the name', () => {
      // Pure function — no mocking needed
      const slug = workspaceService.generateSlug('Hello World! 2024');
      expect(slug).toBe('hello-world-2024');
    });
  });

  // ═══════════════════════════════════════════════════
  // getUserWorkspaces()
  // ═══════════════════════════════════════════════════
  describe('getUserWorkspaces()', () => {
    it('should normalize member_count to a number', async () => {
      WorkspaceQueries.findByUser.mockResolvedValue([
        { id: 'w1', name: 'A', member_count: '5' },
        { id: 'w2', name: 'B', member_count: null },
      ]);

      const result = await workspaceService.getUserWorkspaces(userId);

      expect(result[0].member_count).toBe(5);   // parsed from string
      expect(result[1].member_count).toBe(0);   // null → 0
    });

    it('should use cacheWrapper with 120s TTL', async () => {
      WorkspaceQueries.findByUser.mockResolvedValue([]);

      await workspaceService.getUserWorkspaces(userId);

      expect(cacheWrapper).toHaveBeenCalledWith(
        expect.stringContaining('workspaces'),
        120,
        expect.any(Function)
      );
    });
  });

  // ═══════════════════════════════════════════════════
  // getWorkspace()
  // ═══════════════════════════════════════════════════
  describe('getWorkspace()', () => {
    it('should throw if workspace not found', async () => {
      WorkspaceQueries.findById.mockResolvedValue(null);

      await expect(
        workspaceService.getWorkspace('missing', userId)
      ).rejects.toThrow('Workspace not found');
    });

    it('should throw if user is not a member', async () => {
      WorkspaceQueries.findById.mockResolvedValue({ id: workspaceId, name: 'W' });
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: false,
        role: null,
      });

      await expect(
        workspaceService.getWorkspace(workspaceId, userId)
      ).rejects.toThrow('You do not have access to this workspace');
    });

    it('should return workspace with userRole=OWNER for owner', async () => {
      WorkspaceQueries.findById.mockResolvedValue({ id: workspaceId, name: 'W' });
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: true,
        isMember: true,
        role: null,
      });

      const result = await workspaceService.getWorkspace(workspaceId, userId);
      expect(result.userRole).toBe('OWNER');
    });

    it('should return workspace with member role for member', async () => {
      WorkspaceQueries.findById.mockResolvedValue({ id: workspaceId, name: 'W' });
      WorkspaceQueries.getWorkspaceAccess.mockResolvedValue({
        isOwner: false,
        isMember: true,
        role: 'MANAGER',
      });

      const result = await workspaceService.getWorkspace(workspaceId, userId);
      expect(result.userRole).toBe('MANAGER');
    });
  });

  // ═══════════════════════════════════════════════════
  // updateWorkspace()
  // ═══════════════════════════════════════════════════
  describe('updateWorkspace()', () => {
    it('should throw if not owner', async () => {
      WorkspaceQueries.isOwner.mockResolvedValue(false);

      await expect(
        workspaceService.updateWorkspace(workspaceId, userId, { name: 'X' })
      ).rejects.toThrow('Only workspace owner can update workspace');
    });

    it('should update and invalidate caches for owner', async () => {
      WorkspaceQueries.isOwner.mockResolvedValue(true);
      WorkspaceQueries.update.mockResolvedValue({
        id: workspaceId,
        name: 'Renamed',
      });

      const result = await workspaceService.updateWorkspace(workspaceId, userId, {
        name: 'Renamed',
      });

      expect(result.name).toBe('Renamed');
      expect(invalidateCache).toHaveBeenCalled();
    });

    it('should throw if update returns null (workspace not found)', async () => {
      WorkspaceQueries.isOwner.mockResolvedValue(true);
      WorkspaceQueries.update.mockResolvedValue(null);

      await expect(
        workspaceService.updateWorkspace(workspaceId, userId, { name: 'X' })
      ).rejects.toThrow('Workspace not found');
    });
  });

  // ═══════════════════════════════════════════════════
  // deleteWorkspace()
  // ═══════════════════════════════════════════════════
  describe('deleteWorkspace()', () => {
    it('should throw if not owner', async () => {
      WorkspaceQueries.isOwner.mockResolvedValue(false);

      await expect(
        workspaceService.deleteWorkspace(workspaceId, userId)
      ).rejects.toThrow('Only workspace owner can delete workspace');
    });

    it('should delete and invalidate all related caches', async () => {
      WorkspaceQueries.isOwner.mockResolvedValue(true);
      WorkspaceQueries.delete.mockResolvedValue({ id: workspaceId });

      const result = await workspaceService.deleteWorkspace(workspaceId, userId);

      expect(result).toBe(true);
      expect(invalidateCache).toHaveBeenCalled();
      // Multiple keys should be invalidated — count the arguments
      const args = invalidateCache.mock.calls[0];
      expect(args.length).toBeGreaterThan(3);
    });
  });

  // ═══════════════════════════════════════════════════
  // addMember()
  // ═══════════════════════════════════════════════════
  describe('addMember()', () => {
    beforeEach(() => {
      // Default: user is admin
      WorkspaceQueries.getUserRole.mockResolvedValue('ADMIN');
      WorkspaceQueries.isOwner.mockResolvedValue(false);
      WorkspaceQueries.findById.mockResolvedValue({
        id: workspaceId,
        name: 'Test Workspace',
      });
    });

    it('should throw if caller is not OWNER or ADMIN', async () => {
      WorkspaceQueries.getUserRole.mockResolvedValue('MEMBER');

      await expect(
        workspaceService.addMember(workspaceId, userId, 'x@test.com', 'MEMBER')
      ).rejects.toThrow('Only workspace owner or admin can add members');
    });

    it('should throw for invalid role', async () => {
      await expect(
        workspaceService.addMember(workspaceId, userId, 'x@test.com', 'SUPERHERO')
      ).rejects.toThrow('Invalid role');
    });

    it('should throw if workspace not found', async () => {
      WorkspaceQueries.findById.mockResolvedValue(null);

      await expect(
        workspaceService.addMember(workspaceId, userId, 'x@test.com', 'MEMBER')
      ).rejects.toThrow('Workspace not found');
    });

    it('should add existing user directly', async () => {
      UserQueries.findByEmail.mockResolvedValue({
        id: 'new-user',
        name: 'New',
        email: 'new@test.com',
        profile_picture: null,
      });
      WorkspaceQueries.isMember.mockResolvedValue(false);
      WorkspaceQueries.addMember.mockResolvedValue({
        id: 'wm-1',
        user_id: 'new-user',
        role: 'MEMBER',
      });

      const result = await workspaceService.addMember(
        workspaceId,
        userId,
        'new@test.com',
        'MEMBER'
      );

      expect(result.type).toBe('added');
      expect(result.member.user.email).toBe('new@test.com');
      expect(WorkspaceQueries.addMember).toHaveBeenCalled();
    });

    it('should throw if existing user is already a member', async () => {
      UserQueries.findByEmail.mockResolvedValue({ id: 'existing' });
      WorkspaceQueries.isMember.mockResolvedValue(true);

      await expect(
        workspaceService.addMember(workspaceId, userId, 'x@test.com', 'MEMBER')
      ).rejects.toThrow('User is already a member of this workspace');
    });

    it('should throw if invitation already pending', async () => {
      UserQueries.findByEmail.mockResolvedValue(null);
      InvitationQueries.findByEmail.mockResolvedValue({ id: 'inv-1' });

      await expect(
        workspaceService.addMember(workspaceId, userId, 'x@test.com', 'MEMBER')
      ).rejects.toThrow('An invitation is already pending for this email');
    });

    it('should queue invitation email for non-existing user', async () => {
      UserQueries.findByEmail.mockResolvedValue(null);
      InvitationQueries.findByEmail.mockResolvedValue(null);
      UserQueries.findById.mockResolvedValue({ id: userId, name: 'Inviter' });
      createWorkspaceInvitationToken.mockResolvedValue({
        token: 'inv-token-123',
        invitation: {
          id: 'inv-1',
          email: 'new@test.com',
          role: 'MEMBER',
          expires_at: new Date(),
        },
      });
      EmailProducer.queueWorkspaceInvitation.mockResolvedValue();

      const result = await workspaceService.addMember(
        workspaceId,
        userId,
        'new@test.com',
        'MEMBER'
      );

      expect(result.type).toBe('invited');
      expect(EmailProducer.queueWorkspaceInvitation).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'new@test.com',
          inviterName: 'Inviter',
          workspaceName: 'Test Workspace',
        })
      );
    });

    it('should still succeed if invitation email queueing fails', async () => {
      UserQueries.findByEmail.mockResolvedValue(null);
      InvitationQueries.findByEmail.mockResolvedValue(null);
      UserQueries.findById.mockResolvedValue({ id: userId, name: 'Inviter' });
      createWorkspaceInvitationToken.mockResolvedValue({
        token: 'tok',
        invitation: {
          id: 'inv-1',
          email: 'new@test.com',
          role: 'MEMBER',
          expires_at: new Date(),
        },
      });
      EmailProducer.queueWorkspaceInvitation.mockRejectedValue(
        new Error('Queue down')
      );

      const result = await workspaceService.addMember(
        workspaceId,
        userId,
        'new@test.com',
        'MEMBER'
      );

      expect(result.type).toBe('invited');
    });
  });

  // ═══════════════════════════════════════════════════
  // updateMemberRole()
  // ═══════════════════════════════════════════════════
  describe('updateMemberRole()', () => {
    it('should throw if not owner', async () => {
      WorkspaceQueries.isOwner.mockResolvedValue(false);

      await expect(
        workspaceService.updateMemberRole(workspaceId, userId, 'mem-1', 'ADMIN')
      ).rejects.toThrow('Only workspace owner can update member roles');
    });

    it('should throw for invalid role', async () => {
      WorkspaceQueries.isOwner.mockResolvedValue(true);

      await expect(
        workspaceService.updateMemberRole(workspaceId, userId, 'mem-1', 'SUPER')
      ).rejects.toThrow('Invalid role');
    });

    it('should throw if member not found', async () => {
      WorkspaceQueries.isOwner.mockResolvedValue(true);
      WorkspaceQueries.findMemberById.mockResolvedValue(null);

      await expect(
        workspaceService.updateMemberRole(workspaceId, userId, 'missing', 'ADMIN')
      ).rejects.toThrow('Member not found');
    });

    it('should prevent changing owner role', async () => {
      WorkspaceQueries.isOwner
        .mockResolvedValueOnce(true)     // caller is owner
        .mockResolvedValueOnce(true);    // target is also owner
      WorkspaceQueries.findMemberById.mockResolvedValue({
        id: 'mem-1',
        user_id: 'other-owner',
      });

      await expect(
        workspaceService.updateMemberRole(workspaceId, userId, 'mem-1', 'ADMIN')
      ).rejects.toThrow('Cannot change owner role');
    });

    it('should update role and invalidate caches', async () => {
      WorkspaceQueries.isOwner
        .mockResolvedValueOnce(true)     // caller is owner
        .mockResolvedValueOnce(false);   // target is not owner
      WorkspaceQueries.findMemberById.mockResolvedValue({
        id: 'mem-1',
        user_id: 'target-user',
      });
      WorkspaceQueries.updateMemberRole.mockResolvedValue({
        id: 'mem-1',
        role: 'MANAGER',
      });

      const result = await workspaceService.updateMemberRole(
        workspaceId,
        userId,
        'mem-1',
        'MANAGER'
      );

      expect(result.role).toBe('MANAGER');
      expect(invalidateCache).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // removeMember()
  // ═══════════════════════════════════════════════════
  describe('removeMember()', () => {
    it('should throw if caller is not OWNER or ADMIN', async () => {
      WorkspaceQueries.getUserRole.mockResolvedValue('MEMBER');
      WorkspaceQueries.isOwner.mockResolvedValue(false);

      await expect(
        workspaceService.removeMember(workspaceId, userId, 'mem-1')
      ).rejects.toThrow('Only workspace owner or admin can remove members');
    });

    it('should throw if member not found', async () => {
      WorkspaceQueries.getUserRole.mockResolvedValue('ADMIN');
      WorkspaceQueries.findMemberById.mockResolvedValue(null);

      await expect(
        workspaceService.removeMember(workspaceId, userId, 'missing')
      ).rejects.toThrow('Member not found');
    });

    it('should prevent self-removal', async () => {
      WorkspaceQueries.getUserRole.mockResolvedValue('ADMIN');
      WorkspaceQueries.findMemberById.mockResolvedValue({
        id: 'mem-1',
        user_id: userId,   // same as caller
      });

      await expect(
        workspaceService.removeMember(workspaceId, userId, 'mem-1')
      ).rejects.toThrow('You cannot remove yourself from the workspace');
    });

    it('should prevent removing the owner', async () => {
      WorkspaceQueries.getUserRole.mockResolvedValue('ADMIN');
      WorkspaceQueries.findMemberById.mockResolvedValue({
        id: 'mem-1',
        user_id: 'owner-user',
      });
      WorkspaceQueries.isOwner.mockResolvedValue(true);

      await expect(
        workspaceService.removeMember(workspaceId, userId, 'mem-1')
      ).rejects.toThrow('Cannot remove workspace owner');
    });

    it('should remove member and invalidate caches', async () => {
      WorkspaceQueries.getUserRole.mockResolvedValue('ADMIN');
      WorkspaceQueries.findMemberById.mockResolvedValue({
        id: 'mem-1',
        user_id: 'target-user',
      });
      WorkspaceQueries.isOwner.mockResolvedValue(false);
      WorkspaceQueries.removeMemberById.mockResolvedValue(true);

      const result = await workspaceService.removeMember(
        workspaceId,
        userId,
        'mem-1'
      );

      expect(result).toBe(true);
      expect(invalidateCache).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // acceptInvitation()
  // ═══════════════════════════════════════════════════
  describe('acceptInvitation()', () => {
    it('should throw for invalid token', async () => {
      InvitationQueries.findByToken.mockResolvedValue(null);

      await expect(
        workspaceService.acceptInvitation('bad-token', userId)
      ).rejects.toThrow('Invalid or expired invitation');
    });

    it('should throw if user email does not match invitation', async () => {
      InvitationQueries.findByToken.mockResolvedValue({
        email: 'other@test.com',
        workspace_id: workspaceId,
      });
      UserQueries.findById.mockResolvedValue({
        id: userId,
        email: 'me@test.com',
      });

      await expect(
        workspaceService.acceptInvitation('tok', userId)
      ).rejects.toThrow('This invitation was sent to a different email address');
    });

    it('should add user as member and invalidate caches', async () => {
      InvitationQueries.findByToken.mockResolvedValue({
        email: 'me@test.com',
        workspace_id: workspaceId,
        workspace_name: 'W',
        role: 'MEMBER',
        invited_by: 'inviter-id',
      });
      UserQueries.findById
        .mockResolvedValueOnce({ id: userId, email: 'me@test.com', name: 'Me' })
        .mockResolvedValueOnce({ id: userId, email: 'me@test.com', name: 'Me' });
      WorkspaceQueries.isMember.mockResolvedValue(false);
      WorkspaceQueries.addMember.mockResolvedValue();
      InvitationQueries.accept.mockResolvedValue();

      const result = await workspaceService.acceptInvitation('tok', userId);

      expect(WorkspaceQueries.addMember).toHaveBeenCalledWith(
        workspaceId,
        userId,
        'MEMBER',
        'inviter-id'
      );
      expect(result.workspaceId).toBe(workspaceId);
      expect(invalidateCache).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════
  // generateSlug() — pure function
  // ═══════════════════════════════════════════════════
  describe('generateSlug()', () => {
    it('should lowercase, replace spaces with hyphens, strip special chars', () => {
      expect(workspaceService.generateSlug('Hello World!')).toBe('hello-world');
      expect(workspaceService.generateSlug('  Trim Me  ')).toBe('trim-me');
      expect(workspaceService.generateSlug('Multi___Under___Score')).toBe(
        'multi-under-score'
      );
      expect(workspaceService.generateSlug('No$pecial@Chars#')).toBe(
        'nopecialchars'
      );
    });

    it('should cap length at 60 chars', () => {
      const longName = 'a'.repeat(100);
      expect(workspaceService.generateSlug(longName).length).toBeLessThanOrEqual(60);
    });
  });
});