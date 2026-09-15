const path = require('path');
const fs = require('fs');
const AttachmentQueries = require('../db/queries/attachment.queries');
const TaskQueries = require('../db/queries/task.queries');
const ProjectQueries = require('../db/queries/project.queries');
const WorkspaceQueries = require('../db/queries/workspace.queries');
const { UPLOAD_DIR } = require('../config/upload');
const { emitToWorkspace } = require('../config/socket');
const ActivityService = require('./activity.service');
const activityService = new ActivityService();

class AttachmentService {
    async uploadAttachment(taskId, userId, file) {
        // Verify task + access
        const task = await TaskQueries.findById(taskId);
        if (!task) {
            // Delete uploaded file since task doesn't exist
            this.deleteFileFromDisk(file.path);
            throw new Error('Task not found');
        }

        const project = await ProjectQueries.findById(task.project_id);
        const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
        if (!hasAccess) {
            this.deleteFileFromDisk(file.path);
            throw new Error('You do not have access to this task');
        }

        // Build relative URL for serving (e.g., /uploads/2026/09/uuid.pdf)
        const relativePath = path.relative(UPLOAD_DIR, file.path).replace(/\\/g, '/');
        const fileUrl = `/uploads/${relativePath}`;

        // Save in DB
        const attachment = await AttachmentQueries.create({
            fileName: file.originalname,
            fileUrl,
            fileSize: file.size,
            mimeType: file.mimetype,
            taskId,
            uploadedById: userId,
        });
        // Log activity
        await activityService.log({
            action: 'ATTACHED',
            userId,
            workspaceId: project.workspace_id,
            projectId: project.id,
            taskId,
            changes: {
                fileName: file.originalname,
                fileSize: file.size,
            },
        });

        // Emit real-time event
        const enriched = this.enrich(attachment);
        emitToWorkspace(project.workspace_id, 'attachment:created', {
            attachment: enriched,
            taskId,
            projectId: project.id,
            workspaceId: project.workspace_id,
            actorId: userId,
        });

        // Invalidate task caches (attachment count changed)
        const { invalidateCache, buildKey } = require('../utils/cache.utils');
        await invalidateCache(buildKey('dashboard', '*', project.workspace_id));

        return enriched;


    }

    async getTaskAttachments(taskId, userId) {
        const task = await TaskQueries.findById(taskId);
        if (!task) throw new Error('Task not found');

        const project = await ProjectQueries.findById(task.project_id);
        const hasAccess = await this.checkWorkspaceAccess(project.workspace_id, userId);
        if (!hasAccess) throw new Error('You do not have access to this task');

        const attachments = await AttachmentQueries.findByTask(taskId);
        return attachments.map((a) => this.enrich(a));
    }

    async deleteAttachment(attachmentId, userId) {
        const attachment = await AttachmentQueries.findById(attachmentId);
        if (!attachment) throw new Error('Attachment not found');

        const task = await TaskQueries.findById(attachment.task_id);
        const project = await ProjectQueries.findById(task.project_id);
        const workspaceRole = await this.getWorkspaceRole(project.workspace_id, userId);

        // Only uploader OR MANAGER+ can delete
        const isUploader = attachment.uploaded_by_id === userId;
        const isManager = ['OWNER', 'ADMIN', 'MANAGER'].includes(workspaceRole);

        if (!isUploader && !isManager) {
            throw new Error('You do not have permission to delete this attachment');
        }

        // Delete from DB first
        await AttachmentQueries.delete(attachmentId);

        // Then delete from disk (best effort)
        const absolutePath = this.resolveFilePath(attachment.file_url);
        this.deleteFileFromDisk(absolutePath);
        // Log activity
        await activityService.log({
            action: 'UPDATED',  // or add 'DETACHED' to enum
            userId,
            workspaceId: project.workspace_id,
            projectId: project.id,
            taskId: attachment.task_id,
            changes: { removedAttachment: attachment.file_name },
        });

        // Emit event
        emitToWorkspace(project.workspace_id, 'attachment:deleted', {
            attachmentId: id,
            taskId: attachment.task_id,
            projectId: project.id,
            workspaceId: project.workspace_id,
            actorId: userId,
        });

        // Invalidate caches
        const { invalidateCache, buildKey } = require('../utils/cache.utils');
        await invalidateCache(buildKey('dashboard', '*', project.workspace_id));

        return true;
    }

    /**
     * Get the absolute disk path for a file, given its URL.
     * Enforces that the resulting path is inside UPLOAD_DIR.
     */
    resolveFilePath(fileUrl) {
        // fileUrl = /uploads/2026/09/uuid.pdf
        const relative = fileUrl.replace(/^\/uploads\//, '');
        const absolute = path.join(UPLOAD_DIR, relative);

        // Security: ensure resolved path is inside UPLOAD_DIR
        const resolved = path.resolve(absolute);
        const base = path.resolve(UPLOAD_DIR);
        if (!resolved.startsWith(base)) {
            throw new Error('Invalid file path');
        }

        return resolved;
    }

    deleteFileFromDisk(absolutePath) {
        try {
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        } catch (err) {
            console.error('Failed to delete file:', err.message);
            // Don't throw — DB delete is what matters
        }
    }

    enrich(a) {
        return {
            id: a.id,
            fileName: a.file_name,
            fileUrl: a.file_url,
            fileSize: parseInt(a.file_size),
            mimeType: a.mime_type,
            taskId: a.task_id,
            uploadedById: a.uploaded_by_id,
            uploaderName: a.uploader_name,
            uploaderPicture: a.uploader_picture,
            uploadedAt: a.uploaded_at,
        };
    }

    async checkWorkspaceAccess(workspaceId, userId) {
        const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
        return access.isOwner || access.isMember;
    }

    async getWorkspaceRole(workspaceId, userId) {
        const access = await WorkspaceQueries.getWorkspaceAccess(workspaceId, userId);
        if (access.isOwner) return 'OWNER';
        return access.role;
    }
}

module.exports = AttachmentService;