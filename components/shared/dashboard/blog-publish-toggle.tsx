"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleBlogPublished } from "@/lib/actions/blog.actions";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface BlogPublishToggleProps {
  blogId: string;
  published: boolean;
}

export default function BlogPublishToggle({ blogId, published }: BlogPublishToggleProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleBlogPublished(blogId);
      toast.success(result.published ? "Post published!" : "Post unpublished");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update post status");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isToggling}
      className={published ? "text-green-500 hover:text-green-600" : "text-yellow-500 hover:text-yellow-600"}
      title={published ? "Click to unpublish" : "Click to publish"}
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : published ? (
        <Eye className="h-4 w-4" />
      ) : (
        <EyeOff className="h-4 w-4" />
      )}
    </Button>
  );
}



