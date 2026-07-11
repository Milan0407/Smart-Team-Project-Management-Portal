const departmentRepository = require(
  "../repositories/department.repository"
);

const organizationRepository = require(
  "../../org/repositories/organization.repository"
);

const ConflictError = require(
  "../../../shared/errors/ConflictError"
);

const NotFoundError = require(
  "../../../shared/errors/NotFoundError"
);

const toIdString = (value) => {
  if (!value) return null;
  return (value._id || value).toString();
};

class DepartmentService {
  async createDepartment(
    orgId,
    data,
    currentUserId
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

    const existingDepartment =
      await departmentRepository.findByName(
        orgId,
        data.name
      );

    if (existingDepartment) {
      throw new ConflictError(
        "Department already exists"
      );
    }

    return departmentRepository.create({
      orgId,

      name: data.name,

      description:
        data.description || "",

      managerId:
        data.managerId || null,

      parentDeptId:
        data.parentDeptId || null,

      createdBy: currentUserId,
      updatedBy: currentUserId,
    });
  }

  async getDepartmentById(id) {
    const department =
      await departmentRepository.findById(
        id
      );

    if (!department) {
      throw new NotFoundError(
        "Department not found"
      );
    }

    return department;
  }

  async getDepartmentsByOrg(
    orgId
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

    return departmentRepository.findByOrgId(
      orgId
    );
  }

  async updateDepartment(
    id,
    updateData,
    currentUserId
  ) {
    const department =
      await departmentRepository.findById(
        id
      );

    if (!department) {
      throw new NotFoundError(
        "Department not found"
      );
    }

    const cleanedUpdateData = { ...updateData };
    if (cleanedUpdateData.managerId === "") cleanedUpdateData.managerId = null;
    if (cleanedUpdateData.parentDeptId === "") cleanedUpdateData.parentDeptId = null;

    return departmentRepository.updateById(
      id,
      {
        ...cleanedUpdateData,
        updatedBy: currentUserId,
      }
    );
  }

  async deleteDepartment(id) {
    const department =
      await departmentRepository.findById(
        id
      );

    if (!department) {
      throw new NotFoundError(
        "Department not found"
      );
    }

    return departmentRepository.deactivate(
      id
    );
  }

  async addMember(
    departmentId,
    userId,
    role
  ) {
    const department =
      await departmentRepository.findById(
        departmentId
      );

    if (!department) {
      throw new NotFoundError(
        "Department not found"
      );
    }

    const exists =
      department.members.find(
        (member) =>
          toIdString(member.userId) ===
          userId.toString()
      );

    if (exists) {
      throw new ConflictError(
        "User is already a department member"
      );
    }

    return departmentRepository.addMember(
      departmentId,
      {
        userId,
        role,
        joinedAt: new Date(),
      }
    );
  }

  async removeMember(
    departmentId,
    userId
  ) {
    const department =
      await departmentRepository.findById(
        departmentId
      );

    if (!department) {
      throw new NotFoundError(
        "Department not found"
      );
    }

    const exists =
      department.members.find(
        (member) =>
          toIdString(member.userId) ===
          userId.toString()
      );

    if (!exists) {
      throw new NotFoundError(
        "Department member not found"
      );
    }

    return departmentRepository.removeMember(
      departmentId,
      userId
    );
  }

  async assignManager(
    departmentId,
    managerId
  ) {
    const department =
      await departmentRepository.findById(
        departmentId
      );

    if (!department) {
      throw new NotFoundError(
        "Department not found"
      );
    }

    return departmentRepository.assignManager(
      departmentId,
      managerId
    );
  }
}

module.exports =
  new DepartmentService();
