import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    FileText,
    Receipt,
    Search,
    Plus,
    Settings,
    User,
    LayoutDashboard,
    Bell
} from "lucide-react";
import { useDocuments } from "@/integrations/supabase/hooks/useDocuments";
import { useBills } from "@/integrations/supabase/hooks/useBills";

export function GlobalSearch() {
    const [open, setOpen] = React.useState(false);
    const navigate = useNavigate();

    const { data: documentsData } = useDocuments();
    const { data: billsData } = useBills();

    const documents = documentsData?.pages.flatMap(page => page) || [];
    const bills = billsData || [];

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-all"
            >
                <Search className="h-4 w-4" />
                <span>Search anything...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>

                    <CommandGroup heading="Quick Actions">
                        <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/documents"))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Upload Document</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/bills"))}>
                            <Plus className="mr-2 h-4 w-4" />
                            <span>Add New Bill</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Documents">
                        {documents.slice(0, 5).map((doc) => (
                            <CommandItem
                                key={doc.id}
                                onSelect={() => runCommand(() => navigate("/documents"))}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                <span>{doc.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">{doc.type}</span>
                            </CommandItem>
                        ))}
                        <CommandItem onSelect={() => runCommand(() => navigate("/documents"))}>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>View All Documents</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Bills">
                        {bills.slice(0, 5).map((bill) => (
                            <CommandItem
                                key={bill.id}
                                onSelect={() => runCommand(() => navigate("/bills"))}
                            >
                                <Receipt className="mr-2 h-4 w-4" />
                                <span>{bill.bill_type} - ₹{bill.amount}</span>
                                <span className="ml-auto text-xs text-muted-foreground">Due: {new Date(bill.due_date).toLocaleDateString()}</span>
                            </CommandItem>
                        ))}
                        <CommandItem onSelect={() => runCommand(() => navigate("/bills"))}>
                            <Receipt className="mr-2 h-4 w-4" />
                            <span>View All Bills</span>
                        </CommandItem>
                    </CommandGroup>

                    <CommandSeparator />

                    <CommandGroup heading="Settings">
                        <CommandItem onSelect={() => runCommand(() => navigate("/profile"))}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Profile Settings</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => navigate("/notifications"))}>
                            <Bell className="mr-2 h-4 w-4" />
                            <span>Notifications</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
