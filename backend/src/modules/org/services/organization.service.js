const ROLES = require(
  "../../../shared/constants/roles.constants"
);

const organizationRepository = require(
  "../repositories/organization.repository"
);

const User = require("../../auth/models/user.model");

const ConflictError = require(
  "../../../shared/errors/ConflictError"
);

const NotFoundError = require(
  "../../../shared/errors/NotFoundError"
);

const crypto = require("crypto");
const Invitation = require("../models/invitation.model");
const Activity = require("../../activity/models/activity.model");
const projectRepository = require("../../project/repositories/project.repository");
const emailService = require("../../../shared/services/email.service");
const joinRequestRepository = require("../repositories/joinRequest.repository");
const socketManager = require("../../../sockets/socket.manager");
const env = require("../../../config/env");

const getClientUrl = () => (env.clientUrl || "http://localhost:5173").replace(/\/$/, "");

class OrganizationService {
  async createOrganization(
    data,
    currentUserId
  ) {
    const existingOrg =
      await organizationRepository.findBySlug(
        data.slug
      );

    if (existingOrg) {
      throw new ConflictError(
        "Organization slug already exists"
      );
    }

    const organization =
      await organizationRepository.create({
        name: data.name,
        slug: data.slug,
        plan: data.plan || "free",

        ownerId: currentUserId,

        members: [
          {
            userId: currentUserId,
            role: ROLES.ORG_ADMIN,
            joinedAt: new Date(),
          },
        ],

        createdBy: currentUserId,
        updatedBy: currentUserId,
      });

    // Update user document orgMemberships
    await User.findByIdAndUpdate(currentUserId, {
      $push: {
        orgMemberships: {
          orgId: organization._id,
          role: ROLES.ORG_ADMIN,
        },
      },
    });

    return organization;
  }

  async getOrganizationById(id) {
    const organization =
      await organizationRepository.findById(
        id
      );

    if (!organization) {
      throw new NotFoundError(
        "Organization not found"
      );
    }

    return organization;
  }

  async updateOrganization(
    id,
    updateData,
    currentUserId
  ) {
    const organization =
      await organizationRepository.findById(
        id
      );

    if (!organization) {
      throw new NotFoundError(
        "Organization not found"
      );
    }

    const updatedOrganization =
      await organizationRepository.updateById(
        id,
        {
          ...updateData,
          updatedBy: currentUserId,
        }
      );

    return updatedOrganization;
  }

  async listMembers(orgId) {
    const organization =
      await organizationRepository.findById(
        orgId
      );

    if (!organization) {
      throw new NotFoundError(
        "Organization not found"
      );
    }

    return organizationRepository.listMembers(
      orgId
    );
  }

  async inviteMember(
    orgId,
    userId,
    role
  ) {
    const organization =
      await organizationRepository.findById(
        orgId
      );

    if (!organization) {
      throw new NotFoundError(
        "Organization not found"
      );
    }

    const existingMember =
      organization.members.find(
        (member) =>
          member.userId.toString() ===
          userId.toString()
      );

    if (existingMember) {
      throw new ConflictError(
        "User is already a member of this organization"
      );
    }

    const updatedOrg = await organizationRepository.addMember(
      orgId,
      {
        userId,
        role,
        joinedAt: new Date(),
      }
    );

    // Sync user orgMemberships
    await User.findByIdAndUpdate(userId, {
      $push: {
        orgMemberships: {
          orgId,
          role,
        },
      },
    });

    return updatedOrg;
  }

  async updateMemberRole(
    orgId,
    userId,
    role
  ) {
    const organization =
      await organizationRepository.findById(
        orgId
      );

    if (!organization) {
      throw new NotFoundError(
        "Organization not found"
      );
    }

    const member =
      organization.members.find(
        (member) =>
          member.userId.toString() ===
          userId.toString()
      );

    if (!member) {
      throw new NotFoundError(
        "Member not found"
      );
    }

    const updatedOrg = await organizationRepository.updateMemberRole(
      orgId,
      userId,
      role
    );

    // Sync user orgMemberships role
    await User.updateOne(
      { _id: userId, "orgMemberships.orgId": orgId },
      { $set: { "orgMemberships.$.role": role } }
    );

    return updatedOrg;
  }

  async removeMember(
    orgId,
    userId
  ) {
    const organization =
      await organizationRepository.findById(
        orgId
      );

    if (!organization) {
      throw new NotFoundError(
        "Organization not found"
      );
    }

    if (
      organization.ownerId.toString() ===
      userId.toString()
    ) {
      throw new ConflictError(
        "Organization owner cannot be removed"
      );
    }

    const member =
      organization.members.find(
        (member) =>
          member.userId.toString() ===
          userId.toString()
      );

    if (!member) {
      throw new NotFoundError(
        "Member not found"
      );
    }

    const result = await organizationRepository.removeMember(
      orgId,
      userId
    );

    // Sync user orgMemberships
    await User.findByIdAndUpdate(userId, {
      $pull: {
        orgMemberships: {
          orgId,
        },
      },
    });

    return result;
  }

  async inviteMemberByEmail(orgId, email, role, currentUserId) {
    const organization = await organizationRepository.findById(orgId);
    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already a member
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      const isMember = organization.members.find(
        (member) => member.userId.toString() === existingUser._id.toString()
      );
      if (isMember) {
        throw new ConflictError("User is already a member of this organization");
      }
    }

    // Generate token and expiry (7 days)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = new Invitation({
      orgId,
      email: normalizedEmail,
      role,
      token,
      invitedBy: currentUserId,
      expiresAt,
    });

    const inviteLink = `${getClientUrl()}/accept-invite?token=${token}`;
    await emailService.sendInviteEmail(normalizedEmail, organization.name, role, inviteLink);

    await Invitation.deleteMany({ orgId, email: normalizedEmail, status: "pending" });
    return invitation.save();
  }

  async acceptInvitation(token, userId) {
    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      throw new NotFoundError("Invitation token is invalid");
    }

    if (invitation.status !== "pending") {
      throw new ConflictError(`Invitation has already been ${invitation.status}`);
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      throw new ConflictError("Invitation token has expired");
    }

    const organization = await organizationRepository.findById(invitation.orgId);
    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    // Check if user is already a member
    const existingMember = organization.members.find(
      (member) => member.userId.toString() === userId.toString()
    );

    if (!existingMember) {
      // Add member to organization
      await organizationRepository.addMember(invitation.orgId, {
        userId,
        role: invitation.role,
        joinedAt: new Date(),
      });

      // Sync user orgMemberships
      await User.findByIdAndUpdate(userId, {
        $push: {
          orgMemberships: {
            orgId: invitation.orgId,
            role: invitation.role,
          },
        },
      });
    }

    invitation.status = "accepted";
    await invitation.save();

    return organization;
  }

  async listInvitations(orgId) {
    return Invitation.find({ orgId, status: "pending" })
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });
  }

  async revokeInvitation(orgId, invitationId) {
    const invitation = await Invitation.findOne({ _id: invitationId, orgId });
    if (!invitation) {
      throw new NotFoundError("Invitation not found");
    }

    invitation.status = "revoked";
    await invitation.save();

    return invitation;
  }

  async getInvitationDetails(token) {
    const invitation = await Invitation.findOne({ token }).populate("orgId", "name slug");
    if (!invitation) {
      throw new NotFoundError("Invitation token is invalid");
    }

    if (invitation.status !== "pending") {
      throw new ConflictError(`Invitation has already been ${invitation.status}`);
    }

    if (invitation.expiresAt < new Date()) {
      invitation.status = "expired";
      await invitation.save();
      throw new ConflictError("Invitation token has expired");
    }

    return {
      email: invitation.email,
      role: invitation.role,
      orgName: invitation.orgId?.name,
      orgSlug: invitation.orgId?.slug,
      orgId: invitation.orgId?._id,
    };
  }

  async getOrgActivity(orgId) {
    const organization = await organizationRepository.findById(orgId);
    if (!organization) {
      throw new NotFoundError("Organization not found");
    }

    const projects = await projectRepository.findByOrgId(orgId);
    const projectIds = projects.map((p) => p._id);

    return Activity.find({ projectId: { $in: projectIds } })
      .populate("actorId", "name email avatar")
      .populate("taskId", "title")
      .populate("projectId", "name")
      .sort({ createdAt: -1 })
      .limit(100);
  }

  async createJoinRequest(data, currentUserId) {
    const org = await organizationRepository.findBySlug(data.orgSlug);
    if (!org) {
      throw new NotFoundError("Organization not found");
    }

    // Check if user is already a member
    const existingMember = org.members.find(
      (m) => m.userId.toString() === currentUserId.toString()
    );
    if (existingMember) {
      throw new ConflictError("You are already a member of this organization");
    }

    // Check if there is an active pending join request for this user to any org
    const existingPending = await joinRequestRepository.findOne({
      userId: currentUserId,
      status: "pending",
    });
    if (existingPending) {
      throw new ConflictError("You already have a pending join request. Please cancel it first.");
    }

    const joinRequest = await joinRequestRepository.create({
      orgId: org._id,
      userId: currentUserId,
      role: data.role,
      status: "pending",
    });

    return joinRequest;
  }

  async getMyPendingJoinRequest(userId) {
    return joinRequestRepository.findPendingByUser(userId);
  }

  async cancelPendingJoinRequest(requestId, userId) {
    const deleted = await joinRequestRepository.deleteByIdAndUser(requestId, userId);
    if (!deleted) {
      throw new NotFoundError("Pending join request not found or not authorized to cancel");
    }
    return deleted;
  }

  async listPendingJoinRequests(orgId) {
    return joinRequestRepository.findPendingByOrg(orgId);
  }

  async resolveJoinRequest(orgId, requestId, action, adminUserId) {
    const request = await joinRequestRepository.findById(requestId);
    if (!request || request.orgId.toString() !== orgId.toString() || request.status !== "pending") {
      throw new NotFoundError("Pending join request not found for this organization");
    }

    if (action === "reject") {
      const updated = await joinRequestRepository.updateStatus(requestId, "rejected");
      
      // Notify user via Socket.io
      socketManager.toUser(request.userId.toString(), "join-request:resolved", {
        requestId,
        status: "rejected",
        orgId,
      });

      return updated;
    }

    if (action === "approve") {
      // Approve request in database
      const updated = await joinRequestRepository.updateStatus(requestId, "approved");

      // Double check if user is already a member
      const org = await organizationRepository.findById(orgId);
      const isMember = org.members.some(
        (m) => m.userId.toString() === request.userId.toString()
      );

      if (!isMember) {
        // Add member to org
        await organizationRepository.addMember(orgId, {
          userId: request.userId,
          role: request.role,
          joinedAt: new Date(),
        });

        // Add org to user memberships
        await User.findByIdAndUpdate(request.userId, {
          $push: {
            orgMemberships: {
              orgId,
              role: request.role,
            },
          },
        });
      }

      // Notify user via Socket.io
      socketManager.toUser(request.userId.toString(), "join-request:resolved", {
        requestId,
        status: "approved",
        orgId,
      });

      return updated;
    }
  }
}

module.exports = new OrganizationService();
