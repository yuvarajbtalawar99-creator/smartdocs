import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "../client";

const PAGE_SIZE = 20;

export const useDocuments = () => {
    return useInfiniteQuery({
        queryKey: ['documents'],
        queryFn: async ({ pageParam = 0 }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const from = pageParam * PAGE_SIZE;
            const to = (pageParam + 1) * PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', user.id)
                .order('uploaded_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return data;
        },
        getNextPageParam: (lastPage, allPages) => {
            // If the last page has fewer items than PAGE_SIZE, we've reached the end
            return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
        },
        initialPageParam: 0,
    });
};
