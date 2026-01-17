import { useQuery } from "@tanstack/react-query";
import { supabase } from "../client";

export const useBills = (userId?: string) => {
    return useQuery({
        queryKey: ['bills', userId],
        queryFn: async () => {
            let targetUserId = userId;

            if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No user");
                targetUserId = user.id;
            }

            const { data, error } = await supabase
                .from('bills')
                .select('*')
                .eq('user_id', targetUserId)
                .order('due_date', { ascending: true });

            if (error) throw error;
            return data;
        },
    });
};
