"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, GitBranch, ArrowRight, Mail, Clock, UserCheck, AlertCircle, Zap } from "lucide-react"

export default function SubsequencesPage() {
    return (
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-white">Subsequences</h2>
                    <p className="text-sm text-gray-500 mt-1">Create conditional follow-up sequences based on lead behavior</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Add Subsequence
                </Button>
            </div>

            {/* Info Card */}
            <Card className="p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-[#333]">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-500/20 p-2 rounded-lg">
                        <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-1">How Subsequences Work</h3>
                        <p className="text-sm text-gray-400">
                            Subsequences are triggered when specific conditions are met. For example,
                            you can create a follow-up sequence that only triggers if a lead opens
                            your email but doesn't reply within 3 days.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Example Subsequence Cards */}
            <div className="space-y-4">
                <Card className="p-5 bg-[#111] border-[#222] hover:border-[#333] transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-500/10 p-2 rounded-lg">
                                <Mail className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Opened but no reply</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Trigger: Lead opened email, no reply after 3 days
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">2 steps</span>
                            <ArrowRight className="h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-[#111] border-[#222] hover:border-[#333] transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-500/10 p-2 rounded-lg">
                                <UserCheck className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Clicked link</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Trigger: Lead clicked a link in your email
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">1 step</span>
                            <ArrowRight className="h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                </Card>

                <Card className="p-5 bg-[#111] border-[#222] hover:border-[#333] transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-500/10 p-2 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                            </div>
                            <div>
                                <h4 className="font-medium text-white">Bounced recovery</h4>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Trigger: Email bounced, try alternate address
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">1 step</span>
                            <ArrowRight className="h-4 w-4 text-gray-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Empty state for when no subsequences exist */}
            <Card className="p-12 bg-[#111] border-[#222] border-dashed hidden">
                <div className="text-center">
                    <GitBranch className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Subsequences Yet</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        Create conditional follow-up sequences based on how leads interact with your emails.
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="h-4 w-4 mr-2" /> Create First Subsequence
                    </Button>
                </div>
            </Card>
        </div>
    )
}
