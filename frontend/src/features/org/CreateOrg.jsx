import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateOrgMutation } from "./orgApiSlice";
import { Building, ArrowLeft, AlertCircle } from "lucide-react";

const CreateOrg = () => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const [createOrg, { isLoading }] = useCreateOrgMutation();

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    // Auto slugify name
    const slugified = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except hyphens and spaces
      .replace(/\s+/g, "-") // replace spaces with hyphens
      .replace(/-+/g, "-"); // merge multiple hyphens
    setSlug(slugified);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (slug.length < 2) {
      setError("Slug must be at least 2 characters");
      return;
    }

    try {
      const res = await createOrg({ name, slug }).unwrap();
      if (res.success) {
        // Redirect to new organization dashboard
        navigate(`/orgs/${res.data._id}/dashboard`);
      } else {
        setError(res.message || "Failed to create organization");
      }
    } catch (err) {
      setError(err?.data?.message || "Slug already exists or server error");
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 animate-fadeIn">
      <div className="mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Workspaces
        </button>
      </div>

      <div className="p-8 rounded-2xl border border-border bg-card shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mx-auto">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Create an Organization</h2>
          <p className="text-xs text-muted-foreground">
            Establish a new enterprise workspace for your departments and teams.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Organization Name
            </label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              required
              minLength={2}
              maxLength={100}
              className="w-full px-3.5 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              placeholder="Acme Corporation"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Workspace URL Slug
            </label>
            <div className="flex rounded-lg border border-border bg-secondary/30 overflow-hidden">
              <span className="flex items-center px-3 text-xs text-muted-foreground border-r border-border bg-secondary/50">
                orgs/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                required
                minLength={2}
                maxLength={120}
                className="w-full px-3 py-2 bg-transparent text-sm outline-none"
                placeholder="acme-corp"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Only alphanumeric characters and hyphens allowed.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-2 rounded-lg bg-primary hover:bg-primary/95 text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50 shadow-md shadow-primary/10"
          >
            {isLoading ? "Creating Organization..." : "Create Organization"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrg;
