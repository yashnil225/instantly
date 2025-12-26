"use client"

import { Button } from "@/components/ui/button"

export default function WorkspaceGroupsPage() {
    return (
        <div className="max-w-4xl space-y-12">
            <div>
                <h3 className="text-lg font-medium text-white mb-4">Admin Workspace</h3>
                <div className="border border-[#2a2a2a] rounded-lg p-6 bg-[#0a0a0a]">
                    <p className="text-sm text-gray-400">
                        Your current workspace is not managed by an admin workspace
                    </p>
                </div>
            </div>

            <div>
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Sub Workspaces</h3>
                    <button className="text-sm text-blue-500 hover:text-blue-400 font-medium">
                        Add sub workspace
                    </button>
                </div>
                
                <div className="mt-8">
                     <p className="text-sm text-gray-500">
                        You have no sub workspaces
                    </p>
                </div>
            </div>
        </div>
    )
}
