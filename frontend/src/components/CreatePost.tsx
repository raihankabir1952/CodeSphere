"use client";

import {
  ChangeEvent,
  FormEvent,
  useRef,
  useState,
} from "react";
import {
  ImagePlus,
  Loader2,
  Send,
  X,
} from "lucide-react";

import api from "@/lib/api";

type CreatePostProps = {
  onPostCreated?: () => void;
};

export default function CreatePost({
  onPostCreated,
}: CreatePostProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Post content is required.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("content", content.trim());

      if (image) {
        formData.append("image", image);
      }

      const token = localStorage.getItem("accessToken");

      await api.post("/posts", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setContent("");
      removeImage();

      setSuccess("Post created successfully.");

      onPostCreated?.();
    } catch (error: any) {
      console.error("Create post error:", error);

      setError(
        error?.response?.data?.message ||
          "Failed to create post.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Create a Post
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Share something with the developer community.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What are you working on?"
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10"
        />

        {preview && (
          <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200">
            <img
              src={preview}
              alt="Selected image preview"
              className="max-h-80 w-full object-cover"
            />

            <button
              type="button"
              onClick={removeImage}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-white transition hover:bg-red-600"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600">
            {success}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="post-image"
            />

            <label
              htmlFor="post-image"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700"
            >
              <ImagePlus size={17} />
              Add Image
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Posting...
              </>
            ) : (
              <>
                <Send size={17} />
                Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}