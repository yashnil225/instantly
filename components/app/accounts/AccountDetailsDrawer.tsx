"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Play, Pause, Flame } from "lucide-react"

interface AccountDetailsDrawerProps {
    account: any
    open: boolean
    onClose: () => void
}

const MOCK_WARMUP_DATA = [
    { day: 'Wed', sent: 7 },
    { day: 'Thu', sent: 0 },
    { day: 'Fri', sent: 10 },
    { day: 'Sat', sent: 11 },
    { day: 'Sun', sent: 0 },
    { day: 'Mon', sent: 0 },
    { day: 'Tue', sent: 0 },
]

export function AccountDetailsDrawer({ account, open, onClose }: AccountDetailsDrawerProps) {
    if (!account) return null

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-[800px] sm:max-w-[800px] bg-card border-l border-border p-0">
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b p-6">
                        <div>
                            <h2 className="text-lg font-semibold">{account.email}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Flame className="h-5 w-5 text-muted-foreground" />
                            <Button variant="outline" size="sm" className="gap-2">
                                <Play className="h-4 w-4" /> Resume
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="settings" className="flex-1">
                        <div className="border-b px-6">
                            <TabsList className="h-auto gap-6 bg-transparent p-0">
                                <TabsTrigger value="warmup" className="border-b-2 border-transparent px-0 py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                    Warmup
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="border-b-2 border-transparent px-0 py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                    Settings
                                </TabsTrigger>
                                <TabsTrigger value="campaigns" className="border-b-2 border-transparent px-0 py-4 data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                    Campaigns
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <TabsContent value="warmup" className="space-y-6">
                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="rounded-full bg-purple-500/10 p-2 text-purple-500">
                                            <Flame className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-medium">Started on Nov 16, 2025</div>
                                            <div className="text-sm text-muted-foreground">16 days ago</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline">Disable</Button>
                                        <Button className="bg-green-500 hover:bg-green-600">Enable</Button>
                                    </div>
                                </div>

                                <div className="rounded-lg border p-6">
                                    <h3 className="mb-4 font-medium">Warmup Emails Sent</h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={MOCK_WARMUP_DATA}>
                                                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Bar dataKey="sent" fill="#10b981" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="settings" className="space-y-8">
                                <section className="space-y-4">
                                    <h3 className="flex items-center gap-2 font-medium">
                                        Sender name
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>First Name</Label>
                                            <Input defaultValue="Yashnil" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Name</Label>
                                            <Input defaultValue="Shukla" />
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="font-medium">Signature</h3>
                                    <div className="rounded-md border p-2 min-h-[100px]">
                                        <p className="text-sm text-muted-foreground">Start typing here...</p>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="flex items-center gap-2 font-medium">
                                        Campaign Settings
                                    </h3>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <Label>Daily campaign limit</Label>
                                            <div className="flex items-center gap-2">
                                                <Input type="number" defaultValue={300} className="w-24" />
                                                <span className="text-sm text-muted-foreground">emails</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Minimum wait time</Label>
                                            <div className="flex items-center gap-2">
                                                <Input type="number" defaultValue={1} className="w-24" />
                                                <span className="text-sm text-muted-foreground">minute(s)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <Label>Campaign slow ramp</Label>
                                            <p className="text-sm text-muted-foreground">Gradually increase emails sent per day</p>
                                        </div>
                                        <Switch defaultChecked />
                                    </div>
                                </section>
                            </TabsContent>

                            <TabsContent value="campaigns">
                                <div className="rounded-lg border">
                                    <div className="flex items-center justify-between border-b p-4">
                                        <span className="font-medium">leadgen conversion based</span>
                                        <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">Completed</span>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>

                        <div className="border-t p-4">
                            <Button className="bg-primary text-primary-foreground">Save</Button>
                        </div>
                    </Tabs>
                </div>
            </SheetContent>
        </Sheet>
    )
}
