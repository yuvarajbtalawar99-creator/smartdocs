import { useState } from "react";
import { supabase } from "../client";
import { useToast } from "@/hooks/use-toast";
import { saveFileToCache, getFileFromCache } from "@/lib/offline-storage";

export const useDownload = () => {
    const [downloading, setDownloading] = useState<string | null>(null);
    const { toast } = useToast();

    const downloadFile = async (bucket: string, path: string, filename: string, shouldOpen: boolean = false) => {
        try {
            setDownloading(path);

            // 1. Check offline cache first
            const cached = await getFileFromCache(bucket, path);
            let blob: Blob;
            let blobUrl: string;

            if (cached) {
                blob = cached.blob;
                blobUrl = window.URL.createObjectURL(blob);
            } else {
                // 2. Create a signed URL (expires in 60 seconds)
                const { data, error } = await supabase.storage
                    .from(bucket)
                    .createSignedUrl(path, 60);

                if (error) throw error;
                if (!data?.signedUrl) throw new Error("Could not generate signed URL");

                // 3. Fetch the file to handle it as a blob
                const response = await fetch(data.signedUrl);
                blob = await response.blob();
                blobUrl = window.URL.createObjectURL(blob);

                // 4. Save to cache for offline use
                await saveFileToCache(bucket, path, blob, filename);
            }

            if (shouldOpen) {
                window.open(blobUrl, '_blank');
            } else {
                // 5. Trigger download
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Cleanup
            // We don't revoke immediately if we opened in new tab, but here it's fine for download
            if (!shouldOpen) {
                window.URL.revokeObjectURL(blobUrl);
            }

            toast({
                title: cached ? "Opened from offline cache" : "Download started",
                description: `File: ${filename}`,
            });
        } catch (error: any) {
            console.error("Download error:", error);
            toast({
                title: "Action failed",
                description: error.message || "Could not access the file.",
                variant: "destructive",
            });
        } finally {
            setDownloading(null);
        }
    };

    return { downloadFile, downloading };
};
