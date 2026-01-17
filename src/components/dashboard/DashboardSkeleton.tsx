import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardSkeleton = () => {
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
            {/* Hero Header Skeleton */}
            <div className="h-64 rounded-2xl bg-muted" />

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="h-40 bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="w-12 h-12 rounded-xl bg-muted" />
                            <div className="w-4 h-4 rounded bg-muted" />
                        </CardHeader>
                        <CardContent>
                            <div className="w-12 h-8 rounded bg-muted mb-2" />
                            <div className="w-24 h-4 rounded bg-muted" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions Skeleton */}
            <div className="space-y-4">
                <div className="h-8 w-48 rounded bg-muted" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-40 rounded-2xl border border-border bg-card" />
                    ))}
                </div>
            </div>
        </div>
    );
};
