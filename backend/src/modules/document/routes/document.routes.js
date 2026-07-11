const express = require("express");
const router = express.Router();

const documentController = require("../controllers/document.controller");
const authenticate = require("../../auth/middleware/authenticate.middleware");
const { checkOrgAccess } = require("../../org/middleware/orgAuth.middleware");
const { checkProjectAccess } = require("../../project/middleware/projectAuth.middleware");
const { checkDocumentAccess } = require("../middleware/documentAuth.middleware");
const validate = require("../../../shared/middleware/validate.middleware");
const asyncHandler = require("../../../shared/middleware/asyncHandler.middleware");

const {
  validateCreateDocument,
  validateUpdateDocument,
} = require("../validators/document.validator");

/*
|--------------------------------------------------------------------------
| Document Routes
|--------------------------------------------------------------------------
*/

// Create document under Organization context
router.post(
  "/orgs/:orgId/documents",
  authenticate,
  checkOrgAccess(),
  validate(validateCreateDocument),
  asyncHandler(documentController.createDocument.bind(documentController))
);

// Get Organization-scoped documents
router.get(
  "/orgs/:orgId/documents",
  authenticate,
  checkOrgAccess(),
  asyncHandler(documentController.getOrgDocuments.bind(documentController))
);

// Get Project-scoped documents
router.get(
  "/projects/:projectId/documents",
  authenticate,
  checkProjectAccess(),
  asyncHandler(documentController.getProjectDocuments.bind(documentController))
);

// Get individual document
router.get(
  "/documents/:id",
  authenticate,
  checkDocumentAccess(),
  asyncHandler(documentController.getDocument.bind(documentController))
);

// Update document
router.patch(
  "/documents/:id",
  authenticate,
  checkDocumentAccess(),
  validate(validateUpdateDocument),
  asyncHandler(documentController.updateDocument.bind(documentController))
);

// Delete document
router.delete(
  "/documents/:id",
  authenticate,
  checkDocumentAccess(),
  asyncHandler(documentController.deleteDocument.bind(documentController))
);

module.exports = router;
