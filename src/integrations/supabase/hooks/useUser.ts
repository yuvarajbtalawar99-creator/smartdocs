import { useQuery } from "@tanstack/react-query";
import { supabase } from "../client";

export const useUser = () => {
    return useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return user;
        },
        staleTime: Infinity, // User data doesn't change often
        gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    });
};
