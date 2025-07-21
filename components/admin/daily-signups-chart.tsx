'use client';

import { useEffect, useState } from 'react';
import { getDailySignupsAction } from '@/db/actions/analytics.actions';
import type { DailySignupsRow } from '@/db/repository/analytics.repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface ChartPoint {
  day: string;
  signups: number;
}

export default function DailySignupsChart() {
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const load = async () => {
      const result = await getDailySignupsAction(range);
      if (result.success) {
        setData(
          result.data.map((d: DailySignupsRow) => ({
            day: new Date(d.day).toLocaleDateString(),
            signups: d.signups,
          }))
        );
      }
    };
    load();
  }, [range]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Sign Ups</CardTitle>
          <Select value={String(range)} onValueChange={(val) => setRange(Number(val) as 7 | 30 | 90)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{ signups: { label: 'Signups' } }} className="min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipContent indicator="line" />} />
              <Line type="monotone" dataKey="signups" stroke="var(--chart-1)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
