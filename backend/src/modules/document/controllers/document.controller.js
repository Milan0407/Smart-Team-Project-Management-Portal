const documentService = require("../services/document.service");
const ApiResponse = require("../../../shared/utils/ApiResponse");

class DocumentController {
  async createDocument(req, res) {
    const document = await documentService.createDocument(
      {
        ...req.body,
        orgId: req.params.orgId,
      },
      req.user.id
    );
    return res.status(201).json(
      new ApiResponse({
        message: "Document created successfully",
        data: document,
      })
    );
  }

  async getDocument(req, res) {
    const document = await documentService.getDocumentById(req.params.id);
    return res.json(
      new ApiResponse({
        message: "Document fetched successfully",
        data: document,
      })
    );
  }

  async getOrgDocuments(req, res) {
    const documents = await documentService.getOrgDocuments(req.params.orgId);
    return res.json(
      new ApiResponse({
        message: "Documents fetched successfully",
        data: documents,
      })
    );
  }

  async getProjectDocuments(req, res) {
    const documents = await documentService.getProjectDocuments(req.params.projectId);
    return res.json(
      new ApiResponse({
        message: "Documents fetched successfully",
        data: documents,
      })
    );
  }

  async updateDocument(req, res) {
    const document = await documentService.updateDocument(
      req.params.id,
      req.body,
      req.user.id
    );
    return res.json(
      new ApiResponse({
        message: "Document updated successfully",
        data: document,
      })
    );
  }

  async deleteDocument(req, res) {
    await documentService.deleteDocument(req.params.id, req.user.id);
    return res.json(
      new ApiResponse({
        message: "Document deleted successfully",
      })
    );
  }
}

module.exports = new DocumentController();
