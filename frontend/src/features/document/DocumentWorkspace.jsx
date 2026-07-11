import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  Save,
  X,
  FileCode,
  Calendar,
  User,
  Folder,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  useGetOrgDocumentsQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useDeleteDocumentMutation,
} from "./documentApiSlice";
import { useGetProjectsByOrgQuery } from "../project/projectApiSlice";

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.data?.message || error?.error || error?.message || fallback;

const InlineError = ({ message, onRetry, actionLabel = "Retry" }) => (
  <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive">
    <div className="flex items-start gap-2">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-1 rounded-md border border-destructive/20 bg-card px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10"
        >
          <RefreshCw className="h-3 w-3" />
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

const DocumentListSkeleton = () => (
  <div className="space-y-2 p-2">
    {[0, 1, 2, 3].map((item) => (
      <div key={item} className="rounded-lg border border-transparent p-3">
        <div className="mb-3 h-3 w-36 rounded bg-secondary animate-pulse" />
        <div className="flex justify-between">
          <div className="h-2.5 w-24 rounded bg-secondary/70 animate-pulse" />
          <div className="h-2.5 w-14 rounded bg-secondary/70 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

const DocumentWorkspace = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();

  const [activeDocId, setActiveDocId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all"); // "all" | "org" | [projectId]

  // Form states
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [docProjectId, setDocProjectId] = useState("");
  const [actionError, setActionError] = useState("");

  // API calls
  const {
    data: docsRes,
    isLoading: docsLoading,
    isFetching: docsFetching,
    isError: docsError,
    error: docsErrorData,
    refetch: refetchDocs,
  } =
    useGetOrgDocumentsQuery(orgId, { skip: !orgId });
  const {
    data: projectsRes,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsErrorData,
    refetch: refetchProjects,
  } = useGetProjectsByOrgQuery(orgId, { skip: !orgId });

  const [createDocument, { isLoading: isCreatingDoc }] = useCreateDocumentMutation();
  const [updateDocument, { isLoading: isUpdatingDoc }] = useUpdateDocumentMutation();
  const [deleteDocument, { isLoading: isDeletingDoc }] = useDeleteDocumentMutation();

  const docs = docsRes?.data || [];
  const projects = projectsRes?.data || [];

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      // Search term filter
      const matchesSearch =
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.content || "").toLowerCase().includes(searchTerm.toLowerCase());

      // Project filter
      if (selectedProjectFilter === "all") return matchesSearch;
      if (selectedProjectFilter === "org") return matchesSearch && !doc.projectId;
      return matchesSearch && doc.projectId?._id === selectedProjectFilter;
    });
  }, [docs, searchTerm, selectedProjectFilter]);

  const activeDoc = useMemo(() => {
    return docs.find((d) => d._id === activeDocId);
  }, [docs, activeDocId]);

  const handleSelectDoc = (doc) => {
    setActiveDocId(doc._id);
    setIsEditing(false);
    setIsCreating(false);
    setDocTitle(doc.title);
    setDocContent(doc.content || "");
    setDocProjectId(doc.projectId?._id || "");
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setIsEditing(false);
    setActiveDocId(null);
    setDocTitle("");
    setDocContent("");
    setDocProjectId("");
  };

  const handleStartEdit = () => {
    if (!activeDoc) return;
    setIsEditing(true);
    setIsCreating(false);
    setDocTitle(activeDoc.title);
    setDocContent(activeDoc.content || "");
    setDocProjectId(activeDoc.projectId?._id || "");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    try {
      if (isCreating) {
        const payload = {
          orgId,
          title: docTitle,
          content: docContent,
          projectId: docProjectId || null,
        };
        const result = await createDocument(payload).unwrap();
        setIsCreating(false);
        if (result?.data?._id) {
          setActiveDocId(result.data._id);
        }
      } else if (isEditing && activeDocId) {
        await updateDocument({
          id: activeDocId,
          title: docTitle,
          content: docContent,
          projectId: docProjectId || null,
        }).unwrap();
        setIsEditing(false);
      }
      setActionError("");
      refetchDocs();
    } catch (err) {
      console.error("Failed to save document:", err);
      setActionError(getErrorMessage(err, "Could not save this document."));
    }
  };

  const handleDelete = async () => {
    if (!activeDocId || !window.confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument(activeDocId).unwrap();
      setActiveDocId(null);
      setIsEditing(false);
      setActionError("");
      refetchDocs();
    } catch (err) {
      console.error("Failed to delete document:", err);
      setActionError(getErrorMessage(err, "Could not delete this document."));
    }
  };

  // Basic Markdown Renderer
  const renderMarkdown = (text) => {
    if (!text) {
      return (
        <p className="text-muted-foreground italic text-sm">
          No content yet. Click Edit to add content using markdown syntax.
        </p>
      );
    }

    const lines = text.split("\n");
    let inCodeBlock = false;
    let codeContent = [];
    const renderedElements = [];

    lines.forEach((line, index) => {
      // Code Block
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          renderedElements.push(
            <pre
              key={`code-${index}`}
              className="p-4 bg-secondary/80 border border-border rounded-lg overflow-x-auto my-3 font-mono text-xs text-foreground"
            >
              <code>{codeContent.join("\n")}</code>
            </pre>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith("# ")) {
        renderedElements.push(
          <h1
            key={index}
            className="text-2xl font-bold border-b border-border pb-1.5 mt-5 mb-3 text-foreground"
          >
            {line.substring(2)}
          </h1>
        );
      } else if (line.startsWith("## ")) {
        renderedElements.push(
          <h2 key={index} className="text-xl font-bold mt-4 mb-2 text-foreground">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        renderedElements.push(
          <h3 key={index} className="text-lg font-bold mt-3 mb-1.5 text-foreground">
            {line.substring(4)}
          </h3>
        );
      }
      // Bullet lists
      else if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        renderedElements.push(
          <ul key={index} className="list-disc pl-5 my-1 text-sm text-foreground">
            <li>{line.trim().substring(2)}</li>
          </ul>
        );
      }
      // Checkboxes
      else if (line.trim().startsWith("- [ ]")) {
        renderedElements.push(
          <div key={index} className="flex items-center gap-2 my-1 text-sm text-foreground">
            <input type="checkbox" disabled className="rounded border-muted" />
            <span>{line.trim().substring(5)}</span>
          </div>
        );
      } else if (line.trim().startsWith("- [x]") || line.trim().startsWith("- [X]")) {
        renderedElements.push(
          <div
            key={index}
            className="flex items-center gap-2 my-1 text-sm line-through text-muted-foreground"
          >
            <input type="checkbox" checked disabled className="rounded border-muted" />
            <span>{line.trim().substring(5)}</span>
          </div>
        );
      }
      // Blockquotes
      else if (line.startsWith("> ")) {
        renderedElements.push(
          <blockquote
            key={index}
            className="border-l-4 border-primary pl-3 py-0.5 italic my-2 text-muted-foreground bg-secondary/20 rounded-r-md text-sm"
          >
            {line.substring(2)}
          </blockquote>
        );
      }
      // Normal line
      else {
        if (line.trim() === "") {
          renderedElements.push(<div key={index} className="h-2"></div>);
        } else {
          // Simplistic Bold parsing (**text**)
          let parts = [];
          let currentStr = line;
          let boldIndex;
          let keyIdx = 0;

          while ((boldIndex = currentStr.indexOf("**")) !== -1) {
            const nextBoldIndex = currentStr.indexOf("**", boldIndex + 2);
            if (nextBoldIndex === -1) break;

            // Text before bold
            if (boldIndex > 0) {
              parts.push(currentStr.substring(0, boldIndex));
            }
            // Bold text
            parts.push(
              <strong key={keyIdx++} className="font-bold">
                {currentStr.substring(boldIndex + 2, nextBoldIndex)}
              </strong>
            );
            currentStr = currentStr.substring(nextBoldIndex + 2);
          }
          if (currentStr.length > 0) {
            parts.push(currentStr);
          }

          renderedElements.push(
            <p key={index} className="my-1.5 leading-relaxed text-sm text-foreground">
              {parts.length > 0 ? parts : line}
            </p>
          );
        }
      }
    });

    return <div className="space-y-0.5">{renderedElements}</div>;
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full gap-4 overflow-hidden rounded-xl border border-border bg-card/30 backdrop-blur-md animate-fadeIn">
      {/* Left panel: list of docs */}
      <div className="flex w-80 flex-col border-r border-border bg-card/40">
        <div className="p-4 space-y-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Wiki Docs
            </h2>
            <button
              onClick={handleStartCreate}
              className="p-1 rounded-md bg-primary hover:bg-primary/95 text-primary-foreground hover:scale-105 transition-all"
              title="Create Document"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search wiki docs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-secondary/50 border border-border rounded-lg text-xs placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
          </div>

          {/* Project scoping dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Scoping</label>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              disabled={projectsLoading || projectsError}
              className="w-full p-1.5 bg-secondary/40 border border-border rounded-lg text-xs text-foreground focus:outline-none"
            >
              <option value="all">{projectsLoading ? "Loading scopes..." : "All Documents"}</option>
              <option value="org">Organization-only</option>
              {projects.map((proj) => (
                <option key={proj._id} value={proj._id}>
                  Project: {proj.name}
                </option>
              ))}
            </select>
            {projectsError && (
              <InlineError
                message={getErrorMessage(projectsErrorData, "Project scopes could not load.")}
                onRetry={refetchProjects}
              />
            )}
          </div>
        </div>

        {/* Documents list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-secondary/10">
          {docsLoading ? (
            <DocumentListSkeleton />
          ) : docsError ? (
            <div className="p-2">
              <InlineError
                message={getErrorMessage(docsErrorData, "Documents could not load.")}
                onRetry={refetchDocs}
              />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <FileText className="mb-3 h-9 w-9 text-muted-foreground/30" />
              <p className="text-xs font-medium text-muted-foreground">
                {docs.length === 0 ? "No documents yet" : "No matching documents"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">
                {docs.length === 0
                  ? "Create the first wiki page for this workspace."
                  : "Try a different search or scope filter."}
              </p>
            </div>
          ) : (
            filteredDocs.map((doc) => (
              <div
                key={doc._id}
                onClick={() => handleSelectDoc(doc)}
                className={`flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-all hover:bg-secondary/60 ${
                  doc._id === activeDocId ? "bg-primary/10 border-l-4 border-primary font-medium" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground truncate max-w-[180px]">
                    {doc.title}
                  </span>
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate max-w-[120px]">By {doc.creatorId?.name || "User"}</span>
                  <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                </div>
                {doc.projectId && (
                  <span className="self-start px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] mt-1">
                    {doc.projectId.name}
                  </span>
                )}
              </div>
            ))
          )}
          {docsFetching && !docsLoading && !docsError && (
            <div className="flex justify-center py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Right panel: viewport / editor */}
      <div className="flex-1 flex flex-col bg-card/10 overflow-hidden">
        {isCreating || isEditing ? (
          /* EDIT OR CREATE FORM */
          <form onSubmit={handleSave} className="flex-1 flex flex-col p-6 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                {isCreating ? "Create New Document" : `Editing: ${activeDoc?.title}`}
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                    if (isCreating) setActiveDocId(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-medium transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDoc || isUpdatingDoc || !docTitle.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-medium transition-all hover:shadow-md hover:shadow-primary/20 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isCreatingDoc || isUpdatingDoc ? "Saving..." : "Save Wiki"}
                </button>
              </div>
            </div>
            {actionError && (
              <InlineError message={actionError} onRetry={() => setActionError("")} actionLabel="Dismiss" />
            )}

            <div className="space-y-3 flex-1 flex flex-col overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Enter document title..."
                    className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Scope (Project)</label>
                  <select
                    value={docProjectId}
                    onChange={(e) => setDocProjectId(e.target.value)}
                    disabled={projectsLoading || projectsError}
                    className="w-full px-3 py-2 bg-secondary/30 border border-border rounded-lg text-sm text-foreground focus:outline-none"
                  >
                    <option value="">
                      {projectsLoading ? "Loading project scopes..." : "Organization-wide (General Wiki)"}
                    </option>
                    {projects.map((proj) => (
                      <option key={proj._id} value={proj._id}>
                        Project: {proj.name}
                      </option>
                    ))}
                  </select>
                  {projectsError && (
                    <p className="text-[10px] text-destructive">
                      Project scopes unavailable. Save as organization-wide or retry from the list panel.
                    </p>
                  )}
                </div>
              </div>

              {/* MD Editor Split screen */}
              <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
                <div className="flex flex-col h-full overflow-hidden">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Content (Markdown)</label>
                  <textarea
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    placeholder="Use Markdown: # Title, - lists, **bold**, > quotes, ``` codeblocks"
                    className="flex-1 w-full p-4 bg-secondary/20 border border-border rounded-lg font-mono text-xs resize-none focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 overflow-y-auto"
                  />
                </div>

                <div className="flex flex-col h-full overflow-hidden">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Live Preview</label>
                  <div className="flex-1 w-full p-4 border border-border border-dashed rounded-lg bg-card/20 overflow-y-auto prose dark:prose-invert">
                    <h2 className="text-xl font-bold border-b border-border pb-1 mb-3">{docTitle || "Untitled Document"}</h2>
                    {renderMarkdown(docContent)}
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : activeDoc ? (
          /* DOCUMENT VIEWING PANEL */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-card/20">
              <div className="space-y-1.5 max-w-[60%]">
                <h2 className="text-xl font-bold text-foreground truncate">{activeDoc.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    Created by {activeDoc.creatorId?.name || "User"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    Last updated {new Date(activeDoc.updatedAt).toLocaleString()}
                  </span>
                  {activeDoc.projectId && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold text-[10px]">
                      <Folder className="w-3 h-3" />
                      {activeDoc.projectId.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-semibold transition-all hover:scale-105"
                >
                  <Edit2 className="w-3.5 h-3.5 text-primary" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeletingDoc}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/25 text-red-500 text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
            {actionError && (
              <div className="px-6 pt-4">
                <InlineError message={actionError} onRetry={() => setActionError("")} actionLabel="Dismiss" />
              </div>
            )}

            {/* Content canvas */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-card/5">
              <article className="max-w-4xl mx-auto prose dark:prose-invert">
                {renderMarkdown(activeDoc.content)}
              </article>
            </div>
          </div>
        ) : (
          /* EMPTY VIEWPORT */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-card/5">
            {docsLoading ? (
              <>
                <Loader2 className="mb-4 h-9 w-9 animate-spin text-muted-foreground" />
                <h3 className="mb-1 text-base font-semibold">Loading wiki docs</h3>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Your shared knowledge base is being prepared.
                </p>
              </>
            ) : docsError ? (
              <>
                <AlertCircle className="mb-4 h-12 w-12 text-destructive/80" />
                <h3 className="mb-1 text-base font-semibold">Wiki docs could not load</h3>
                <p className="mb-4 max-w-sm text-xs text-muted-foreground">
                  {getErrorMessage(docsErrorData, "Refresh and try again.")}
                </p>
                <button
                  type="button"
                  onClick={refetchDocs}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-secondary"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </>
            ) : (
              <>
                <BookOpen className="w-16 h-16 text-muted-foreground opacity-20 mb-4 animate-bounce" />
                <h3 className="text-base font-bold mb-1">Select a Wiki Document</h3>
                <p className="text-xs text-muted-foreground max-w-sm mb-4">
                  Choose a collaborative wiki page from the sidebar list, or create a new document to share knowledge with your team.
                </p>
                <button
                  onClick={handleStartCreate}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg text-xs font-semibold hover:shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Document
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentWorkspace;
