const organizationService = require(
  "../services/organization.service"
);

const ApiResponse = require(
  "../../../shared/utils/ApiResponse"
);

class OrganizationController {
  async createOrganization(
    req,
    res
  ) {
    const organization =
      await organizationService.createOrganization(
        req.body,
        req.user.id
      );

    return res.status(201).json(
      new ApiResponse({
        message:
          "Organization created successfully",
        data: organization,
      })
    );
  }

  async getOrganization(
    req,
    res
  ) {
    const organization =
      await organizationService.getOrganizationById(
        req.params.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Organization fetched successfully",
        data: organization,
      })
    );
  }

  async updateOrganization(
    req,
    res
  ) {
    const organization =
      await organizationService.updateOrganization(
        req.params.id,
        req.body,
        req.user.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Organization updated successfully",
        data: organization,
      })
    );
  }

  async listMembers(
    req,
    res
  ) {
    const members =
      await organizationService.listMembers(
        req.params.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Organization members fetched successfully",
        data: members,
      })
    );
  }

  async inviteMember(
    req,
    res
  ) {
    const member =
      await organizationService.inviteMember(
        req.params.id,
        req.body.userId,
        req.body.role
      );

    return res.json(
      new ApiResponse({
        message:
          "Member added successfully",
        data: member,
      })
    );
  }

  async updateMemberRole(
    req,
    res
  ) {
    const member =
      await organizationService.updateMemberRole(
        req.params.id,
        req.params.uid,
        req.body.role
      );

    return res.json(
      new ApiResponse({
        message:
          "Member role updated successfully",
        data: member,
      })
    );
  }

  async removeMember(
    req,
    res
  ) {
    await organizationService.removeMember(
      req.params.id,
      req.params.uid
    );

    return res.json(
      new ApiResponse({
        message:
          "Member removed successfully",
      })
    );
  }

  async inviteMemberByEmail(req, res) {
    const invitation = await organizationService.inviteMemberByEmail(
      req.params.id,
      req.body.email,
      req.body.role,
      req.user.id
    );

    return res.status(201).json(
      new ApiResponse({
        message: "Invitation sent successfully",
        data: invitation,
      })
    );
  }

  async acceptInvitation(req, res) {
    const organization = await organizationService.acceptInvitation(
      req.body.token,
      req.user.id
    );

    return res.json(
      new ApiResponse({
        message: "Invitation accepted successfully",
        data: organization,
      })
    );
  }

  async listInvitations(req, res) {
    const invitations = await organizationService.listInvitations(req.params.id);

    return res.json(
      new ApiResponse({
        message: "Invitations fetched successfully",
        data: invitations,
      })
    );
  }

  async revokeInvitation(req, res) {
    await organizationService.revokeInvitation(
      req.params.id,
      req.params.invitationId
    );

    return res.json(
      new ApiResponse({
        message: "Invitation revoked successfully",
      })
    );
  }

  async getOrgActivity(req, res) {
    const activities = await organizationService.getOrgActivity(req.params.id);
    return res.json(
      new ApiResponse({
        message: "Organization activity fetched successfully",
        data: activities,
      })
    );
  }

  async createJoinRequest(req, res) {
    const joinRequest = await organizationService.createJoinRequest(
      req.body,
      req.user.id
    );

    return res.status(201).json(
      new ApiResponse({
        message: "Join request submitted successfully",
        data: joinRequest,
      })
    );
  }

  async getMyPendingJoinRequest(req, res) {
    const joinRequest = await organizationService.getMyPendingJoinRequest(
      req.user.id
    );

    return res.json(
      new ApiResponse({
        message: "Pending join request fetched successfully",
        data: joinRequest,
      })
    );
  }

  async cancelJoinRequest(req, res) {
    await organizationService.cancelPendingJoinRequest(
      req.params.requestId,
      req.user.id
    );

    return res.json(
      new ApiResponse({
        message: "Join request cancelled successfully",
      })
    );
  }

  async listJoinRequests(req, res) {
    const requests = await organizationService.listPendingJoinRequests(
      req.params.id
    );

    return res.json(
      new ApiResponse({
        message: "Pending join requests fetched successfully",
        data: requests,
      })
    );
  }

  async resolveJoinRequest(req, res) {
    const resolved = await organizationService.resolveJoinRequest(
      req.params.id,
      req.params.requestId,
      req.body.action,
      req.user.id
    );

    return res.json(
      new ApiResponse({
        message: `Join request successfully ${req.body.action}d`,
        data: resolved,
      })
    );
  }

  async getInvitationDetails(req, res) {
    const details = await organizationService.getInvitationDetails(req.query.token);
    return res.json(
      new ApiResponse({
        message: "Invitation details fetched successfully",
        data: details,
      })
    );
  }
}

module.exports = new OrganizationController();