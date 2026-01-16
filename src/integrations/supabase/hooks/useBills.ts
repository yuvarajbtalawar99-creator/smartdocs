import { useQuery } from "@tanstack/react-query";
import { supabase } from "../client";

export const useBills = () => {
    return useQuery({
        queryKey: ['bills'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const { data, error } = await supabase
                .from('bills')
                .select('*')
                .eq('user_id', user.id)
                .order('due_date', { ascending: true });

            if (error) throw error;
            return data;
        },
    });
};
