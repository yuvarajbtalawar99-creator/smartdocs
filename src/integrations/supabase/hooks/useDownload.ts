import { useState } from "react";
import { supabase } from "../client";
import { useToast } from "@/hooks/use-toast";

export const useDownload = () => {
    const [downloading, setDownloading] = useState<string | null>(null);
    const { toast } = useToast();

    const downloadFile = async (bucket: string, path: string, filename: string) => {
        try {
            setDownloading(path);

            // 1. Create a signed URL (expires in 60 seconds)
            const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(path, 60);

            if (error) throw error;
            if (!data?.signedUrl) throw new Error("Could not generate signed URL");

            // 2. Fetch the file to handle it as a blob (ensures "save as" behavior with correct name)
            const response = await fetch(data.signedUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            // 3. Trigger download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(link);

            toast({
                title: "Download started",
                description: `Downloading ${filename}...`,
            });
        } catch (error: any) {
            console.error("Download error:", error);
            toast({
                title: "Download failed",
                description: error.message || "Could not download the file.",
                variant: "destructive",
            });
        } finally {
            setDownloading(null);
        }
    };

    return { downloadFile, downloading };
};
