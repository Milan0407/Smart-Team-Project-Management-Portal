const documentRepository = require("../repositories/document.repository");
const organizationRepository = require("../../org/repositories/organization.repository");
const projectRepository = require("../../project/repositories/project.repository");
const NotFoundError = require("../../../shared/errors/NotFoundError");

const toIdString = (value) => {
  if (!value) return null;
  return (value._id || value).toString();
};

class DocumentService {
  async createDocument(data, currentUserId) {
    // Validate organization
    const org = await organizationRepository.findById(data.orgId);
    if (!org) {
      throw new NotFoundError("Organization not found");
    }

    // Validate project if provided
    if (data.projectId) {
      const project = await projectRepository.findById(data.projectId);
      if (!project) {
        throw new NotFoundError("Project not found");
      }
    }

    const document = await documentRepository.create({
      title: data.title,
      content: data.content || "",
      orgId: data.orgId,
      projectId: data.projectId || null,
      creatorId: currentUserId,
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    // Trigger notification
    this.triggerWikiNotification(document, currentUserId, "created");

    return document;
  }

  async getDocumentById(id) {
    const document = await documentRepository.findById(id);
    if (!document) {
      throw new NotFoundError("Document not found");
    }
    return document;
  }

  async getOrgDocuments(orgId) {
    return documentRepository.findByOrgId(orgId);
  }

  async getProjectDocuments(projectId) {
    return documentRepository.findByProjectId(projectId);
  }

  async updateDocument(id, updateData, currentUserId) {
    const document = await documentRepository.findById(id);
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    const updated = await documentRepository.updateById(id, {
      ...updateData,
      updatedBy: currentUserId,
    });

    // Trigger notification
    this.triggerWikiNotification(updated, currentUserId, "updated");

    return updated;
  }

  async deleteDocument(id, currentUserId) {
    const document = await documentRepository.findById(id);
    if (!document) {
      throw new NotFoundError("Document not found");
    }

    return documentRepository.softDeleteById(id);
  }

  // Trigger wiki updates to all other workspace members
  triggerWikiNotification(document, currentUserId, actionWord) {
    (async () => {
      try {
        const notificationService = require("../../notification/services/notification.service");
        const User = require("../../auth/models/user.model");
        const user = await User.findById(currentUserId);
        const updaterName = user ? user.name : "Someone";
        
        const recipientIds = new Set();
        
        if (document.projectId) {
          const project = await projectRepository.findById(document.projectId);
          if (project) {
            const leadId = toIdString(project.leadId);
            if (leadId !== currentUserId.toString()) {
              recipientIds.add(leadId);
            }
            project.members.forEach((m) => {
              const uid = m.userId.toString();
              if (uid !== currentUserId.toString()) {
                recipientIds.add(uid);
              }
            });
          }
        } else {
          const org = await organizationRepository.findById(document.orgId);
          if (org) {
            const ownerId = org.ownerId._id ? org.ownerId._id.toString() : org.ownerId.toString();
            if (ownerId !== currentUserId.toString()) {
              recipientIds.add(ownerId);
            }
            org.members.forEach((m) => {
              const uid = m.userId.toString();
              if (uid !== currentUserId.toString()) {
                recipientIds.add(uid);
              }
            });
          }
        }

        const link = `/orgs/${document.orgId}/documents`;
        for (const recipientId of recipientIds) {
          await notificationService.createNotification({
            userId: recipientId,
            actorId: currentUserId,
            title: actionWord === "created" ? "New Wiki Page" : "Wiki Page Updated",
            content: `${updaterName} ${actionWord} the wiki document "${document.title}"`,
            type: "wiki",
            link,
            metadata: { documentId: document._id, orgId: document.orgId },
          });
        }
      } catch (err) {
        // Suppress errors to avoid crashing main thread
      }
    })();
  }
}

module.exports = new DocumentService();
