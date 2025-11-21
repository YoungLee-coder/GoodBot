import { db } from "@/lib/db";
import { groups } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users } from "lucide-react";

export default async function GroupsPage() {
    const allGroups = await db.select().from(groups);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
                <div className="text-sm text-muted-foreground">
                    Total: {allGroups.length}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Managed Groups</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Joined At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allGroups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                                        No groups found. Add the bot to a group to see it here.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                allGroups.map((group) => (
                                    <TableRow key={group.id}>
                                        <TableCell className="font-mono text-xs">{group.id}</TableCell>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            {group.title}
                                        </TableCell>
                                        <TableCell className="capitalize">{group.type}</TableCell>
                                        <TableCell>{group.createdAt?.toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
