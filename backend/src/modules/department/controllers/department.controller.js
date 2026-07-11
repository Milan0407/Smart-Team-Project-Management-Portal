const departmentService = require(
  "../services/department.service"
);

const ApiResponse = require(
  "../../../shared/utils/ApiResponse"
);

class DepartmentController {
  async createDepartment(
    req,
    res
  ) {
    const department =
      await departmentService.createDepartment(
        req.params.orgId,
        req.body,
        req.user.id
      );

    return res.status(201).json(
      new ApiResponse({
        message:
          "Department created successfully",
        data: department,
      })
    );
  }

  async getDepartmentsByOrg(
    req,
    res
  ) {
    const departments =
      await departmentService.getDepartmentsByOrg(
        req.params.orgId
      );

    return res.json(
      new ApiResponse({
        message:
          "Departments fetched successfully",
        data: departments,
      })
    );
  }

  async getDepartment(
    req,
    res
  ) {
    const department =
      await departmentService.getDepartmentById(
        req.params.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Department fetched successfully",
        data: department,
      })
    );
  }

  async updateDepartment(
    req,
    res
  ) {
    const department =
      await departmentService.updateDepartment(
        req.params.id,
        req.body,
        req.user.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Department updated successfully",
        data: department,
      })
    );
  }

  async deleteDepartment(
    req,
    res
  ) {
    const department =
      await departmentService.deleteDepartment(
        req.params.id
      );

    return res.json(
      new ApiResponse({
        message:
          "Department deleted successfully",
        data: department,
      })
    );
  }

  async addMember(
    req,
    res
  ) {
    const department =
      await departmentService.addMember(
        req.params.id,
        req.body.userId,
        req.body.role
      );

    return res.json(
      new ApiResponse({
        message:
          "Department member added successfully",
        data: department,
      })
    );
  }

  async removeMember(
    req,
    res
  ) {
    const department =
      await departmentService.removeMember(
        req.params.id,
        req.params.uid
      );

    return res.json(
      new ApiResponse({
        message:
          "Department member removed successfully",
        data: department,
      })
    );
  }

  async assignManager(
    req,
    res
  ) {
    const department =
      await departmentService.assignManager(
        req.params.id,
        req.body.managerId
      );

    return res.json(
      new ApiResponse({
        message:
          "Department manager assigned successfully",
        data: department,
      })
    );
  }
}

module.exports =
  new DepartmentController();