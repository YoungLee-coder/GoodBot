"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Gift, Trophy } from "lucide-react";
import { useLanguage } from "@/components/language-provider";

type Group = {
  id: number;
  title: string | null;
  type: string | null;
  createdAt: Date | null;
};

type Lottery = {
  id: number;
  groupId: number;
  title: string;
  description: string | null;
  winnerCount: number;
  status: string;
  createdAt: Date | null;
  endedAt: Date | null;
  participantCount: number;
};

export function GroupsPageClient({ groups, lotteries }: { groups: Group[]; lotteries: Lottery[] }) {
  const { t } = useLanguage();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t.groups.title}</h1>
        <div className="text-sm text-muted-foreground">
          {t.groups.total}: {groups.length} {t.groups.groups}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.groups.managedGroups}</CardTitle>
          <CardDescription>{t.groups.managedGroupsDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.groups.groupId}</TableHead>
                <TableHead>{t.groups.groupName}</TableHead>
                <TableHead>{t.groups.type}</TableHead>
                <TableHead>{t.groups.joinedAt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                    {t.groups.noGroups}
                  </TableCell>
                </TableRow>
              ) : (
                groups.map((group) => (
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {t.groups.lotteries}
          </CardTitle>
          <CardDescription>{t.groups.lotteriesDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.groups.lotteryTitle}</TableHead>
                <TableHead>{t.groups.belongsTo}</TableHead>
                <TableHead>{t.groups.status}</TableHead>
                <TableHead>{t.groups.participants}</TableHead>
                <TableHead>{t.groups.winners}</TableHead>
                <TableHead>{t.groups.createdAt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lotteries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                    {t.groups.noLotteries}
                  </TableCell>
                </TableRow>
              ) : (
                lotteries.map((lottery) => {
                  const group = groups.find((g) => g.id === lottery.groupId);
                  return (
                    <TableRow key={lottery.id}>
                      <TableCell className="font-medium">{lottery.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {group?.title || t.groups.unknownGroup}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lottery.status === "active" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t.groups.statusActive}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {t.groups.statusEnded}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{lottery.participantCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          {lottery.winnerCount}
                        </div>
                      </TableCell>
                      <TableCell>{lottery.createdAt?.toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
